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
} as const;
