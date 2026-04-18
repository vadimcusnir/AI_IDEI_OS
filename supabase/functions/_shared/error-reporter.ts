/**
 * Shared error reporting for edge functions.
 * Wave 4 — proactive monitoring: structured logs + auto-insert into admin_alerts
 * with dedup (15-min window via upsert_admin_alert RPC).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface ErrorContext {
  functionName: string;
  userId?: string;
  requestId?: string;
  /** When set, also creates/dedups an admin_alert row */
  alert?: {
    severity?: AlertSeverity;
    /** Logical service this error impacts (e.g. "payment", "ai-pipeline") */
    serviceKey?: string;
    providerKey?: string;
    impactScope?: string;
    recommendedAction?: string;
  };
  metadata?: Record<string, unknown>;
}

let _serviceClient: ReturnType<typeof createClient> | null = null;
function getServiceClient() {
  if (_serviceClient) return _serviceClient;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  _serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return _serviceClient;
}

/** Stable signature so repeated identical errors dedup */
function errorSignal(functionName: string, err: Error): string {
  // First line of stack (if any) gives us the throw site; fallback to message.
  const firstFrame = err.stack?.split("\n").slice(1, 2).join("").trim() || "";
  return `${functionName}::${err.name}::${err.message.slice(0, 120)}::${firstFrame.slice(0, 120)}`;
}

/**
 * Report an error: always logs, optionally upserts an admin_alert.
 */
export async function reportError(error: unknown, context: ErrorContext): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));

  // 1) Structured console log (always)
  console.error(JSON.stringify({
    level: "error",
    function: context.functionName,
    message: err.message,
    stack: err.stack?.split("\n").slice(0, 5).join("\n"),
    user_id: context.userId,
    request_id: context.requestId,
    timestamp: new Date().toISOString(),
    ...context.metadata,
  }));

  // 2) Optional admin_alert upsert
  if (!context.alert) return;
  const client = getServiceClient();
  if (!client) return;

  try {
    await client.rpc("upsert_admin_alert", {
      p_alert_type: "edge_function_error",
      p_severity: context.alert.severity ?? "high",
      p_title: `[${context.functionName}] ${err.message.slice(0, 120)}`,
      p_error_signal: errorSignal(context.functionName, err),
      p_service_key: context.alert.serviceKey ?? context.functionName,
      p_provider_key: context.alert.providerKey ?? null,
      p_description: err.stack?.split("\n").slice(0, 5).join("\n") ?? null,
      p_impact_scope: context.alert.impactScope ?? null,
      p_recommended_action: context.alert.recommendedAction ?? null,
      p_metadata: {
        request_id: context.requestId,
        user_id: context.userId,
        ...(context.metadata ?? {}),
      },
    });
  } catch (alertErr) {
    // Never let alerting itself crash the handler
    console.error("[error-reporter] failed to upsert admin_alert:", alertErr);
  }
}

/**
 * Wrap an edge function handler with error reporting + admin_alert escalation.
 *
 * Usage:
 *   Deno.serve(withErrorReporting("my-function", async (req) => { ... }, {
 *     alertSeverity: "high",
 *     serviceKey: "payment",
 *   }));
 */
export function withErrorReporting(
  functionName: string,
  handler: (req: Request) => Promise<Response>,
  options: {
    alertSeverity?: AlertSeverity;
    serviceKey?: string;
    impactScope?: string;
    recommendedAction?: string;
  } = {}
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const requestId = crypto.randomUUID();
    try {
      return await handler(req);
    } catch (error) {
      await reportError(error, {
        functionName,
        requestId,
        alert: {
          severity: options.alertSeverity ?? "high",
          serviceKey: options.serviceKey,
          impactScope: options.impactScope,
          recommendedAction: options.recommendedAction,
        },
      });
      return new Response(
        JSON.stringify({ error: "Internal server error", request_id: requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}
