import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

/**
 * transcribe-source: Unified transcription pipeline
 * 
 * Flow:
 *   Client → Edge API → Detect source → Fetch metadata
 *   → Try subtitles (fast path, <1s)
 *   → Fallback to ElevenLabs STT
 *   → Store transcript in DB
 * 
 * Input: { url, episode_id, language? }
 * Output: { transcript, segments, language, source, metadata }
 */

import { rateLimitGuard } from "../_shared/rate-limiter.ts";

// ── Source Detection ──
interface SourceInfo {
  platform: "youtube" | "vimeo" | "direct" | "unknown";
  source_type: "video" | "audio" | "webpage";
  video_id: string | null;
  canonical_url: string;
}

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([\w-]{11})/,
];
const VIMEO_PATTERN = /(?:vimeo\.com\/)(\d+)/;
const AUDIO_EXTS = /\.(mp3|wav|m4a|ogg|flac|opus|aac|webm)$/i;
const VIDEO_EXTS = /\.(mp4|mov|avi|mkv|wmv|flv)$/i;

function detectSource(url: string): SourceInfo {
  // YouTube
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return {
        platform: "youtube",
        source_type: "video",
        video_id: match[1],
        canonical_url: `https://www.youtube.com/watch?v=${match[1]}`,
      };
    }
  }
  // Also check query param
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) {
        return {
          platform: "youtube",
          source_type: "video",
          video_id: v,
          canonical_url: `https://www.youtube.com/watch?v=${v}`,
        };
      }
    }
  } catch {}

  // Vimeo
  const vimeoMatch = url.match(VIMEO_PATTERN);
  if (vimeoMatch?.[1]) {
    return {
      platform: "vimeo",
      source_type: "video",
      video_id: vimeoMatch[1],
      canonical_url: `https://vimeo.com/${vimeoMatch[1]}`,
    };
  }

  // Direct audio/video
  try {
    const pathname = new URL(url).pathname;
    if (AUDIO_EXTS.test(pathname)) {
      return { platform: "direct", source_type: "audio", video_id: null, canonical_url: url };
    }
    if (VIDEO_EXTS.test(pathname)) {
      return { platform: "direct", source_type: "video", video_id: null, canonical_url: url };
    }
  } catch {}

  return { platform: "unknown", source_type: "webpage", video_id: null, canonical_url: url };
}

// ── Metadata Fetch ──
interface SourceMetadata {
  title: string;
  duration_seconds: number | null;
  uploader: string;
  thumbnail_url: string | null;
}

