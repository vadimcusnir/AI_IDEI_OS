/**
 * AuditLogger — Logs all Command Center actions to decision_ledger
 * for governance, compliance, and debugging trail.
 *
 * Every execution, permission block, and economic gate decision is recorded.
 */

import { supabase } from "@/integrations/supabase/client";
import type { IntentCategory } from "./CommandRouter";

export type AuditEventType =
  | "command_submitted"
  | "plan_generated"
  | "plan_confirmed"
  | "plan_dismissed"
  | "execution_started"
  | "execution_completed"
  | "execution_failed"
  | "permission_denied"
  | "economic_gate_block"
  | "economic_gate_pass"
  | "template_saved"
  | "template_executed"
  | "asset_saved"
  | "session_reset";

interface AuditEntry {
  event_type: AuditEventType;
  actor_id: string;
  target_resource?: string;
  verdict?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event to decision_ledger.
 * Fire-and-forget — never blocks execution flow.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await supabase.from("decision_ledger").insert({
      event_type: entry.event_type,
      actor_id: entry.actor_id,
      target_resource: entry.target_resource || "command_center",
      verdict: entry.verdict || "recorded",
      reason: entry.reason || null,
      metadata: (entry.metadata || {}) as any,
    });
  } catch {
    // Silent fail — audit must never break execution
    console.warn("[AuditLogger] Failed to log event:", entry.event_type);
  }
}

/**
 * Log a command submission with parsed intent.
 */
export function logCommandSubmitted(
  userId: string,
  intentCategory: IntentCategory,
  inputType: string,
  estimatedCredits: number,
) {
  return logAudit({
    event_type: "command_submitted",
    actor_id: userId,
    target_resource: `intent:${intentCategory}`,
    verdict: "submitted",
    metadata: { intent: intentCategory, input_type: inputType, estimated_credits: estimatedCredits },
  });
}

/**
 * Log when a plan is confirmed and execution begins.
 */
export function logPlanConfirmed(
  userId: string,
  actionId: string | null,
  intent: string,
  totalCredits: number,
  stepCount: number,
) {
  return logAudit({
    event_type: "plan_confirmed",
    actor_id: userId,
    target_resource: actionId ? `action:${actionId}` : `intent:${intent}`,
    verdict: "confirmed",
    metadata: { action_id: actionId, intent, total_credits: totalCredits, steps: stepCount },
  });
}

/**
 * Log execution completion with results summary.
 */
export function logExecutionCompleted(
  userId: string,
  actionId: string | null,
  intent: string,
  creditsSpent: number,
  outputCount: number,
  durationMs: number,
) {
  return logAudit({
    event_type: "execution_completed",
    actor_id: userId,
    target_resource: actionId ? `action:${actionId}` : `intent:${intent}`,
    verdict: "completed",
    metadata: { credits_spent: creditsSpent, outputs: outputCount, duration_ms: durationMs },
  });
}

/**
 * Log permission denial for tier-restricted features.
 */
export function logPermissionDenied(
  userId: string,
  intent: string,
  requiredTier: string,
  currentTier: string,
) {
  return logAudit({
    event_type: "permission_denied",
    actor_id: userId,
    target_resource: `intent:${intent}`,
    verdict: "denied",
    reason: `Requires ${requiredTier}, user has ${currentTier}`,
    metadata: { required_tier: requiredTier, current_tier: currentTier },
  });
}

/**
 * Log economic gate outcome.
 */
export function logEconomicGate(
  userId: string,
  passed: boolean,
  balance: number,
  cost: number,
  tierDiscount: number,
) {
  return logAudit({
    event_type: passed ? "economic_gate_pass" : "economic_gate_block",
    actor_id: userId,
    verdict: passed ? "passed" : "blocked",
    reason: passed ? undefined : `Balance ${balance} < cost ${cost}`,
    metadata: { balance, cost, discount_pct: tierDiscount, final_cost: Math.round(cost * (1 - tierDiscount / 100)) },
  });
}
