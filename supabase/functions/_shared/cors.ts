/**
 * Shared CORS headers for edge functions.
 * Restricts origin to known domains for defense-in-depth.
 * 
 * SECURITY: No localhost in production, specific Lovable preview subdomain pattern.
 */

const ALLOWED_ORIGINS = [
  "https://ai-idei-os.lovable.app",
  "https://ai-idei.com",
  "https://www.ai-idei.com",
];

// In development, allow localhost origins
const isDev = Deno.env.get("ENVIRONMENT") === "development";
if (isDev) {
  ALLOWED_ORIGINS.push("http://localhost:5173", "http://localhost:8080");
}

// Specific Lovable preview pattern: id-preview--<uuid>.lovable.app
const LOVABLE_PREVIEW_REGEX = /^https:\/\/[a-z0-9-]+-preview--[a-f0-9-]+\.lovable\.app$/;
const LOVABLE_PROJECT_REGEX = /^https:\/\/[a-f0-9-]+\.lovableproject\.com$/;

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";

  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    LOVABLE_PREVIEW_REGEX.test(origin) ||
    LOVABLE_PROJECT_REGEX.test(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-internal-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Permitted-Cross-Domain-Policies": "none",
  };
}

/** @deprecated — removed. Use getCorsHeaders(req) instead. */
