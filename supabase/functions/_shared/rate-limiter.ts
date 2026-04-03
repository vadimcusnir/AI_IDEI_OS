/**
 * Shared rate limiter for edge functions.
 * Uses database-backed persistence via check_rate_limit() RPC.
 * Survives edge function restarts and works across multiple instances.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 30,
  windowSeconds: 60,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * Check and increment rate limit for a given key (usually user_id or user_id:function_name).
 * Uses DB-backed atomic check via RPC.
 */
export async function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds } = { ...DEFAULT_CONFIG, ...config };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error || !data || data.length === 0) {
      console.error("Rate limit check failed, BLOCKING request (fail-closed):", error);
      // FAIL CLOSED — block if we can't verify rate limit
      return { allowed: false, remaining: 0, resetAt: Date.now() + windowSeconds * 1000 };
    }

    const row = data[0];
    return {
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: new Date(row.reset_at).getTime(),
    };
  } catch (err) {
    console.error("Rate limit error, BLOCKING request (fail-closed):", err);
    return { allowed: false, remaining: 0, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

/**
 * Middleware-style helper: returns 429 Response if rate limited, null if allowed.
 * Usage:
 *   const blocked = await rateLimitGuard(userId, req);
 *   if (blocked) return blocked;
 */
export async function rateLimitGuard(
  key: string,
  _req: Request,
  config: Partial<RateLimitConfig> = {},
  corsHeaders: Record<string, string> = {}
): Promise<Response | null> {
  // Check kill switch first
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data } = await supabase.rpc("check_kill_switch");
    if (data === true) {
      return new Response(
        JSON.stringify({ error: "Platform executions are temporarily halted", kill_switch: true }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("Kill switch check failed:", e);
  }

  const result = await checkRateLimit(key, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        retry_after: retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  return null;
}
