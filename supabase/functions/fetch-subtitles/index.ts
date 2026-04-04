import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * fetch-subtitles: Downloads YouTube subtitles/captions.
 * Checks languages in priority order: ro, en, auto-generated.
 *
 * Input: { url, episode_id, preferred_languages?: string[] }
 * Output: { subtitle_text, subtitle_language, segments }
 */

const DEFAULT_LANG_PRIORITY = ["ro", "en"];

interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

// ── Dangerous content patterns (XSS vectors) ──
const DANGEROUS_PATTERNS = [
  /<script/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /<style/i,
  /<meta/i,
  /<link/i,
];

function sanitizeText(raw: string): string {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "") // strip ALL HTML tags
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, "") // zero-width chars
    .replace(/\n/g, " ")
    .trim();
}

function containsMaliciousContent(text: string): boolean {
  return DANGEROUS_PATTERNS.some((p) => p.test(text));
}

function parseTimedTextXml(
  xml: string,
): { text: string; segments: SubtitleSegment[] } {
  // Security: reject entire payload if malicious patterns detected
  if (containsMaliciousContent(xml)) {
    console.warn(
      "[security] Malicious content detected in subtitle XML, rejecting",
    );
    return { text: "", segments: [] };
  }

  const segments: SubtitleSegment[] = [];
  const textParts: string[] = [];

  const regex =
    /<text[^>]*\bstart="([\d.]+)"[^>]*\bdur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const dur = parseFloat(match[2]);
    const text = sanitizeText(match[3]);

    if (text && text.length <= 2000) {
      segments.push({ start, end: start + dur, text });
      textParts.push(text);
    }
  }

  return { text: textParts.join(" "), segments };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Rate limit guard
    const rateLimited = await rateLimitGuard(user.id, req, {
      maxRequests: 20,
      windowSeconds: 60,
    }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const { url, episode_id, preferred_languages } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Extract YouTube video ID
    const ytMatch = url.match(/[?&]v=([\w-]{11})/) ||
      url.match(/youtu\.be\/([\w-]{11})/);
    if (!ytMatch?.[1]) {
      return new Response(
        JSON.stringify({
          error: "Only YouTube URLs are supported for subtitle download",
        }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }
    const videoId = ytMatch[1];

    // Get available caption tracks
    const listUrl = `https://video.google.com/timedtext?v=${videoId}&type=list`;
    const listResp = await fetch(listUrl);
    if (!listResp.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch subtitle list",
          subtitles_available: false,
        }),
        {
          status: 404,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    const listXml = await listResp.text();

    // Parse available languages
    const availableLangs: { code: string; name: string; kind?: string }[] = [];
    const trackRegex =
      /lang_code="([^"]+)"[^>]*name="([^"]*)"(?:[^>]*kind="([^"]*)")?/g;
    let trackMatch;
    while ((trackMatch = trackRegex.exec(listXml)) !== null) {
      availableLangs.push({
        code: trackMatch[1],
        name: trackMatch[2],
        kind: trackMatch[3],
      });
    }

    if (availableLangs.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No subtitles available",
          subtitles_available: false,
        }),
        {
          status: 404,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Priority: user preferred -> ro -> en -> auto-generated -> first available
    const langPriority = preferred_languages || DEFAULT_LANG_PRIORITY;
    let selectedLang: string | null = null;
    let selectedKind: string | undefined;

    // First pass: manual captions in priority order
    for (const lang of langPriority) {
      const manual = availableLangs.find((t) =>
        t.code === lang && t.kind !== "asr"
      );
      if (manual) {
        selectedLang = manual.code;
        selectedKind = manual.kind;
        break;
      }
    }

    // Second pass: auto-generated in priority order
    if (!selectedLang) {
      for (const lang of langPriority) {
        const auto = availableLangs.find((t) => t.code === lang);
        if (auto) {
          selectedLang = auto.code;
          selectedKind = auto.kind;
          break;
        }
      }
    }

    // Fallback: first available track
    if (!selectedLang && availableLangs.length > 0) {
      selectedLang = availableLangs[0].code;
      selectedKind = availableLangs[0].kind;
    }

    if (!selectedLang) {
      return new Response(
        JSON.stringify({
          error: "No matching subtitle language found",
          subtitles_available: false,
        }),
        {
          status: 404,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Download the subtitle track
    let subtitleUrl =
      `https://video.google.com/timedtext?v=${videoId}&lang=${selectedLang}`;
    if (selectedKind) {
      subtitleUrl += `&kind=${selectedKind}`;
    }

    const subResp = await fetch(subtitleUrl);
    if (!subResp.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to download subtitles" }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    const subtitleXml = await subResp.text();
    const { text, segments } = parseTimedTextXml(subtitleXml);

    if (!text.trim()) {
      return new Response(
        JSON.stringify({ error: "Downloaded subtitles are empty" }),
        {
          status: 404,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Store transcript in episode if episode_id provided
    if (episode_id) {
      const serviceClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const lastSegment = segments[segments.length - 1];
      const durationSeconds = lastSegment ? Math.ceil(lastSegment.end) : null;

      await serviceClient
        .from("episodes")
        .update({
          transcript: text,
          status: "transcribed",
          duration_seconds: durationSeconds,
          language: selectedLang,
          metadata: {
            subtitle_source: "youtube_captions",
            subtitle_language: selectedLang,
            subtitle_kind: selectedKind || "manual",
            segment_count: segments.length,
            word_count: text.split(/\s+/).length,
            available_languages: availableLangs.map((l) => l.code),
            fetched_at: new Date().toISOString(),
          },
        } as any)
        .eq("id", episode_id)
        .eq("author_id", user.id);
    }

    return new Response(
      JSON.stringify({
        subtitle_text: text,
        subtitle_language: selectedLang,
        subtitle_kind: selectedKind || "manual",
        segments,
        segment_count: segments.length,
        word_count: text.split(/\s+/).length,
        available_languages: availableLangs.map((l) => l.code),
      }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("fetch-subtitles error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      },
    );
  }
});