async function fetchMetadata(source: SourceInfo): Promise<SourceMetadata> {
  const fallback: SourceMetadata = {
    title: "",
    duration_seconds: null,
    uploader: "",
    thumbnail_url: null,
  };

  try {
    if (source.platform === "youtube") {
      const resp = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(source.canonical_url)}&format=json`
      );
      if (resp.ok) {
        const data = await resp.json();
        return {
          title: data.title || "",
          duration_seconds: null,
          uploader: data.author_name || "",
          thumbnail_url: data.thumbnail_url || `https://img.youtube.com/vi/${source.video_id}/maxresdefault.jpg`,
        };
      }
    } else if (source.platform === "vimeo") {
      const resp = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(source.canonical_url)}`
      );
      if (resp.ok) {
        const data = await resp.json();
        return {
          title: data.title || "",
          duration_seconds: data.duration || null,
          uploader: data.author_name || "",
          thumbnail_url: data.thumbnail_url || null,
        };
      }
    } else {
      // Generic: scrape <title>
      const resp = await fetch(source.canonical_url, {
        headers: { "User-Agent": "Mozilla/5.0 AI-IDEI Bot" },
        redirect: "follow",
      });
      if (resp.ok) {
        const html = await resp.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch?.[1]) {
          return { ...fallback, title: titleMatch[1].trim() };
        }
      }
    }
  } catch (e) {
    console.warn("Metadata fetch failed:", e);
  }

  // URL-based title fallback
  try {
    const pathname = new URL(source.canonical_url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      const last = decodeURIComponent(parts[parts.length - 1])
        .replace(/[-_]/g, " ")
        .replace(/\.\w+$/, "")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (last.length > 2) return { ...fallback, title: last };
    }
    return { ...fallback, title: new URL(source.canonical_url).hostname.replace("www.", "") };
  } catch {
    return { ...fallback, title: `Episode ${new Date().toLocaleDateString()}` };
  }
}

// ── Subtitle Fetch (Fast Path) ──
interface SubtitleResult {
  text: string;
  language: string;
  segments: Array<{ start: number; end: number; text: string }>;
  kind: string;
}

const SUBTITLE_LANG_PRIORITY = ["ro", "en"];

async function fetchSubtitles(videoId: string): Promise<SubtitleResult | null> {
  try {
    // Get available tracks
    const listResp = await fetch(`https://video.google.com/timedtext?v=${videoId}&type=list`);
    if (!listResp.ok) return null;

    const listXml = await listResp.text();
    const tracks: Array<{ code: string; kind?: string }> = [];
    const trackRegex = /lang_code="([^"]+)"(?:[^>]*kind="([^"]*)")?/g;
    let match;
    while ((match = trackRegex.exec(listXml)) !== null) {
      tracks.push({ code: match[1], kind: match[2] });
    }

    if (tracks.length === 0) return null;

    // Select best track: manual in priority order, then auto, then first
    let selected: { code: string; kind?: string } | null = null;

    for (const lang of SUBTITLE_LANG_PRIORITY) {
      const manual = tracks.find((t) => t.code === lang && t.kind !== "asr");
      if (manual) { selected = manual; break; }
    }
    if (!selected) {
      for (const lang of SUBTITLE_LANG_PRIORITY) {
        const auto = tracks.find((t) => t.code === lang);
        if (auto) { selected = auto; break; }
      }
    }
    if (!selected) selected = tracks[0];

    // Download captions
    let subUrl = `https://video.google.com/timedtext?v=${videoId}&lang=${selected.code}`;
    if (selected.kind) subUrl += `&kind=${selected.kind}`;

    const subResp = await fetch(subUrl);
    if (!subResp.ok) return null;

    const xml = await subResp.text();

    // Parse <text start="..." dur="...">content</text>
    const segments: SubtitleResult["segments"] = [];
    const textParts: string[] = [];
    const segRegex = /<text[^>]*\bstart="([\d.]+)"[^>]*\bdur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let seg;
    while ((seg = segRegex.exec(xml)) !== null) {
      const start = parseFloat(seg[1]);
      const dur = parseFloat(seg[2]);
      const text = seg[3]
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, "").replace(/\n/g, " ").trim();
      if (text) {
        segments.push({ start, end: start + dur, text });
        textParts.push(text);
      }
    }

    const fullText = textParts.join(" ");
    if (!fullText.trim()) return null;

    return {
      text: fullText,
      language: selected.code,
      segments,
      kind: selected.kind === "asr" ? "auto" : "manual",
    };
  } catch (e) {
    console.warn("Subtitle fetch failed:", e);
    return null;
  }
}

// ── ElevenLabs STT (Fallback) ──
interface STTResult {
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  duration_seconds: number | null;
  language: string | null;
}

async function transcribeWithElevenLabs(
  supabase: any,
  filePath: string,
  language: string | undefined,
  apiKey: string
): Promise<STTResult> {
  // Download from storage
  const { data: fileData, error: dlErr } = await supabase.storage
    .from("episode-files")
    .download(filePath);

  if (!fileData || dlErr) {
    throw new Error("Failed to download file from storage");
  }

  const fileName = filePath.split("/").pop() || "audio.mp3";
  const formData = new FormData();
  formData.append("file", new File([fileData], fileName, { type: fileData.type }));
  formData.append("model_id", "scribe_v2");
  formData.append("tag_audio_events", "true");
  formData.append("diarize", "true");
  if (language) formData.append("language_code", language);

  console.log(`[STT] ElevenLabs: ${fileName} (${(fileData.size / 1024 / 1024).toFixed(2)} MB)`);

  const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData,
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`ElevenLabs STT error ${resp.status}: ${errBody}`);
  }

  const result = await resp.json();
  const text = result.text || "";

  // Build segments from word timestamps
  const segments: STTResult["segments"] = [];
  if (result.words?.length > 0) {
    const blockSize = 10;
    for (let i = 0; i < result.words.length; i += blockSize) {
      const block = result.words.slice(i, i + blockSize);
      segments.push({
        start: block[0].start,
        end: block[block.length - 1].end,
        text: block.map((w: any) => w.text).join(" "),
      });
    }
  }

  let duration_seconds: number | null = null;
  if (result.words?.length > 0) {
    duration_seconds = Math.ceil(result.words[result.words.length - 1].end);
  }

  return { text, segments, duration_seconds, language: null };
}

