/**
 * KERNEL MODULES — Master Agent Control Layer
 * Planner | Economy Controller | Safety Guard | Memory | Scorer
 */

// ═══════════════════════════════════════
// TIER LIMITS — Mandatory execution constraints
// ═══════════════════════════════════════
export interface TierLimits {
  max_services: number;
  max_assets: number;
  max_parallel_jobs: number;
  depth: "low" | "medium" | "high" | "unlimited";
  priority_execution: boolean;
  neuron_count: number;
}

const TIER_CONFIG: Record<string, TierLimits> = {
  free: { max_services: 2, max_assets: 5, max_parallel_jobs: 1, depth: "low", priority_execution: false, neuron_count: 15 },
  core: { max_services: 5, max_assets: 15, max_parallel_jobs: 2, depth: "medium", priority_execution: false, neuron_count: 25 },
  pro: { max_services: 10, max_assets: 30, max_parallel_jobs: 3, depth: "high", priority_execution: true, neuron_count: 35 },
  elite: { max_services: 50, max_assets: 100, max_parallel_jobs: 5, depth: "unlimited", priority_execution: true, neuron_count: 40 },
  vip: { max_services: 50, max_assets: 100, max_parallel_jobs: 5, depth: "unlimited", priority_execution: true, neuron_count: 40 },
};

export function getTierLimits(tier: string): TierLimits {
  return TIER_CONFIG[tier?.toLowerCase()] || TIER_CONFIG.free;
}

// ═══════════════════════════════════════
// ECONOMY CONTROLLER — Cost governance
// ═══════════════════════════════════════
export interface EconomyVerdict {
  allowed: boolean;
  reason?: string;
  estimated_cost: number;
  balance: number;
  deficit?: number;
  tier_discount_pct: number;
}

const TIER_DISCOUNTS: Record<string, number> = {
  free: 0, core: 10, pro: 25, elite: 40, vip: 40,
};

export async function economyPreFlight(
  supabase: any,
  userId: string,
  estimatedCost: number,
  tier: string
): Promise<EconomyVerdict> {
  const discountPct = TIER_DISCOUNTS[tier?.toLowerCase()] || 0;
  const finalCost = Math.round(estimatedCost * (1 - discountPct / 100));

  // Check wallet balance
  const { data: wallet } = await supabase
    .from("wallet_state")
    .select("available, locked")
    .eq("user_id", userId)
    .maybeSingle();

  const balance = wallet?.available || 0;

  if (balance < finalCost) {
    return {
      allowed: false,
      reason: `INSUFFICIENT_BALANCE: need ${finalCost}N, have ${balance}N`,
      estimated_cost: finalCost,
      balance,
      deficit: finalCost - balance,
      tier_discount_pct: discountPct,
    };
  }

  return { allowed: true, estimated_cost: finalCost, balance, tier_discount_pct: discountPct };
}

// ═══════════════════════════════════════
// SAFETY GUARD — Anti-abuse layer
// ═══════════════════════════════════════
export interface SafetyVerdict {
  allowed: boolean;
  reason?: string;
  throttle_seconds?: number;
}

export async function safetyCheck(
  supabase: any,
  userId: string
): Promise<SafetyVerdict> {
  // 1. Rate limit — max 5 master-agent runs per hour
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("neuron_jobs")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .eq("worker_type", "master_agent")
    .gte("created_at", oneHourAgo);

  if ((count || 0) >= 5) {
    return { allowed: false, reason: "RATE_LIMIT: Max 5 master-agent runs per hour", throttle_seconds: 600 };
  }

  // 2. Check for active abuse flags
  const { data: abuses } = await supabase
    .from("abuse_events")
    .select("id, severity")
    .eq("user_id", userId)
    .is("resolved_at", null)
    .in("severity", ["high", "critical"])
    .limit(1);

  if (abuses && abuses.length > 0) {
    return { allowed: false, reason: "BLOCKED: Active abuse flag on account" };
  }

  return { allowed: true };
}

// ═══════════════════════════════════════
// MEMORY SYSTEM — Learning from history
// ═══════════════════════════════════════
export interface ExecutionMemory {
  successful_services: string[];
  failed_services: string[];
  avg_asset_score: number;
  total_runs: number;
}

