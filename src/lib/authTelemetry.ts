/**
 * authTelemetry — Structured observability for the auth flow.
 *
 * Emits events with a per-flow correlation_id so we can stitch together:
 *   auth_attempt_started → provider_redirect_started → callback_received
 *   → session_created → guard_redirect_triggered → post_login_redirect_completed
 *
 * Events are best-effort: never throw, never block the auth flow.
 * Stored in `analytics_events` (public.insert allowed) for later analysis.
 */
import { supabase } from "@/integrations/supabase/client";

export type AuthEvent =
  | "auth_attempt_started"
  | "provider_redirect_started"
  | "callback_received"
  | "code_exchange_failed"
  | "session_created"
  | "session_restore_failed"
  | "guard_redirect_triggered"
  | "post_login_redirect_completed"
  | "logout_completed"
  | "auth_error_normalized"
  | "bad_jwt_recovered";

const CORR_KEY = "ai_idei_auth_corr_id";

/** Get-or-create a correlation id for the current auth flow */
export function getCorrelationId(): string {
  try {
    const existing = sessionStorage.getItem(CORR_KEY);
    if (existing) return existing;
    const id = `auth_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(CORR_KEY, id);
    return id;
  } catch {
    return `auth_${Date.now().toString(36)}`;
  }
}

/** Reset correlation id (call on logout / flow completion) */
export function resetCorrelationId() {
  try { sessionStorage.removeItem(CORR_KEY); } catch {}
}

/** Fire-and-forget telemetry event */
export function trackAuthEvent(event: AuthEvent, params: Record<string, unknown> = {}) {
  const correlation_id = getCorrelationId();
  const payload = {
    correlation_id,
    env: import.meta.env.MODE,
    origin: typeof window !== "undefined" ? window.location.origin : "unknown",
    path: typeof window !== "undefined" ? window.location.pathname : "unknown",
    ts: Date.now(),
    ...params,
  };

  // Console breadcrumb for live debugging
  if (typeof console !== "undefined") {
    console.info(`[auth] ${event}`, payload);
  }

  // Persist to analytics_events (non-blocking)
  void supabase
    .from("analytics_events")
    .insert({
      event_name: event,
      event_params: payload as any,
      page_path: payload.path,
      session_id: correlation_id,
    })
    .then(({ error }) => {
      if (error && console) console.warn(`[auth-telemetry] Failed to persist ${event}:`, error.message);
    });
}