// ── External transcription service ──
async function transcribeWithExternalService(
  serviceUrl: string,
  apiSecret: string | undefined,
  sourceUrl: string,
  language: string | undefined
): Promise<{
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  duration_seconds: number | null;
  language: string | null;
  source: string;
}> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiSecret) headers["Authorization"] = `Bearer ${apiSecret}`;

  const resp = await fetch(`${serviceUrl}/transcribe`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url: sourceUrl,
      language: language || null,
      prefer_subtitles: true,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`External service error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  return {
    text: data.transcript_text || data.transcript || "",
    segments: data.segments || [],
    duration_seconds: data.duration_seconds || null,
    language: data.language || null,
    source: data.source || "external",
  };
}

// ── Build SRT ──
function buildSrt(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((seg, i) => `${i + 1}\n${fmtSrt(seg.start)} --> ${fmtSrt(seg.end)}\n${seg.text}\n`)
    .join("\n");
}

function fmtSrt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// ═══════════════════════════════════════
// Main handler
// ═══════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  const TRANSCRIPTION_SERVICE_URL = Deno.env.get("TRANSCRIPTION_SERVICE_URL");
  const TRANSCRIPTION_API_SECRET = Deno.env.get("TRANSCRIPTION_API_SECRET");

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── Auth ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user: caller },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Rate limit (DB-backed, persistent) ──
    const rateLimited = await rateLimitGuard(caller.id, req, { maxRequests: 10, windowSeconds: 3600 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    // ── Regime ──
    const regime = await getRegimeConfig("transcribe-audio");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(
        JSON.stringify({ error: "Service blocked", reason: blockReason }),
        { status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ── Input ──
    const body = await req.json();
    const { url, episode_id, file_path, language } = body;

    if (!url && !file_path) {
      return new Response(
        JSON.stringify({ error: "Provide url or file_path" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ── Verify episode ownership ──
    let episode: any = null;
    if (episode_id) {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("id", episode_id)
        .eq("author_id", caller.id)
        .single();
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Episode not found or access denied" }),
          { status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      episode = data;
      await supabase.from("episodes").update({ status: "transcribing" }).eq("id", episode_id);
    }

    // ═══════════════════════════════
    // STEP 1: Detect source
    // ═══════════════════════════════
    let source: SourceInfo | null = null;
    if (url) {
      source = detectSource(url);
      console.log(`[pipeline] Source: ${source.platform} (${source.source_type})`);
    }

    // ═══════════════════════════════
    // STEP 2: Fetch metadata
    // ═══════════════════════════════
    let metadata: SourceMetadata | null = null;
    if (source) {
      metadata = await fetchMetadata(source);
      console.log(`[pipeline] Metadata: "${metadata.title}" by ${metadata.uploader}`);
    }

    // ═══════════════════════════════
    // STEP 3: Try subtitles (fast path)
    // ═══════════════════════════════
    if (source?.platform === "youtube" && source.video_id) {
      console.log("[pipeline] Attempting YouTube subtitle download...");
      const subs = await fetchSubtitles(source.video_id);

      if (subs && subs.text.trim()) {
        console.log(`[pipeline] ✓ Subtitles found: ${subs.language} (${subs.kind}), ${subs.segments.length} segments`);

        const srtContent = buildSrt(subs.segments);
        const lastSeg = subs.segments[subs.segments.length - 1];
        const durationSeconds = lastSeg ? Math.ceil(lastSeg.end) : metadata?.duration_seconds || null;

        // Store in episode
        if (episode_id) {
          await supabase
            .from("episodes")
            .update({
              transcript: subs.text,
              status: "transcribed",
              duration_seconds: durationSeconds,
              language: subs.language,
              title: metadata?.title || episode?.title || "Untitled",
              metadata: {
                ...(typeof episode?.metadata === "object" && episode?.metadata ? episode.metadata : {}),
                transcription_source: "youtube_captions",
                subtitle_language: subs.language,
                subtitle_kind: subs.kind,
                uploader: metadata?.uploader,
                thumbnail_url: metadata?.thumbnail_url,
                segment_count: subs.segments.length,
                word_count: subs.text.split(/\s+/).length,
                has_srt: true,
                transcribed_at: new Date().toISOString(),
              },
            } as any)
            .eq("id", episode_id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            episode_id,
            transcript: subs.text,
            transcript_length: subs.text.length,
            word_count: subs.text.split(/\s+/).length,
            language: subs.language,
            source: "subtitles",
            subtitle_kind: subs.kind,
            duration_seconds: durationSeconds,
            segments: subs.segments,
            has_srt: true,
            srt: srtContent,
            metadata: metadata
              ? { title: metadata.title, uploader: metadata.uploader, thumbnail_url: metadata.thumbnail_url }
              : null,
          }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      console.log("[pipeline] No subtitles found, falling back to speech recognition");
    }

    // ═══════════════════════════════
    // STEP 4: Speech recognition fallback
    // ═══════════════════════════════

    // Strategy A: External service (yt-dlp + faster-whisper)
    if (TRANSCRIPTION_SERVICE_URL && url) {
      console.log(`[pipeline] Using external transcription service`);
      try {
        const extResult = await transcribeWithExternalService(
          TRANSCRIPTION_SERVICE_URL,
          TRANSCRIPTION_API_SECRET,
          url,
          language
        );

        if (extResult.text.trim()) {
          const srtContent = buildSrt(extResult.segments);

          if (episode_id) {
            await supabase
              .from("episodes")
              .update({
                transcript: extResult.text,
                status: "transcribed",
                duration_seconds: extResult.duration_seconds,
                language: extResult.language,
                title: metadata?.title || episode?.title || "Untitled",
                metadata: {
                  ...(typeof episode?.metadata === "object" && episode?.metadata ? episode.metadata : {}),
                  transcription_source: extResult.source,
                  uploader: metadata?.uploader,
                  thumbnail_url: metadata?.thumbnail_url,
                  word_count: extResult.text.split(/\s+/).length,
                  segment_count: extResult.segments.length,
                  has_srt: extResult.segments.length > 0,
                  transcribed_at: new Date().toISOString(),
                },
              } as any)
              .eq("id", episode_id);
          }

          return new Response(
            JSON.stringify({
              success: true,
              episode_id,
              transcript: extResult.text,
              transcript_length: extResult.text.length,
              word_count: extResult.text.split(/\s+/).length,
              language: extResult.language,
              source: extResult.source,
              duration_seconds: extResult.duration_seconds,
              segments: extResult.segments,
              has_srt: extResult.segments.length > 0,
              srt: srtContent || null,
              metadata: metadata
                ? { title: metadata.title, uploader: metadata.uploader, thumbnail_url: metadata.thumbnail_url }
                : null,
            }),
            { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.warn("[pipeline] External service failed, trying ElevenLabs:", e);
      }
    }

    // Strategy B: ElevenLabs STT (file-based)
    if (file_path && ELEVENLABS_API_KEY) {
      console.log(`[pipeline] Using ElevenLabs STT`);
      const sttResult = await transcribeWithElevenLabs(supabase, file_path, language, ELEVENLABS_API_KEY);

      if (!sttResult.text.trim()) {
        if (episode_id) {
          await supabase.from("episodes").update({ status: "error" }).eq("id", episode_id);
        }
        return new Response(
          JSON.stringify({ error: "Transcription returned empty text" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const srtContent = buildSrt(sttResult.segments);

      if (episode_id) {
        await supabase
          .from("episodes")
          .update({
            transcript: sttResult.text,
            status: "transcribed",
            duration_seconds: sttResult.duration_seconds,
            title: metadata?.title || episode?.title || "Untitled",
            metadata: {
              ...(typeof episode?.metadata === "object" && episode?.metadata ? episode.metadata : {}),
              transcription_source: "elevenlabs_scribe_v2",
              uploader: metadata?.uploader,
              thumbnail_url: metadata?.thumbnail_url,
              word_count: sttResult.text.split(/\s+/).length,
              segment_count: sttResult.segments.length,
              has_srt: sttResult.segments.length > 0,
              transcribed_at: new Date().toISOString(),
            },
          } as any)
          .eq("id", episode_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          episode_id,
          transcript: sttResult.text,
          transcript_length: sttResult.text.length,
          word_count: sttResult.text.split(/\s+/).length,
          language: sttResult.language,
          source: "elevenlabs",
          duration_seconds: sttResult.duration_seconds,
          segments: sttResult.segments,
          has_srt: sttResult.segments.length > 0,
          srt: srtContent || null,
          metadata: metadata
            ? { title: metadata.title, uploader: metadata.uploader, thumbnail_url: metadata.thumbnail_url }
            : null,
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // No backend available
    if (episode_id) {
      await supabase.from("episodes").update({ status: "error" }).eq("id", episode_id);
    }
    return new Response(
      JSON.stringify({
        error: "No transcription backend available. Configure ELEVENLABS_API_KEY or TRANSCRIPTION_SERVICE_URL.",
      }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[transcribe-source] Fatal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
