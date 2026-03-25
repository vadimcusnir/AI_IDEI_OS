import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * fetch-metadata: Fetches metadata for YouTube/Vimeo URLs using oEmbed APIs.
 * Also checks YouTube subtitle availability via timedtext API.
 * 
 * Input: { url, platform, episode_id? }
 * Output: { title, duration_seconds, uploader, thumbnail_url, subtitles_available, subtitle_languages }
 */

interface MetadataResult {
  title: string;
  duration_seconds: number | null;
  uploader: string;
  thumbnail_url: string | null;
  subtitles_available: boolean;
  subtitle_languages: string[];
}

async function fetchYouTubeMetadata(url: string, videoId: string): Promise<MetadataResult> {
  // oEmbed for basic metadata
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const oembedResp = await fetch(oembedUrl);

  let title = "Untitled";
  let uploader = "Unknown";
  let thumbnail_url: string | null = null;

  if (oembedResp.ok) {
    const data = await oembedResp.json();
    title = data.title || title;
    uploader = data.author_name || uploader;
    thumbnail_url = data.thumbnail_url || null;
  }

  // High-res thumbnail fallback
  if (!thumbnail_url) {
    thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  // Check subtitle availability via timedtext list
  const subtitleLanguages: string[] = [];
  try {
    const captionListUrl = `https://video.google.com/timedtext?v=${videoId}&type=list`;
    const captionResp = await fetch(captionListUrl);
    if (captionResp.ok) {
      const captionXml = await captionResp.text();
      // Parse language codes from XML: <track ... lang_code="en" .../>
      const langMatches = captionXml.matchAll(/lang_code="([^"]+)"/g);
      for (const m of langMatches) {
        subtitleLanguages.push(m[1]);
      }
    }
  } catch (e) {
    console.warn("Failed to check YouTube subtitles:", e);
  }

  // Try to get duration via noembed (provides more data)
  let duration_seconds: number | null = null;
  try {
    const noembedResp = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (noembedResp.ok) {
      const noembedData = await noembedResp.json();
      if (noembedData.duration) {
        duration_seconds = Number(noembedData.duration);
      }
    }
  } catch {}

  return {
    title,
    duration_seconds,
    uploader,
    thumbnail_url,
    subtitles_available: subtitleLanguages.length > 0,
    subtitle_languages: subtitleLanguages,
  };
}

async function fetchVimeoMetadata(url: string): Promise<MetadataResult> {
  const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  const resp = await fetch(oembedUrl);

  if (!resp.ok) {
    return {
      title: "Untitled",
      duration_seconds: null,
      uploader: "Unknown",
      thumbnail_url: null,
      subtitles_available: false,
      subtitle_languages: [],
    };
  }

  const data = await resp.json();
  return {
    title: data.title || "Untitled",
    duration_seconds: data.duration || null,
    uploader: data.author_name || "Unknown",
    thumbnail_url: data.thumbnail_url || null,
    subtitles_available: false, // Vimeo subtitles require API key
    subtitle_languages: [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Auth check
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

    // Rate limit
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 20, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const { url, platform, episode_id } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let result: MetadataResult;

    if (platform === "youtube") {
      // Extract video ID
      const ytMatch = url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/);
      const videoId = ytMatch?.[1] || "";
      result = await fetchYouTubeMetadata(url, videoId);
    } else if (platform === "vimeo") {
      result = await fetchVimeoMetadata(url);
    } else {
      // Generic URL — try to extract title from HTML
      try {
        const pageResp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 AI-IDEI Bot" },
          redirect: "follow",
        });
        const html = await pageResp.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        result = {
          title: titleMatch?.[1]?.trim() || new URL(url).hostname,
          duration_seconds: null,
          uploader: new URL(url).hostname,
          thumbnail_url: null,
          subtitles_available: false,
          subtitle_languages: [],
        };
      } catch {
        result = {
          title: new URL(url).hostname,
          duration_seconds: null,
          uploader: "Unknown",
          thumbnail_url: null,
          subtitles_available: false,
          subtitle_languages: [],
        };
      }
    }

    // Optionally update episode with metadata
    if (episode_id) {
      const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await serviceClient
        .from("episodes")
        .update({
          title: result.title,
          duration_seconds: result.duration_seconds,
          metadata: {
            uploader: result.uploader,
            thumbnail_url: result.thumbnail_url,
            subtitles_available: result.subtitles_available,
            subtitle_languages: result.subtitle_languages,
            fetched_at: new Date().toISOString(),
          },
        } as any)
        .eq("id", episode_id)
        .eq("author_id", user.id);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-metadata error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to fetch metadata" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
