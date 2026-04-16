import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * Phase 8 — Command Engine
 * Decides WHAT is worth executing, not just HOW.
 * 
 * Actions:
 *   "analyze" — run full decision pipeline on user_goal
 *   "execute" — mark a decision as executed, trigger agent sequences
 *   "history" — get past decisions for user
 * 
 * Decision Pipeline (6 stages):
 *   1. context_aggregation — gather system state
 *   2. objective_clarification — map goal to command type
 *   3. opportunity_detection — find matching services/actions
 *   4. risk_analysis — evaluate warnings
 *   5. action_selection — rank by priority engine
 *   6. execution_plan — produce final plan
 * 
 * Priority Engine formula:
 *   score = impact×w1 + revenue_potential×w2 + urgency×w3 + (11-effort)×w4
 */

const PIPELINE_STAGES = [
  "context_aggregation",
  "objective_clarification",
  "opportunity_detection",
  "risk_analysis",
  "action_selection",
  "execution_plan",
] as const;

interface ActionCandidate {
  service_unit_id?: string;
  title: string;
  type: string;
  impact: number;
  revenue_potential: number;
  urgency: number;
  effort: number;
  priority_score: number;
  reason: string;
  estimated_credits: number;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Auth
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":command-engine", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "analyze": {
        const { user_goal: rawGoal, context } = body;
        if (!rawGoal || typeof rawGoal !== "string" || rawGoal.length < 3) {
          return new Response(JSON.stringify({ error: "user_goal required (min 3 chars)" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const user_goal = sanitizeUserInput(rawGoal, 2000);

        const result = await runDecisionPipeline(supabase, user.id, user_goal, context || {});
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "execute": {
        const { decision_id } = body;
        if (!decision_id) {
          return new Response(JSON.stringify({ error: "decision_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await supabase.from("command_decisions").update({
          status: "executing",
          executed_at: new Date().toISOString(),
        }).eq("id", decision_id).eq("user_id", user.id);

        return new Response(JSON.stringify({ success: true, status: "executing" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "history": {
        const { limit = 20 } = body;
        const { data } = await supabase.from("command_decisions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        return new Response(JSON.stringify({ decisions: data || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action. Use: analyze, execute, history" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("command-engine error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* ═══════════════════════════════════════════════════════════
   DECISION PIPELINE — 6 stages
   ═══════════════════════════════════════════════════════════ */

async function runDecisionPipeline(
  supabase: any,
  userId: string,
  userGoal: string,
  context: Record<string, any>,
) {
  const startTime = Date.now();

  // Create decision record
  const { data: decision, error: decErr } = await supabase.from("command_decisions").insert({
    user_id: userId,
    user_goal: userGoal,
    status: "analyzing",
  }).select("id").single();

  if (decErr) throw decErr;
  const decisionId = decision.id;

  // Load command type weights
  const { data: commandTypes } = await supabase.from("command_types")
    .select("*").eq("is_active", true);
  const typeWeights: Record<string, any> = {};
  for (const ct of commandTypes || []) {
    typeWeights[ct.type_key] = ct;
  }

  const stageResults: Record<string, any> = {};

  // ── Stage 1: Context Aggregation ──
  const s1Start = Date.now();
  const systemState = await gatherSystemState(supabase, userId);
  stageResults.context_aggregation = systemState;
  await saveStage(supabase, decisionId, 1, "context_aggregation", { userGoal, context }, systemState, Date.now() - s1Start);

  // ── Stage 2: Objective Clarification ──
  const s2Start = Date.now();
  const objective = classifyObjective(userGoal, systemState);
  stageResults.objective_clarification = objective;
  await saveStage(supabase, decisionId, 2, "objective_clarification", { userGoal }, objective, Date.now() - s2Start);

  // ── Stage 3: Opportunity Detection ──
  const s3Start = Date.now();
  const opportunities = await detectOpportunities(supabase, objective, systemState);
  stageResults.opportunity_detection = opportunities;
  await saveStage(supabase, decisionId, 3, "opportunity_detection", objective, opportunities, Date.now() - s3Start);

  // ── Stage 4: Risk Analysis ──
  const s4Start = Date.now();
  const risks = analyzeRisks(systemState, opportunities);
  stageResults.risk_analysis = risks;
  await saveStage(supabase, decisionId, 4, "risk_analysis", { systemState: "ref" }, risks, Date.now() - s4Start);

  // ── Stage 5: Action Selection (Priority Engine) ──
  const s5Start = Date.now();
  const rankedActions = prioritizeActions(opportunities.candidates, typeWeights, objective.command_type);
  stageResults.action_selection = { ranked: rankedActions.slice(0, 10) };
  await saveStage(supabase, decisionId, 5, "action_selection", { candidates_count: opportunities.candidates.length }, { top_actions: rankedActions.slice(0, 5) }, Date.now() - s5Start);

  // ── Stage 6: Execution Plan ──
  const s6Start = Date.now();
  const plan = buildExecutionPlan(rankedActions, risks, objective);
  stageResults.execution_plan = plan;
  await saveStage(supabase, decisionId, 6, "execution_plan", {}, plan, Date.now() - s6Start);

  // Update decision with final results
  const topScore = rankedActions.length > 0 ? rankedActions[0].priority_score : 0;
  await supabase.from("command_decisions").update({
    system_state: systemState,
    pipeline_result: stageResults,
    next_actions: plan.next_actions,
    priority_tasks: plan.priority_tasks,
    agent_sequences: plan.agent_sequences,
    warnings: risks.warnings,
    command_type: objective.command_type,
    priority_score: topScore,
    status: "suggested",
  }).eq("id", decisionId);

  return {
    decision_id: decisionId,
    command_type: objective.command_type,
    priority_score: topScore,
    next_actions: plan.next_actions,
    priority_tasks: plan.priority_tasks,
    warnings: risks.warnings,
    pipeline_duration_ms: Date.now() - startTime,
  };
}

/* ═══ Stage Helpers ═══ */

async function gatherSystemState(supabase: any, userId: string) {
  const [jobsRes, balanceRes, capRes, unitsRes, artifactsRes] = await Promise.all([
    supabase.from("neuron_jobs").select("status").eq("author_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("neuron_wallets").select("balance").eq("user_id", userId).maybeSingle(),
    supabase.from("capacity_state").select("*").limit(1).maybeSingle(),
    supabase.from("service_units").select("id, level, status").limit(200),
    supabase.from("artifacts").select("id, status").eq("author_id", userId).limit(100),
  ]);

  const jobs = jobsRes.data || [];
  const failedJobs = jobs.filter((j: any) => j.status === "failed").length;
  const completedJobs = jobs.filter((j: any) => j.status === "completed").length;

  return {
    user_balance: balanceRes.data?.balance || 0,
    jobs_total: jobs.length,
    jobs_failed: failedJobs,
    jobs_completed: completedJobs,
    fail_rate: jobs.length > 0 ? failedJobs / jobs.length : 0,
    artifacts_count: (artifactsRes.data || []).length,
    capacity: capRes.data || {},
    active_services: (unitsRes.data || []).filter((u: any) => u.status === "active").length,
    draft_services: (unitsRes.data || []).filter((u: any) => u.status === "draft").length,
  };
}

function classifyObjective(userGoal: string, systemState: any) {
  const goal = userGoal.toLowerCase();

  const typeScores: Record<string, number> = {
    generate_revenue: 0,
    improve_conversion: 0,
    build_authority: 0,
    optimize_system: 0,
    reduce_risk: 0,
  };

  // Keyword matching
  const keywordMap: Record<string, string[]> = {
    generate_revenue: ["revenue", "money", "sell", "monetize", "price", "profit", "income", "bani", "venituri", "vând"],
    improve_conversion: ["convert", "funnel", "optimize", "improve", "grow", "increase", "rate", "conversie", "optimizare"],
    build_authority: ["authority", "brand", "thought leader", "publish", "credibility", "reputation", "autoritate", "reputație"],
    optimize_system: ["system", "performance", "speed", "scale", "infrastructure", "optimize", "sistem", "performanță"],
    reduce_risk: ["risk", "security", "compliance", "audit", "fix", "bug", "error", "risc", "securitate"],
  };

  for (const [type, keywords] of Object.entries(keywordMap)) {
    for (const kw of keywords) {
      if (goal.includes(kw)) typeScores[type] += 1;
    }
  }

  // Context bonuses
  if (systemState.fail_rate > 0.1) typeScores.reduce_risk += 2;
  if (systemState.draft_services > 5) typeScores.generate_revenue += 1;
  if (systemState.artifacts_count < 10) typeScores.improve_conversion += 1;

  const bestType = Object.entries(typeScores).sort((a, b) => b[1] - a[1])[0];
  const confidence = bestType[1] > 0 ? Math.min(0.95, 0.4 + bestType[1] * 0.15) : 0.5;

  return {
    command_type: bestType[0],
    confidence,
    all_scores: typeScores,
    clarified_goal: userGoal,
  };
}

async function detectOpportunities(supabase: any, objective: any, systemState: any) {
  // Find matching service units by domain alignment
  const { data: units } = await supabase.from("service_units")
    .select("id, name, level, single_output, single_function, mechanism, cost_json, status")
    .eq("status", "active")
    .limit(50);

  const candidates: ActionCandidate[] = [];

  for (const unit of units || []) {
    const cost = unit.cost_json?.neurons_cost || 100;
    const impact = Math.random() * 4 + 6; // 6-10 placeholder — in production, use AI scoring
    const revPotential = objective.command_type === "generate_revenue" ? 8 : 5;
    const urgency = systemState.fail_rate > 0.1 ? 9 : 5;
    const effort = unit.level === "otos" ? 3 : unit.level === "mms" ? 6 : 8;

    candidates.push({
      service_unit_id: unit.id,
      title: unit.name,
      type: objective.command_type,
      impact,
      revenue_potential: revPotential,
      urgency,
      effort,
      priority_score: 0, // calculated in stage 5
      reason: `${unit.single_function} → ${unit.single_output}`,
      estimated_credits: cost,
    });
  }

  // Add system-level opportunities
  if (systemState.draft_services > 0) {
    candidates.push({
      title: `Activate ${systemState.draft_services} draft services`,
      type: "generate_revenue",
      impact: 8, revenue_potential: 9, urgency: 7, effort: 2,
      priority_score: 0,
      reason: "Draft services = unrealized revenue",
      estimated_credits: 0,
    });
  }

  return { candidates, total_found: candidates.length };
}

function analyzeRisks(systemState: any, opportunities: any) {
  const warnings: Array<{ message: string; severity: string }> = [];

  if (systemState.fail_rate > 0.15) {
    warnings.push({ message: `High failure rate: ${(systemState.fail_rate * 100).toFixed(0)}%`, severity: "critical" });
  }
  if (systemState.user_balance < 50) {
    warnings.push({ message: `Low balance: ${systemState.user_balance} NEURONS remaining`, severity: "warn" });
  }
  if (systemState.capacity?.utilization > 80) {
    warnings.push({ message: `System at ${systemState.capacity.utilization}% capacity`, severity: "warn" });
  }
  if (opportunities.total_found === 0) {
    warnings.push({ message: "No matching services found for this goal", severity: "info" });
  }

  return {
    warnings,
    risk_level: warnings.some(w => w.severity === "critical") ? "high" : warnings.length > 0 ? "medium" : "low",
  };
}

/* ═══ T8.3: Priority Engine ═══
   score = impact×w1 + revenue_potential×w2 + urgency×w3 + (11-effort)×w4
*/
function prioritizeActions(
  candidates: ActionCandidate[],
  typeWeights: Record<string, any>,
  commandType: string,
): ActionCandidate[] {
  const weights = typeWeights[commandType] || {
    weight_impact: 0.35, weight_revenue: 0.35, weight_urgency: 0.20, weight_effort: 0.10,
  };

  for (const c of candidates) {
    c.priority_score = parseFloat((
      c.impact * weights.weight_impact +
      c.revenue_potential * weights.weight_revenue +
      c.urgency * weights.weight_urgency +
      (11 - c.effort) * weights.weight_effort
    ).toFixed(2));
  }

  candidates.sort((a, b) => b.priority_score - a.priority_score);
  return candidates;
}

function buildExecutionPlan(
  rankedActions: ActionCandidate[],
  risks: any,
  objective: any,
) {
  const top5 = rankedActions.slice(0, 5);

  return {
    next_actions: top5.map(a => ({
      title: a.title,
      type: a.type,
      priority_score: a.priority_score,
      estimated_credits: a.estimated_credits,
      reason: a.reason,
      service_unit_id: a.service_unit_id || null,
    })),
    priority_tasks: top5.slice(0, 3).map(a => ({
      title: a.title,
      urgency: a.urgency > 7 ? "high" : a.urgency > 4 ? "medium" : "low",
    })),
    agent_sequences: top5.filter(a => a.service_unit_id).slice(0, 2).map(a => ({
      service_unit_id: a.service_unit_id,
      action: "execute_via_prompt_broker",
    })),
    command_type: objective.command_type,
    risk_level: risks.risk_level,
    total_estimated_credits: top5.reduce((s, a) => s + a.estimated_credits, 0),
  };
}

/* ═══ Utility ═══ */

async function saveStage(
  supabase: any,
  decisionId: string,
  order: number,
  name: string,
  input: any,
  output: any,
  durationMs: number,
) {
  await supabase.from("decision_pipeline_stages").insert({
    decision_id: decisionId,
    stage_order: order,
    stage_name: name,
    input_data: input,
    output_data: output,
    duration_ms: durationMs,
    status: "completed",
  });
}
