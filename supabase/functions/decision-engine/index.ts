import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * DECISION ENGINE — Sequential Pipeline
 * 
 * 5 phases: OBSERVE → VALIDATE → AUDIT → CONVERSION → DECISION
 * 
 * Input: raw findings (from crawler, agent, or manual)
 * Output: scored action blueprint with prioritized decisions
 * 
 * This is NOT a crawler. It's a Decision Engine that takes observations
 * and produces quantified, prioritized, actionable blueprints.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface Finding {
  type: string;
  source: string;
  data: Record<string, unknown>;
  raw_text?: string;
}

interface ScoredDecision {
  action: string;
  priority: "P0" | "P1" | "P2" | "P3";
  target: string;
  impact: {
    psychological: string;
    commercial: string;
    technical: string;
  };
  scores: {
    clarity: number;
    redundancy: number;
    visual_consistency: number;
    conversion_impact: number;
    technical_integrity: number;
  };
  final_score: number;
  method: string[];
  estimated_effort: "trivial" | "small" | "medium" | "large";
}

interface PhaseResult {
  phase: string;
  status: "completed" | "failed" | "skipped";
  duration_ms: number;
  output: Record<string, unknown>;
  metrics: Record<string, number>;
}

interface ActionBlueprint {
  system_state: {
    total_paths: number;
    broken_paths: number;
    external_dependencies: number;
    design_tokens_used: number;
    cta_variants: number;
  };
  structural_verdict: "coherent" | "overfragmented" | "inconsistent";
  visual_verdict: "unified" | "drifted" | "broken";
  commercial_verdict: "high_conversion" | "medium" | "leaking";
  decisions: ScoredDecision[];
  compression_actions: string[];
  integration_map: Array<{
    source: string;
    element: string;
    target: string;
    issue: string;
    decision: string;
  }>;
  execution_plan: {
    P0: string[];
    P1: string[];
    P2: string[];
  };
}

// ═══════════════════════════════════════
// AI CALLER
// ═══════════════════════════════════════

async function callAI(system: string, prompt: string): Promise<any> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("AI error:", res.status, t);
    if (res.status === 429) throw new Error("RATE_LIMITED");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`AI_ERROR_${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":decision-engine", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    return JSON.parse(content);
  } catch {
    console.error("Failed to parse AI JSON:", content.slice(0, 500));
    throw new Error("AI_PARSE_ERROR");
  }
}

function jsonRes(req: Request, body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

// ═══════════════════════════════════════
// PHASE 1 — OBSERVE (Crawl + Detect + Extract)
// ═══════════════════════════════════════

async function phaseObserve(findings: Finding[]): Promise<PhaseResult> {
  const start = Date.now();

  const result = await callAI(
    `You are an observation engine. Analyze raw findings and produce structured facts.
Return JSON:
{
  "facts": [
    {
      "fact_id": "f_001",
      "category": "route|design|content|conversion|technical",
      "description": "...",
      "source": "...",
      "severity": "critical|high|medium|low",
      "quantified_data": { ... }
    }
  ],
  "metrics": {
    "total_paths_found": N,
    "external_links": N,
    "anomalies_detected": N,
    "content_blocks": N,
    "cta_count": N,
    "unique_design_tokens": N
  }
}
Be precise. Every fact must have quantified_data. No narratives.`,
    `RAW FINDINGS (${findings.length} items):\n${JSON.stringify(findings, null, 1).slice(0, 12000)}`
  );

  return {
    phase: "observe",
    status: "completed",
    duration_ms: Date.now() - start,
    output: result,
    metrics: result.metrics || {},
  };
}

// ═══════════════════════════════════════
// PHASE 2 — VALIDATE (Routing + Integrity)
// ═══════════════════════════════════════

async function phaseValidate(observeOutput: any): Promise<PhaseResult> {
  const start = Date.now();

  const result = await callAI(
    `You are a routing and integrity validator. Analyze observed facts for broken routes, dead links, missing pages, and structural inconsistencies.
