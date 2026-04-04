/**
 * transcribe-audio: Legacy endpoint — redirects to transcribe-source
 * Kept for backward compatibility.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":transcribe-audio", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { episode_id, file_path, language, source_url } = body;

    // Forward to unified transcribe-source
    const resp = await fetch(`${supabaseUrl}/functions/v1/transcribe-source`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.get("authorization") || "",
      },
      body: JSON.stringify({
        url: source_url || undefined,
        episode_id,
        file_path: file_path || undefined,
        language: language || undefined,
      }),
    });

    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-audio redirect error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