export async function loadExecutionMemory(
  supabase: any,
  userId: string
): Promise<ExecutionMemory> {
  // Load last 20 master-agent jobs
  const { data: jobs } = await supabase
    .from("neuron_jobs")
    .select("status, input, result")
    .eq("author_id", userId)
    .eq("worker_type", "master_agent")
    .order("created_at", { ascending: false })
    .limit(20);

  const successful_services: string[] = [];
  const failed_services: string[] = [];
  let totalScore = 0;
  let scoreCount = 0;

  for (const job of (jobs || [])) {
    const result = job.result as any;
    if (job.status === "completed" && result) {
      // Track which services produced results
      if (result.services_matched) {
        // Services that led to successful outputs get boosted
        successful_services.push(...(result.top_services || []));
      }
    }
    if (job.status === "failed") {
      const input = job.input as any;
      if (input?.failed_service_keys) {
        failed_services.push(...input.failed_service_keys);
      }
    }
  }

  return {
    successful_services: [...new Set(successful_services)],
    failed_services: [...new Set(failed_services)],
    avg_asset_score: scoreCount > 0 ? totalScore / scoreCount : 0.75,
    total_runs: (jobs || []).length,
  };
}

// ═══════════════════════════════════════
// PLANNER — Strategic execution planning
// ═══════════════════════════════════════
export interface ExecutionPlan {
  strategy: string;
  neuron_target: number;
  max_services: number;
  max_assets: number;
  estimated_cost: number;
  estimated_ai_calls: number;
  depth: string;
  priority_services: string[];
  blocked_services: string[];
}

export function buildExecutionPlan(
  tierLimits: TierLimits,
  memory: ExecutionMemory,
  catalogSize: number,
  executionDepth: string
): ExecutionPlan {
  // Override depth from tier
  const effectiveDepth = tierLimits.depth === "unlimited"
    ? executionDepth
    : tierLimits.depth === "low" ? "quick"
    : tierLimits.depth === "medium" ? "standard"
    : executionDepth;

  const neuronTarget = tierLimits.neuron_count;
  const maxServices = Math.min(tierLimits.max_services, effectiveDepth === "quick" ? 3 : effectiveDepth === "full" ? 10 : 6);
  const maxAssets = tierLimits.max_assets;

  // AI calls estimation: extraction + synthesis + matching + N executions + asset gen + scoring = 4 + N + 2
  const estimatedAiCalls = 4 + maxServices + 2;
  // Each AI call ~290N base cost
  const estimatedCost = estimatedAiCalls * 290;

  return {
    strategy: effectiveDepth === "quick" ? "rapid_extraction" : effectiveDepth === "full" ? "deep_analysis" : "balanced_production",
    neuron_target: neuronTarget,
    max_services: maxServices,
    max_assets: maxAssets,
    estimated_cost: estimatedCost,
    estimated_ai_calls: estimatedAiCalls,
    depth: effectiveDepth,
    priority_services: memory.successful_services.slice(0, 5),
    blocked_services: memory.failed_services.slice(0, 10),
  };
}

// ═══════════════════════════════════════
// SCORER — Output quality gate
// ═══════════════════════════════════════
export interface ScoredItem {
  index: number;
  scores: { determinism: number; economic_value: number; reusability: number };
  final_score: number;
  verdict: "accept" | "reject" | "retry";
}

export function applyScoreVerdicts(scoredItems: any[]): ScoredItem[] {
  return (scoredItems || []).map((item: any) => ({
    ...item,
    verdict: item.final_score >= 0.7 ? "accept" : item.final_score >= 0.5 ? "retry" : "reject",
  }));
}

// ═══════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════
export type KernelState = "IDLE" | "PLANNING" | "EXECUTING" | "SCORING" | "PACKAGING" | "MONETIZING" | "COMPLETED" | "FAILED";

export function createKernelLog() {
  const steps: Array<{
    step: string;
    state: KernelState;
    status: string;
    timestamp: string;
    data?: any;
  }> = [];

  return {
    log(step: string, state: KernelState, status: string, data?: any) {
      steps.push({ step, state, status, timestamp: new Date().toISOString(), ...(data ? { data } : {}) });
    },
    getSteps() { return steps; },
  };
}