Return JSON:
{
  "route_issues": [
    {
      "path": "/...",
      "issue_type": "broken_link|missing_page|redirect_loop|orphan_route|duplicate_route",
      "severity": "critical|high|medium|low",
      "status_code": N,
      "linked_from": ["..."],
      "fix_recommendation": "..."
    }
  ],
  "integrity_issues": [
    {
      "type": "missing_component|broken_import|dead_reference|inconsistent_data",
      "location": "...",
      "description": "...",
      "severity": "critical|high|medium|low"
    }
  ],
  "metrics": {
    "total_routes_checked": N,
    "broken_routes": N,
    "orphan_routes": N,
    "duplicate_routes": N,
    "integrity_score": 0.0-1.0
  }
}`,
    `OBSERVED FACTS:\n${JSON.stringify(observeOutput, null, 1).slice(0, 10000)}`
  );

  return {
    phase: "validate",
    status: "completed",
    duration_ms: Date.now() - start,
    output: result,
    metrics: result.metrics || {},
  };
}

// ═══════════════════════════════════════
// PHASE 3 — AUDIT (Visual + Design Consistency)
// ═══════════════════════════════════════

async function phaseAudit(observeOutput: any, validateOutput: any): Promise<PhaseResult> {
  const start = Date.now();

  const result = await callAI(
    `You are a visual system auditor. Detect design drift, inconsistent tokens, typography violations, spacing irregularities, and color system breaches.
Return JSON:
{
  "design_issues": [
    {
      "type": "color_drift|typography_inconsistency|spacing_violation|component_drift|token_mismatch",
      "location": "...",
      "expected": "...",
      "actual": "...",
      "severity": "critical|high|medium|low",
      "fix": "..."
    }
  ],
  "token_analysis": {
    "unique_colors_used": N,
    "recommended_max": N,
    "hardcoded_colors": N,
    "semantic_tokens_used": N,
    "font_variants": N,
    "spacing_scale_adherence": 0.0-1.0
  },
  "visual_verdict": "unified|drifted|broken",
  "metrics": {
    "design_consistency_score": 0.0-1.0,
    "token_compliance": 0.0-1.0,
    "total_violations": N
  }
}`,
    `OBSERVATIONS:\n${JSON.stringify(observeOutput, null, 1).slice(0, 6000)}\n\nVALIDATION:\n${JSON.stringify(validateOutput, null, 1).slice(0, 4000)}`
  );

  return {
    phase: "audit",
    status: "completed",
    duration_ms: Date.now() - start,
    output: result,
    metrics: result.metrics || {},
  };
}

// ═══════════════════════════════════════
// PHASE 4 — CONVERSION (Friction + Leak Detection)
// ═══════════════════════════════════════

async function phaseConversion(observeOutput: any, auditOutput: any): Promise<PhaseResult> {
  const start = Date.now();

  const result = await callAI(
    `You are a conversion analysis engine. Detect friction points, conversion leaks, CTA issues, funnel breaks, and monetization gaps.
