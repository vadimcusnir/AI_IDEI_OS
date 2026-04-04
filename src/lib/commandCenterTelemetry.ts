/**
 * CC-V02: Command Center Telemetry
 * Tracks the full execution lifecycle with precise timing.
 * All events go to analytics_events via trackInternalEvent.
 */
import { trackInternalEvent } from "@/lib/internalAnalytics";

// ═══ Event Constants ═══
export const CCEvents = {
  // Input → Execution lifecycle
  COMMAND_SUBMITTED: "cc_command_submitted",
  FIRST_TOKEN: "cc_first_token",
  PLAN_PREVIEW_SHOWN: "cc_plan_preview_shown",
  PLAN_CONFIRMED: "cc_plan_confirmed",
  PLAN_DISMISSED: "cc_plan_dismissed",
  EXECUTION_COMPLETED: "cc_execution_completed",
  EXECUTION_FAILED: "cc_execution_failed",
  EXECUTION_ABORTED: "cc_execution_aborted",

  // Output engagement
  OUTPUT_PANEL_OPENED: "cc_output_panel_opened",
  OUTPUT_SAVED: "cc_output_saved",
  OUTPUT_SAVE_ALL: "cc_output_save_all",
  TEMPLATE_SAVED: "cc_template_saved",

  // Session management
  SESSION_STARTED: "cc_session_started",
  SESSION_SWITCHED: "cc_session_switched",
  SESSION_DELETED: "cc_session_deleted",
  HISTORY_OPENED: "cc_history_opened",
  SESSION_RETURN: "cc_session_return",

  // Navigation & adoption
  LEFT_HOME_FOR: "cc_left_home_for",
  DEEP_LINK_USED: "cc_deep_link_used",
  SHORTCUT_USED: "cc_shortcut_used",
  SLASH_COMMAND_USED: "cc_slash_command_used",

  // Economic gates
  ECONOMIC_GATE_SHOWN: "cc_economic_gate_shown",
  ECONOMIC_GATE_PROCEED: "cc_economic_gate_proceed",
  ECONOMIC_GATE_CANCEL: "cc_economic_gate_cancel",
  LOW_BALANCE_SHOWN: "cc_low_balance_shown",
  PERMISSION_BLOCKED: "cc_permission_blocked",

  // Error & recovery
  ERROR_SHOWN: "cc_error_shown",
  OFFLINE_DETECTED: "cc_offline_detected",
  RECONNECTED: "cc_reconnected",
  RERUN_TRIGGERED: "cc_rerun_triggered",
} as const;

// ═══ Timing Helper ═══
let submitTimestamp = 0;

export function markSubmitTime() {
  submitTimestamp = performance.now();
}

function msSinceSubmit(): number {
  return submitTimestamp > 0 ? Math.round(performance.now() - submitTimestamp) : 0;
}

// ═══ Track Functions ═══

export function trackCC(event: string, params?: Record<string, unknown>) {
  trackInternalEvent({
    event,
    params: {
      ...params,
      cc_version: "1.0",
      viewport: typeof window !== "undefined"
        ? (window.innerWidth < 768 ? "mobile" : "desktop")
        : "unknown",
    },
    pagePath: "/home",
  });
}

// ═══ Lifecycle Trackers ═══

export function trackCommandSubmitted(input: string, fileCount: number, isAutoExec: boolean) {
  markSubmitTime();
  trackCC(CCEvents.COMMAND_SUBMITTED, {
    input_length: input.length,
    has_files: fileCount > 0,
    file_count: fileCount,
    is_auto_exec: isAutoExec,
    has_slash_command: input.startsWith("/"),
  });
}

export function trackFirstToken() {
  trackCC(CCEvents.FIRST_TOKEN, {
    latency_ms: msSinceSubmit(),
  });
}

export function trackPlanPreview(intent: string, credits: number, stepCount: number) {
  trackCC(CCEvents.PLAN_PREVIEW_SHOWN, {
    intent,
    estimated_credits: credits,
    step_count: stepCount,
    latency_ms: msSinceSubmit(),
  });
}

export function trackPlanConfirmed(intent: string, credits: number) {
  trackCC(CCEvents.PLAN_CONFIRMED, {
    intent,
    credits,
    decision_time_ms: msSinceSubmit(),
  });
}

export function trackExecutionCompleted(
  intent: string,
  credits: number,
  outputCount: number,
  durationMs: number,
) {
  trackCC(CCEvents.EXECUTION_COMPLETED, {
    intent,
    credits_spent: credits,
    output_count: outputCount,
    duration_ms: durationMs,
    total_latency_ms: msSinceSubmit(),
  });
}

export function trackExecutionFailed(intent: string, error: string) {
  trackCC(CCEvents.EXECUTION_FAILED, {
    intent,
    error_type: error.slice(0, 100),
    latency_ms: msSinceSubmit(),
  });
}

export function trackOutputEngagement(action: "open" | "save" | "save_all", outputCount: number) {
  const eventMap = {
    open: CCEvents.OUTPUT_PANEL_OPENED,
    save: CCEvents.OUTPUT_SAVED,
    save_all: CCEvents.OUTPUT_SAVE_ALL,
  };
  trackCC(eventMap[action], { output_count: outputCount });
}

export function trackEconomicGate(action: "shown" | "proceed" | "cancel", balance: number, cost: number) {
  const eventMap = {
    shown: CCEvents.ECONOMIC_GATE_SHOWN,
    proceed: CCEvents.ECONOMIC_GATE_PROCEED,
    cancel: CCEvents.ECONOMIC_GATE_CANCEL,
  };
  trackCC(eventMap[action], { balance, cost, deficit: cost - balance });
}

export function trackSessionAction(action: "started" | "switched" | "deleted" | "return") {
  const eventMap = {
    started: CCEvents.SESSION_STARTED,
    switched: CCEvents.SESSION_SWITCHED,
    deleted: CCEvents.SESSION_DELETED,
    return: CCEvents.SESSION_RETURN,
  };
  trackCC(eventMap[action]);
}

export function trackAdoptionExit(destination: string) {
  trackCC(CCEvents.LEFT_HOME_FOR, {
    destination,
    time_on_home_ms: msSinceSubmit(),
  });
}

export function trackError(errorType: string, recoverable: boolean) {
  trackCC(CCEvents.ERROR_SHOWN, {
    error_type: errorType,
    recoverable,
  });
}
