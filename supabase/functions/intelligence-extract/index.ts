import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * intelligence-extract — Competitive intelligence extraction engine
 * 
 * POST { content: string, analysis_type: "competitor"|"market"|"positioning", goal?: string }
 * Returns: strategies, weaknesses, positioning recommendations
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResp(req, { error: "Unauthorized" }, 401);
  }
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return jsonResp(req, { error: "Unauthorized" }, 401);

  // Rate limit (user-based, post-auth)
  const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
  if (rateLimited) return rateLimited;

  if (!apiKey) return jsonResp(req, { error: "AI not configured" }, 500);

  try {
    const { content, analysis_type = "competitor", goal } = await req.json();
    if (!content || content.length < 50) {
      return jsonResp(req, { error: "Content too short (min 50 chars)" }, 400);
    }

    // Reserve neurons
    const estimatedCost = 1460; // Root2 compliant
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: estimatedCost,
    });
    if (reserveErr || !(reserved as any)?.ok) {
      return jsonResp(req, {
        error: "INSUFFICIENT_BALANCE",
        balance: (reserved as any)?.balance || 0,
        cost: estimatedCost,
      }, 402);
    }

    let settled = false;
    try {
      const systemPrompt = analysis_type === "competitor"
        ? `You are a competitive intelligence analyst. Analyze the provided competitor content and extract actionable intelligence. Return JSON with:
{
  "strategies": [{"title": "...", "description": "...", "priority": "high|medium|low", "timeline": "immediate|short|long"}],
  "weaknesses": [{"area": "...", "description": "...", "exploitability": "high|medium|low"}],
  "positioning": [{"dimension": "...", "current": "...", "recommended": "...", "rationale": "..."}],
  "attack_vectors": [{"vector": "...", "description": "...", "resources_needed": "..."}],
  "differentiation": [{"factor": "...", "description": "...", "defensibility": "high|medium|low"}]
}`
        : analysis_type === "market"
        ? `You are a market intelligence analyst. Analyze the provided market data and extract trends, opportunities, and risks. Return JSON with:
{
  "strategies": [{"title": "...", "description": "...", "opportunity_size": "...", "confidence": 0.0-1.0}],
  "weaknesses": [{"market_gap": "...", "description": "...", "addressable": true|false}],
  "positioning": [{"segment": "...", "opportunity": "...", "recommended_action": "..."}]
}`
        : `You are a strategic positioning analyst. Analyze content and provide positioning recommendations. Return JSON with:
{
  "strategies": [{"title": "...", "description": "...", "impact": "high|medium|low"}],
  "weaknesses": [{"current_position": "...", "gap": "...", "fix": "..."}],
  "positioning": [{"axis": "...", "from": "...", "to": "...", "why": "..."}]
}`;

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `CONTENT TO ANALYZE:\n${content.slice(0, 10000)}\n\nGOAL: ${goal || "Extract maximum competitive advantage"}` },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!resp.ok) throw new Error(`AI_ERROR_${resp.status}`);
      const aiData = await resp.json();
      const report = JSON.parse(aiData.choices?.[0]?.message?.content || "{}");

      // Store report
      const { data: job } = await supabase.from("neuron_jobs").insert({
        author_id: user.id,
        worker_type: "intelligence_extract",
        status: "completed",
        input: { analysis_type, content_length: content.length, goal },
        result: report,
        completed_at: new Date().toISOString(),
      }).select("id").single();

      await supabase.from("intelligence_reports").insert({
        author_id: user.id,
        report_type: analysis_type === "competitor" ? "competitor_analysis" : analysis_type === "market" ? "market_analysis" : "positioning_analysis",
        title: `${analysis_type} Analysis — ${new Date().toLocaleDateString()}`,
        input_summary: content.slice(0, 200),
        strategies: report.strategies || [],
        weaknesses: report.weaknesses || [],
        positioning: report.positioning || [],
        full_report: JSON.stringify(report),
        cost_neurons: estimatedCost,
        job_id: job?.id,
      });

      // Settle neurons
      await supabase.rpc("settle_neurons", { _user_id: user.id, _amount: estimatedCost });
      settled = true;

      return jsonResp(req, {
        status: "COMPLETED",
        job_id: job?.id,
        cost: estimatedCost,
        report,
      });
    } catch (innerErr) {
      if (!settled) {
        try { await supabase.rpc("release_neurons", { _user_id: user.id, _amount: estimatedCost }); } catch (_) { /* ignore */ }
      }
      throw innerErr;
    }
  } catch (err) {
    console.error("intelligence-extract error:", err);
    return jsonResp(req, { error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function jsonResp(req: Request, data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}
