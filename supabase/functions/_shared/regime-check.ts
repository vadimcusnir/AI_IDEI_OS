/**
 * Execution regime checker — validates if a job should run
 * based on execution_regime_config for its service.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface RegimeConfig {
  regime: string;
  maxCostCredits: number | null;
  maxRetries: number | null;
  timeoutSeconds: number | null;
  dryRun: boolean;
  validationRequired: boolean;
  outputMarked: boolean;
  riskLevel: string;
}

const DEFAULT_REGIME: RegimeConfig = {
  regime: "balanced",
  maxCostCredits: null,
  maxRetries: 3,
  timeoutSeconds: 300,
  dryRun: false,
  validationRequired: false,
  outputMarked: false,
  riskLevel: "medium",
};

/**
 * Get execution regime config for a service.
 * Falls back to DEFAULT if no config exists.
 */
export async function getRegimeConfig(serviceKey: string): Promise<RegimeConfig> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("execution_regime_config")
      .select("regime, max_cost_credits, max_retries, timeout_seconds, dry_run, validation_required, output_marked, risk_level")
      .eq("service_key", serviceKey)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return DEFAULT_REGIME;

    return {
      regime: data.regime || "balanced",
      maxCostCredits: data.max_cost_credits,
      maxRetries: data.max_retries,
      timeoutSeconds: data.timeout_seconds,
      dryRun: data.dry_run ?? false,
      validationRequired: data.validation_required ?? false,
      outputMarked: data.output_marked ?? false,
      riskLevel: data.risk_level || "medium",
    };
  } catch (e) {
    console.error(`[regime-check] Error for "${serviceKey}":`, e);
    return DEFAULT_REGIME;
  }
}

/**
 * Check if a job should be blocked based on regime.
 * Returns null if OK, or an error reason string if blocked.
 */
export function checkRegimeBlock(
  regime: RegimeConfig,
  jobCost: number
): string | null {
  // EMERGENCY regime — block if cost exceeds cap
  if (regime.regime === "emergency" && regime.maxCostCredits !== null && jobCost > regime.maxCostCredits) {
    return `EMERGENCY: Job cost (${jobCost}) exceeds cap (${regime.maxCostCredits})`;
  }

  // STRICT regime — block high-risk without validation
  if (regime.regime === "strict" && regime.riskLevel === "critical") {
    return `STRICT: Critical risk jobs require manual approval`;
  }

  // SIMULATION regime — always dry-run, never spend real credits
  if (regime.regime === "simulation") {
    // Don't block, but caller should check dryRun flag
    return null;
  }

  return null;
}
