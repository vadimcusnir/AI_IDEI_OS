/**
 * Shared rate limiter for edge functions.
 * Uses in-memory Map with TTL — suitable for single-instance edge functions.
 * For multi-instance, migrate to Redis or DB-based tracking.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

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
  resetAt: number;
}

/**
 * Check and increment rate limit for a given key (usually user_id or IP).
 */
export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const { maxRequests, windowSeconds } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Middleware-style helper: returns 429 Response if rate limited, null if allowed.
 * Usage:
 *   const blocked = rateLimitGuard(userId, req);
 *   if (blocked) return blocked;
 */
export function rateLimitGuard(
  key: string,
  _req: Request,
  config: Partial<RateLimitConfig> = {},
  corsHeaders: Record<string, string> = {}
): Response | null {
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        retry_after: Math.ceil((result.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  return null;
}
