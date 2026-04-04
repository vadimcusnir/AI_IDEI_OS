import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * extract-three-axis — 3-axis intelligence extraction motor
 * POST { neuron_id: number }
 * Extracts psychological, narrative, and commercial intelligence from a neuron.
 */

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const AXIS_PROMPTS: Record<string, string> = {
  psychological: `You are a cognitive psychology analyst. Extract from this content:
1. cognitive_patterns: Array of mental models, biases, heuristics detected
2. decision_frameworks: Decision-making structures used
3. behavioral_triggers: Emotional/behavioral triggers present
4. manipulation_vectors: Persuasion techniques (ethical analysis)
5. identity_signals: Self-concept and identity markers
Output strict JSON with these 5 keys.`,

  narrative: `You are a narrative intelligence analyst. Extract from this content:
1. story_structures: Narrative arcs and storytelling patterns
2. persuasion_techniques: Rhetorical devices and argument structures
3. framing_strategies: How information is framed/reframed
4. hook_patterns: Attention capture mechanisms
5. authority_signals: Credibility and authority building techniques
Output strict JSON with these 5 keys.`,

  commercial: `You are a commercial intelligence analyst. Extract from this content:
1. value_propositions: Explicit and implicit value offers
2. pricing_signals: Pricing psychology and anchoring
3. market_positioning: Competitive positioning strategies
4. growth_levers: Scalability and growth mechanisms
5. monetization_patterns: Revenue model indicators
Output strict JSON with these 5 keys.`,
};

function jsonResp(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return jsonResp({ error: "Unauthorized" }, 401, req);
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return jsonResp({ error: "Unauthorized" }, 401, req);

  const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 5, windowSeconds: 60 }, getCorsHeaders(req));
  if (rateLimited) return rateLimited;

  if (!apiKey) return jsonResp({ error: "AI not configured" }, 500, req);

  try {
    const { neuron_id } = await req.json();
    if (!neuron_id) return jsonResp({ error: "neuron_id required" }, 400, req);

    // Fetch neuron content
    const { data: neuron, error: nErr } = await supabase
      .from("neurons")
      .select("id, content, title, category, user_id")
      .eq("id", neuron_id)
      .single();

    if (nErr || !neuron) return jsonResp({ error: "Neuron not found" }, 404, req);
    if (neuron.user_id !== user.id) return jsonResp({ error: "Access denied" }, 403, req);

    const contentBlock = `Title: ${neuron.title || "Untitled"}\nCategory: ${neuron.category || "general"}\n\n${neuron.content}`;

    // Run all 3 axes in parallel
    const axes = ["psychological", "narrative", "commercial"] as const;
    const results = await Promise.all(
      axes.map(async (axis) => {
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: AXIS_PROMPTS[axis] },
              { role: "user", content: contentBlock.substring(0, 4000) },
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });

        const aiData = await resp.json();
        const raw = aiData.choices?.[0]?.message?.content || "{}";
        let cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start >= 0 && end > start) cleaned = cleaned.substring(start, end + 1);

        let extraction = {};
        try { extraction = JSON.parse(cleaned); } catch { extraction = { raw: cleaned }; }

        return { axis, extraction, confidence: aiData.choices?.[0]?.finish_reason === "stop" ? 0.85 : 0.5 };
      })
    );

    // Store results
    const rows = results.map((r) => ({
      neuron_id,
      user_id: user.id,
      axis: r.axis,
      extraction: r.extraction,
      confidence: r.confidence,
    }));

    const { error: insertErr } = await supabase.from("axis_extraction_results").insert(rows);
    if (insertErr) throw insertErr;

    // Update neuron content_category based on dominant axis
    const maxAxis = results.reduce((a, b) => (b.confidence > a.confidence ? b : a));
    await supabase.from("neurons").update({ content_category: maxAxis.axis }).eq("id", neuron_id);

    return jsonResp({ success: true, results }, 200, req);
  } catch (e) {
    console.error("[extract-three-axis]", e);
    return jsonResp({ error: "Extraction failed" }, 500, req);
  }
});