Return JSON:
{
  "friction_points": [
    {
      "location": "...",
      "type": "unclear_cta|broken_funnel|missing_social_proof|excessive_steps|pricing_confusion|value_unclear",
      "impact": "high|medium|low",
      "psychological_effect": "...",
      "commercial_loss_estimate": "...",
      "fix": "..."
    }
  ],
  "cta_analysis": {
    "total_ctas": N,
    "redundant_ctas": N,
    "clear_ctas": N,
    "conflicting_ctas": N,
    "recommended_max": N
  },
  "funnel_integrity": {
    "awareness_to_interest": 0.0-1.0,
    "interest_to_action": 0.0-1.0,
    "action_to_conversion": 0.0-1.0,
    "overall_score": 0.0-1.0
  },
  "commercial_verdict": "high_conversion|medium|leaking",
  "metrics": {
    "conversion_score": 0.0-1.0,
    "friction_count": N,
    "leak_severity_total": N
  }
}`,
    `OBSERVATIONS:\n${JSON.stringify(observeOutput, null, 1).slice(0, 6000)}\n\nAUDIT:\n${JSON.stringify(auditOutput, null, 1).slice(0, 4000)}`
  );

  return {
    phase: "conversion",
    status: "completed",
    duration_ms: Date.now() - start,
    output: result,
    metrics: result.metrics || {},
  };
}

// ═══════════════════════════════════════
// PHASE 5 — DECISION (Merge + Prioritize + Blueprint)
// ═══════════════════════════════════════

async function phaseDecision(
  observeOutput: any,
  validateOutput: any,
  auditOutput: any,
  conversionOutput: any
): Promise<PhaseResult> {
  const start = Date.now();

  const result = await callAI(
    `You are the Decision Engine. Merge all analysis into a single action blueprint.

SCORING DIMENSIONS (1-10 each):
- clarity: How clear is the issue?
- redundancy: How much duplication exists?
- visual_consistency: Design system adherence
- conversion_impact: Effect on revenue/conversion
- technical_integrity: Code/routing correctness

RULES:
- Every finding MUST become a scored decision
- Decisions sorted by priority: P0 (immediate) > P1 (structural) > P2 (optimization) > P3 (nice-to-have)
- Include compression_actions: what to merge/remove/simplify
- Include integration_map: cross-element relationships
- Maximum 15 decisions (force prioritization)

Return JSON:
{
  "system_state": {
    "total_paths": N,
    "broken_paths": N,
    "external_dependencies": N,
    "design_tokens_used": N,
    "cta_variants": N
  },
  "structural_verdict": "coherent|overfragmented|inconsistent",
  "visual_verdict": "unified|drifted|broken",
  "commercial_verdict": "high_conversion|medium|leaking",
  "decisions": [
    {
      "action": "fix|merge|remove|redesign|add|compress",
      "priority": "P0|P1|P2|P3",
      "target": "specific element or path",
      "impact": {
        "psychological": "...",
        "commercial": "...",
        "technical": "..."
      },
      "scores": {
        "clarity": N,
        "redundancy": N,
        "visual_consistency": N,
        "conversion_impact": N,
        "technical_integrity": N
      },
      "final_score": N,
      "method": ["step1", "step2"],
      "estimated_effort": "trivial|small|medium|large"
    }
  ],
  "compression_actions": [
    "merge X into Y",
    "remove redundant Z",
    "unify tokens A/B/C"
  ],
  "integration_map": [
    {
      "source": "page/component",
      "element": "specific element",
      "target": "related target",
      "issue": "what's wrong",
      "decision": "what to do"
    }
  ],
  "execution_plan": {
    "P0": ["immediate fix 1", "immediate fix 2"],
    "P1": ["structural change 1"],
    "P2": ["optimization 1"]
  }
}`,
    `PHASE RESULTS:
    
OBSERVE:\n${JSON.stringify(observeOutput, null, 1).slice(0, 4000)}

VALIDATE:\n${JSON.stringify(validateOutput, null, 1).slice(0, 3000)}

AUDIT:\n${JSON.stringify(auditOutput, null, 1).slice(0, 3000)}

