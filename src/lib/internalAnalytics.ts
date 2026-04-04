/**
 * Internal Analytics — tracks events to analytics_events table.
 * Privacy-first: no third-party, all data stays in our DB.
 */
import { supabase } from "@/integrations/supabase/client";

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    const randomPart = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    sessionId = `${Date.now()}-${randomPart}`;
  }
  return sessionId;
}

interface TrackParams {
  event: string;
  params?: Record<string, unknown>;
  pagePath?: string;
}

export async function trackInternalEvent({ event, params, pagePath }: TrackParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("analytics_events" as any).insert({
      user_id: user.id,
      event_name: event,
      event_params: params || {},
      page_path: pagePath || window.location.pathname,
      session_id: getSessionId(),
    } as any);
  } catch {
    // Silent fail — analytics should never break the app
  }
}

// Common events
export const AnalyticsEvents = {
  PAGE_VIEW: "page_view",
  SERVICE_STARTED: "service_started",
  SERVICE_COMPLETED: "service_completed",
  NEURON_CREATED: "neuron_created",
  NEURON_CLONED: "neuron_cloned",
  EPISODE_UPLOADED: "episode_uploaded",
  TRANSCRIPT_COMPLETED: "transcript_completed",
  EXTRACTION_STARTED: "extraction_started",
  EXTRACTION_COMPLETED: "extraction_completed",
  CREDITS_TOPUP: "credits_topup",
  SEARCH_PERFORMED: "search_performed",
  EXPORT_TRIGGERED: "export_triggered",
  TEMPLATE_USED: "template_used",
  PIPELINE_TRIGGERED: "pipeline_triggered",
  FEEDBACK_SUBMITTED: "feedback_submitted",
  // Behavior & Distribution Engine
  SHARE_TRIGGERED: "share_triggered",
  CTA_CLICKED: "cta_clicked",
  BEHAVIOR_TRIGGER: "behavior_trigger",
  UPGRADE_PROMPT_SHOWN: "upgrade_prompt_shown",
  // ═══ Decision Engine Events (Phase 2) ═══
  INTENT_SUBMITTED: "intent_submitted",
  MMS_SELECTED: "mms_selected",
  MMS_EXECUTED: "mms_executed",
  MMS_COMPLETED: "mms_completed",
  INTENT_CHIP_CLICKED: "intent_chip_clicked",
  SYSTEM_RECOMMENDATION_SHOWN: "system_recommendation_shown",
  RESULT_SHARED_COMMUNITY: "result_shared_community",
  OUTPUT_GENERATED: "output_generated",
  PURCHASE_COMPLETED: "purchase_completed",
  // ═══ Conversion Funnel Events ═══
  SIGNUP_COMPLETED: "signup_completed",
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_SKIPPED: "onboarding_skipped",
  FIRST_UPLOAD: "first_upload",
  FIRST_EXTRACTION: "first_extraction",
  FIRST_SERVICE: "first_service",
  FIRST_ARTIFACT: "first_artifact",
  CONSENT_ACCEPTED: "consent_accepted",
  CONSENT_REJECTED: "consent_rejected",
  WELCOME_MODAL_CLOSED: "welcome_modal_closed",
  TUTORIAL_STARTED: "tutorial_started",
  TUTORIAL_MODULE_COMPLETED: "tutorial_module_completed",
  TUTORIAL_COMPLETED: "tutorial_completed",
  TUTORIAL_SKIPPED: "tutorial_skipped",
  // ═══ Monitoring & Quality Events ═══
  BUTTON_CLICKED: "button_clicked",
  STATE_TRANSITION: "state_transition",
  API_RESPONSE: "api_response",
  API_ERROR: "api_error",
  NAVIGATION: "navigation",
  DEAD_CLICK: "dead_click",
} as const;

/**
 * Track a button click. If no state transition follows within `deadClickMs`,
 * logs it as a dead click (potential bug).
 */
let lastClickTimestamp = 0;
let lastClickLabel = "";
let deadClickTimer: ReturnType<typeof setTimeout> | null = null;

export function trackClick(label: string, params?: Record<string, unknown>) {
  lastClickTimestamp = Date.now();
  lastClickLabel = label;

  trackInternalEvent({
    event: AnalyticsEvents.BUTTON_CLICKED,
    params: { label, ...params },
  });

  // Dead click detection: if no state transition in 3s, flag it
  if (deadClickTimer) clearTimeout(deadClickTimer);
  deadClickTimer = setTimeout(() => {
    trackInternalEvent({
      event: AnalyticsEvents.DEAD_CLICK,
      params: { label: lastClickLabel, waited_ms: 3000 },
    });
  }, 3000);
}

/** Call after a state change to cancel dead-click detection */
export function trackTransition(from: string, to: string, params?: Record<string, unknown>) {
  if (deadClickTimer) {
    clearTimeout(deadClickTimer);
    deadClickTimer = null;
  }
  trackInternalEvent({
    event: AnalyticsEvents.STATE_TRANSITION,
    params: { from, to, trigger: lastClickLabel, latency_ms: Date.now() - lastClickTimestamp, ...params },
  });

  // Persist pipeline phase transitions to audit log
  logPipelinePhaseTransition(from, to, params);
}

/** Persist pipeline phase transition to pipeline_phase_log table */
async function logPipelinePhaseTransition(from: string, to: string, params?: Record<string, unknown>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const sessionRaw = sessionStorage.getItem("ai-idei-execution-session");
    const sessionId = sessionRaw ? JSON.parse(sessionRaw)?.id : getSessionId();
    await supabase.from("pipeline_phase_log" as any).insert({
      session_id: sessionId,
      user_id: user.id,
      from_phase: from,
      to_phase: to,
      action_type: (params as any)?.action || null,
      metadata: params || {},
    } as any);
  } catch {
    // Silent fail — audit should never break the app
  }
}

/** Track API call result */
export function trackApiCall(endpoint: string, status: number, durationMs: number, error?: string) {
  trackInternalEvent({
    event: status >= 400 ? AnalyticsEvents.API_ERROR : AnalyticsEvents.API_RESPONSE,
    params: { endpoint, status, duration_ms: durationMs, ...(error ? { error } : {}) },
  });
}
