/**
 * Shared error reporting for edge functions.
 * Logs structured errors with context for debugging.
 * In production, could forward to Sentry via HTTP API.
 */

export interface ErrorContext {
  functionName: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Report an error with structured context.
 * Currently logs to console (visible in edge function logs).
 * Can be extended to forward to Sentry/external service.
 */
export function reportError(error: unknown, context: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));
  
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
}

/**
 * Wrap an edge function handler with error reporting.
 * Usage:
 *   Deno.serve(withErrorReporting("my-function", async (req) => { ... }));
 */
export function withErrorReporting(
  functionName: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const requestId = crypto.randomUUID();
    try {
      return await handler(req);
    } catch (error) {
      reportError(error, { functionName, requestId });
      return new Response(
        JSON.stringify({ error: "Internal server error", request_id: requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}