CONVERSION:\n${JSON.stringify(conversionOutput, null, 1).slice(0, 3000)}`
  );

  return {
    phase: "decision",
    status: "completed",
    duration_ms: Date.now() - start,
    output: result,
    metrics: {
      total_decisions: result.decisions?.length || 0,
      p0_count: (result.decisions || []).filter((d: any) => d.priority === "P0").length,
      p1_count: (result.decisions || []).filter((d: any) => d.priority === "P1").length,
      p2_count: (result.decisions || []).filter((d: any) => d.priority === "P2").length,
      avg_score: (result.decisions || []).length > 0
        ? (result.decisions || []).reduce((s: number, d: any) => s + (d.final_score || 0), 0) / result.decisions.length
        : 0,
    },
  };
}

// ═══════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, svcKey);

  // AUTH
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonRes({ error: "Unauthorized" }, 401);

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authErr || !user) return jsonRes({ error: "Invalid token" }, 401);

  try {
    const body = await req.json();
    const { findings, context, mode = "full" } = body;

    if (!findings || !Array.isArray(findings) || findings.length === 0) {
      return jsonRes({ error: "findings array is required (min 1 item)" }, 400);
    }

    const phases: PhaseResult[] = [];
    const startTotal = Date.now();

    // ═══ PHASE 1: OBSERVE ═══
    console.log("[DECISION-ENGINE] Phase 1: OBSERVE");
    const observe = await phaseObserve(findings);
    phases.push(observe);
    console.log(`[DECISION-ENGINE] OBSERVE completed in ${observe.duration_ms}ms`);

    // ═══ PHASE 2: VALIDATE ═══
    console.log("[DECISION-ENGINE] Phase 2: VALIDATE");
    const validate = await phaseValidate(observe.output);
    phases.push(validate);
    console.log(`[DECISION-ENGINE] VALIDATE completed in ${validate.duration_ms}ms`);

    // ═══ PHASE 3: AUDIT ═══
    console.log("[DECISION-ENGINE] Phase 3: AUDIT");
    const audit = await phaseAudit(observe.output, validate.output);
    phases.push(audit);
    console.log(`[DECISION-ENGINE] AUDIT completed in ${audit.duration_ms}ms`);

    // ═══ PHASE 4: CONVERSION ═══
    if (mode === "full" || mode === "conversion") {
      console.log("[DECISION-ENGINE] Phase 4: CONVERSION");
      const conversion = await phaseConversion(observe.output, audit.output);
      phases.push(conversion);
      console.log(`[DECISION-ENGINE] CONVERSION completed in ${conversion.duration_ms}ms`);
    }

    // ═══ PHASE 5: DECISION ═══
    console.log("[DECISION-ENGINE] Phase 5: DECISION");
    const conversionOutput = phases.find(p => p.phase === "conversion")?.output || {};
    const decision = await phaseDecision(
      observe.output,
      validate.output,
      audit.output,
      conversionOutput
    );
    phases.push(decision);
    console.log(`[DECISION-ENGINE] DECISION completed in ${decision.duration_ms}ms`);

    const totalDuration = Date.now() - startTotal;

    // Store result for memory
    await supabase.from("neuron_jobs").insert({
      author_id: user.id,
      worker_type: "decision_engine",
      status: "completed",
      input: {
        findings_count: findings.length,
        context,
        mode,
      },
      result: {
        blueprint: decision.output,
        phase_metrics: phases.map(p => ({
          phase: p.phase,
          status: p.status,
          duration_ms: p.duration_ms,
          metrics: p.metrics,
        })),
        total_duration_ms: totalDuration,
      },
      completed_at: new Date().toISOString(),
    }).catch(err => console.error("Failed to store job:", err));

    return jsonRes({
      status: "COMPLETED",
      total_duration_ms: totalDuration,
      phases: phases.map(p => ({
        phase: p.phase,
        status: p.status,
        duration_ms: p.duration_ms,
        metrics: p.metrics,
      })),
      blueprint: decision.output as ActionBlueprint,
      raw_phases: {
        observe: observe.output,
        validate: validate.output,
        audit: audit.output,
        conversion: conversionOutput,
      },
    });

  } catch (err) {
    console.error("Decision engine error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (msg === "RATE_LIMITED") {
      return jsonRes({ error: "Rate limited. Try again in 30 seconds." }, 429);
    }
    if (msg === "CREDITS_EXHAUSTED") {
      return jsonRes({ error: "AI credits exhausted." }, 402);
    }

    return jsonRes({ error: msg }, 500);
  }
});
