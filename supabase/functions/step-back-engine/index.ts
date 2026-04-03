/**
 * Step Back Service Generation Engine
 * 
 * Implements the Cusnir_OS causal reasoning pipeline:
 *   Problem → Causal Chain → Control Points → Mechanisms → OTOS match → MMS compose → LCSS align
 * 
 * This is the highest-level intelligence layer that can generate new services
 * by reverse-engineering business problems into executable service architectures.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const inputSchema = z.object({
  problem: z.string().min(10).max(3000),
  domain: z.string().max(100).optional(),
  depth: z.enum(["shallow", "standard", "deep"]).default("standard"),
  auto_compose: z.boolean().default(false),
});

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":step-back-engine", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const client = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: authErr } = await client.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { problem, domain, depth, auto_compose } = parsed.data;

    // ═══ STEP 1: Causal Chain Analysis ═══
    const causalPrompt = buildCausalPrompt(problem, domain, depth);
    const causalResult = await callLLM(causalPrompt);

    // ═══ STEP 2: Match OTOS from registry ═══
    const { data: otosPool } = await client.from("os_otos")
      .select("id, formula_name, intent, mechanism, domain, tier, score_json, neurons_cost")
      .limit(500);

    const mechanisms = causalResult.mechanisms || [];
    const controlPoints = causalResult.control_points || [];

    // Score each OTOS against extracted mechanisms
    const scoredOtos = (otosPool || []).map((otos: any) => {
      let relevance = 0;
      const otosMech = (otos.mechanism || "").toLowerCase();
      const otosIntent = (otos.intent || "").toLowerCase();

      for (const mech of mechanisms) {
        if (otosMech.includes(mech.toLowerCase()) || otosIntent.includes(mech.toLowerCase())) {
          relevance += 0.3;
        }
      }
      for (const cp of controlPoints) {
        if (otosIntent.includes(cp.toLowerCase())) {
          relevance += 0.2;
        }
      }
      if (domain && (otos.domain || "").toLowerCase().includes(domain.toLowerCase())) {
        relevance += 0.15;
      }

      // Boost by tier
      const tierBoost = { S: 0.2, A: 0.15, B: 0.1, C: 0.05 };
      relevance += tierBoost[otos.tier as keyof typeof tierBoost] || 0;

      return { ...otos, relevance: Math.min(relevance, 1) };
    })
    .filter((o: any) => o.relevance > 0.1)
    .sort((a: any, b: any) => b.relevance - a.relevance)
    .slice(0, 20);

    // ═══ STEP 3: Compose MMS (if auto_compose) ═══
    let composedMMS = null;
    if (auto_compose && scoredOtos.length >= 3) {
      const topOtos = scoredOtos.slice(0, 7);
      composedMMS = {
        name: `SB_${Date.now()}`,
        display_name: `Step-Back System: ${problem.slice(0, 50)}`,
        nodes: topOtos.map((o: any, i: number) => ({
          otos_id: o.id,
          formula_name: o.formula_name,
          role: i === 0 ? "trigger" : i === topOtos.length - 1 ? "output" : "processor",
          step_order: i + 1,
          relevance: o.relevance,
        })),
        total_neurons: topOtos.reduce((s: number, o: any) => s + (o.neurons_cost || 5), 0),
        mechanism_coverage: mechanisms.length > 0
          ? mechanisms.filter((m: string) =>
              topOtos.some((o: any) => (o.mechanism || "").toLowerCase().includes(m.toLowerCase()))
            ).length / mechanisms.length
          : 0,
      };
    }

    // ═══ STEP 4: LCSS Alignment ═══
    const { data: lcssPool } = await client.from("os_lcss")
      .select("id, program_name, macro_intent, description")
      .limit(10);

    const lcssAlignment = (lcssPool || []).map((lcss: any) => {
      const macroIntent = (lcss.macro_intent || "").toLowerCase();
      const desc = (lcss.description || "").toLowerCase();
      let fit = 0;
      for (const cp of controlPoints) {
        if (macroIntent.includes(cp.toLowerCase()) || desc.includes(cp.toLowerCase())) fit += 0.25;
      }
      return { id: lcss.id, program_name: lcss.program_name, fit: Math.min(fit, 1) };
    }).filter((l: any) => l.fit > 0.1).sort((a: any, b: any) => b.fit - a.fit);

    // ═══ STEP 5: Save execution to memory ═══
    await client.from("os_executions").insert({
      user_id: user.id,
      agent_key: "step_back_engine",
      input_data: { problem, domain, depth },
      output_data: {
        causal_chain: causalResult,
        matched_otos: scoredOtos.length,
        composed_mms: !!composedMMS,
        lcss_aligned: lcssAlignment.length,
      },
      status: "completed",
      quality_score: scoredOtos.length > 0 ? Math.min(scoredOtos[0].relevance + 0.3, 1) : 0.3,
      neurons_cost: 15,
    });

    // ═══ Response ═══
    const result = {
      causal_analysis: {
        root_cause: causalResult.root_cause,
        causal_chain: causalResult.causal_chain,
        control_points: controlPoints,
        mechanisms: mechanisms,
      },
      matched_services: scoredOtos.map((o: any) => ({
        id: o.id,
        name: o.formula_name,
        intent: o.intent,
        mechanism: o.mechanism,
        tier: o.tier,
        neurons_cost: o.neurons_cost,
        relevance_score: o.relevance,
      })),
      composed_system: composedMMS,
      program_alignment: lcssAlignment,
      meta: {
        depth,
        total_mechanisms: mechanisms.length,
        total_matched: scoredOtos.length,
        coverage: composedMMS?.mechanism_coverage || 0,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[step-back-engine] Error:", e);
    const ch = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...ch, "Content-Type": "application/json" },
    });
  }
});

// ═══ LLM Call ═══
async function callLLM(prompt: string): Promise<any> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    // Fallback: deterministic extraction
    return extractCausalDeterministic(prompt);
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a causal analysis expert. Return ONLY valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    // Parse JSON, handling code fences
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[step-back-engine] LLM error, using deterministic:", e);
    return extractCausalDeterministic(prompt);
  }
}

function extractCausalDeterministic(prompt: string): any {
  const words = prompt.toLowerCase().split(/\s+/);
  const businessKeywords = ["revenue", "conversion", "retention", "authority", "growth", "scale", "clients", "venituri", "conversie", "retenție"];
  const mechanisms = businessKeywords.filter(k => words.some(w => w.includes(k)));

  return {
    root_cause: "Insufficient systematic approach to problem decomposition",
    causal_chain: ["Problem identified", "No structured mechanism", "Fragmented execution", "Suboptimal outcomes"],
    control_points: mechanisms.length > 0 ? mechanisms : ["strategy", "execution", "measurement"],
    mechanisms: mechanisms.length > 0 ? mechanisms : ["analysis", "optimization", "automation"],
  };
}

function buildCausalPrompt(problem: string, domain: string | undefined, depth: string): string {
  const depthInstructions = {
    shallow: "Identify 2-3 causes and 2-3 mechanisms.",
    standard: "Identify 4-6 causes with control points and 4-6 mechanisms.",
    deep: "Perform exhaustive causal analysis with 6-10 causes, branching paths, and 6-10 mechanisms.",
  };

  return `Analyze this business problem using Step Back causal reasoning:

PROBLEM: ${problem}
${domain ? `DOMAIN: ${domain}` : ""}
DEPTH: ${depthInstructions[depth as keyof typeof depthInstructions]}

Return JSON with this exact structure:
{
  "root_cause": "The fundamental root cause",
  "causal_chain": ["cause1 → effect1", "cause2 → effect2", ...],
  "control_points": ["point where intervention changes outcome", ...],
  "mechanisms": ["specific mechanism/strategy to apply", ...]
}

Focus on actionable, specific mechanisms that map to marketing, sales, content, positioning, pricing, retention, and growth strategies.`;
}
