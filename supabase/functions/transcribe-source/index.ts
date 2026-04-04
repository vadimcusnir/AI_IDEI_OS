import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * transcribe-source: UNIFIED AUDIO-FIRST transcription pipeline.
 *
 * Architecture (non-negotiable):
 *   1. Detect source (YouTube / direct audio / direct video)
 *   2. Fetch metadata (oEmbed)
 *   3. Extract audio (cobalt.tools for YouTube, direct download for files)
 *   4. Upload to temp storage
 *   5. ElevenLabs Scribe v2 (STT + diarization + language detection)
 *   6. Normalize transcript (unified schema)
 *   7. Store in DB + generate SRT
 *   8. [Optional] Fetch subtitles as comparison metadata ONLY
 *
 * RULE: Subtitles are NEVER the primary transcript source.
 * RULE: Original spoken language is always preserved.
 * RULE: Same pipeline for YouTube and uploaded files.
 */

// ═══════════════════════════════════════
// Source Detection
// ═══════════════════════════════════════
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
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) {
        return { platform: "youtube", source_type: "video", video_id: v, canonical_url: `https://www.youtube.com/watch?v=${v}` };
      }
    }
  } catch {}

  const vimeoMatch = url.match(VIMEO_PATTERN);
  if (vimeoMatch?.[1]) {
    return { platform: "vimeo", source_type: "video", video_id: vimeoMatch[1], canonical_url: `https://vimeo.com/${vimeoMatch[1]}` };
  }

  try {
    const pathname = new URL(url).pathname;
    if (AUDIO_EXTS.test(pathname)) return { platform: "direct", source_type: "audio", video_id: null, canonical_url: url };
    if (VIDEO_EXTS.test(pathname)) return { platform: "direct", source_type: "video", video_id: null, canonical_url: url };
  } catch {}

  return { platform: "unknown", source_type: "webpage", video_id: null, canonical_url: url };
}

// ═══════════════════════════════════════
// Metadata
// ═══════════════════════════════════════
interface SourceMetadata {
  title: string;
  duration_seconds: number | null;
  uploader: string;
  thumbnail_url: string | null;
}

async function fetchMetadata(source: SourceInfo): Promise<SourceMetadata> {
  const fallback: SourceMetadata = { title: "", duration_seconds: null, uploader: "", thumbnail_url: null };
  try {
    if (source.platform === "youtube") {
      const resp = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(source.canonical_url)}&format=json`);
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
      const resp = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(source.canonical_url)}`);
      if (resp.ok) {
        const data = await resp.json();
        return { title: data.title || "", duration_seconds: data.duration || null, uploader: data.author_name || "", thumbnail_url: data.thumbnail_url || null };
      }
    }
  } catch (e) {
    console.warn("[metadata] Failed:", e);
  }
  try {
    const parts = new URL(source.canonical_url).pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      const last = decodeURIComponent(parts[parts.length - 1]).replace(/[-_]/g, " ").replace(/\.\w+$/, "").replace(/\b\w/g, c => c.toUpperCase());
      if (last.length > 2) return { ...fallback, title: last };
    }
  } catch {}
  return { ...fallback, title: `Episode ${new Date().toLocaleDateString()}` };
}

// ═══════════════════════════════════════
// Failure Taxonomy
// ═══════════════════════════════════════
type FailureClass =
  | "invalid_url"
  | "unsupported_source"
  | "video_private_or_blocked"
  | "media_fetch_failed"
  | "media_too_long"
  | "audio_decode_failed"
  | "transcription_timeout"
  | "language_detection_failed"
  | "diarization_failed_non_blocking"
  | "storage_write_failed"
  | "downstream_pipeline_failed"
  | "no_backend_configured"
  | "auth_failed";

function failResponse(
  failure_class: FailureClass,
  message: string,
  status: number,
  headers: Record<string, string>,
  retryable = false,
) {
  return new Response(
    JSON.stringify({ error: message, failure_class, retryable }),
    { status, headers: { ...headers, "Content-Type": "application/json" } },
  );
}

// ═══════════════════════════════════════
// Audio Extraction — YouTube via cobalt.tools
// ═══════════════════════════════════════
async function extractYouTubeAudio(videoId: string): Promise<{ audioUrl: string; filename: string } | null> {
  const COBALT_INSTANCES = [
    "https://api.cobalt.tools",
  ];

  for (const instance of COBALT_INSTANCES) {
    try {
      console.log(`[audio-extract] Trying cobalt: ${instance}`);
      const resp = await fetch(`${instance}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          downloadMode: "audio",
          audioFormat: "mp3",
        }),
      });

      if (!resp.ok) {
        console.warn(`[audio-extract] cobalt ${instance} returned ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      if (data.status === "tunnel" || data.status === "redirect") {
        const audioUrl = data.url;
        if (audioUrl) {
          console.log(`[audio-extract] ✓ Got audio URL from cobalt`);
          return { audioUrl, filename: `yt_${videoId}.mp3` };
        }
      }
      if (data.status === "picker" && data.picker?.length > 0) {
        // Pick audio track
        const audioTrack = data.picker.find((p: any) => p.type === "audio") || data.picker[0];
        if (audioTrack?.url) {
          return { audioUrl: audioTrack.url, filename: `yt_${videoId}.mp3` };
        }
      }
      console.warn(`[audio-extract] cobalt response status: ${data.status}`);
    } catch (e) {
      console.warn(`[audio-extract] cobalt ${instance} error:`, e);
    }
  }

  return null;
}

// ═══════════════════════════════════════
// Download audio to Blob
// ═══════════════════════════════════════
async function downloadAudioBlob(audioUrl: string, maxSizeMB = 500): Promise<Blob> {
  const resp = await fetch(audioUrl, {
    headers: { "User-Agent": "Mozilla/5.0 AI-IDEI Transcription Bot" },
    redirect: "follow",
  });

  if (!resp.ok) throw new Error(`Audio download failed: HTTP ${resp.status}`);

  const contentLength = parseInt(resp.headers.get("Content-Length") || "0");
  if (contentLength > maxSizeMB * 1024 * 1024) {
    throw new Error(`Audio file too large: ${(contentLength / 1024 / 1024).toFixed(0)} MB (max ${maxSizeMB} MB)`);
  }

  return await resp.blob();
}

// ═══════════════════════════════════════
// ElevenLabs Scribe v2 — Core STT Engine
// ═══════════════════════════════════════
interface TranscriptResult {
  text: string;
  segments: Array<{ start: number; end: number; text: string; speaker?: string }>;
  duration_seconds: number | null;
  detected_language: string | null;
  speakers: string[];
  confidence: number;
  processing_mode: "elevenlabs_scribe_v2";
}

async function transcribeWithElevenLabs(
  audioBlob: Blob,
  filename: string,
  apiKey: string,
  preferredLanguage?: string,
): Promise<TranscriptResult> {
  const formData = new FormData();
  formData.append("file", new File([audioBlob], filename, { type: audioBlob.type || "audio/mpeg" }));
  formData.append("model_id", "scribe_v2");
  formData.append("tag_audio_events", "true");
  formData.append("diarize", "true");
  if (preferredLanguage) formData.append("language_code", preferredLanguage);

  console.log(`[stt] ElevenLabs Scribe v2: ${filename} (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB), diarize=true`);

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

  // Build segments with speaker labels from word timestamps
  const segments: TranscriptResult["segments"] = [];
  const speakerSet = new Set<string>();

  if (result.words?.length > 0) {
    let currentSpeaker = result.words[0].speaker || "speaker_0";
    let blockStart = result.words[0].start;
    let blockWords: string[] = [];

    for (let i = 0; i < result.words.length; i++) {
      const word = result.words[i];
      const speaker = word.speaker || "speaker_0";
      speakerSet.add(speaker);

      // New segment on speaker change or every ~10 words
      if (speaker !== currentSpeaker || blockWords.length >= 10) {
        if (blockWords.length > 0) {
          segments.push({
            start: blockStart,
            end: result.words[i - 1].end,
            text: blockWords.join(" "),
            speaker: currentSpeaker,
          });
        }
        currentSpeaker = speaker;
        blockStart = word.start;
        blockWords = [word.text];
      } else {
        blockWords.push(word.text);
      }
    }

    // Flush remaining
    if (blockWords.length > 0) {
      segments.push({
        start: blockStart,
        end: result.words[result.words.length - 1].end,
        text: blockWords.join(" "),
        speaker: currentSpeaker,
      });
    }
  }

  let duration_seconds: number | null = null;
  if (result.words?.length > 0) {
    duration_seconds = Math.ceil(result.words[result.words.length - 1].end);
  }

  // Detect language from result or first words
  const detected_language = result.language_code || result.detected_language || null;

  return {
    text,
    segments,
    duration_seconds,
    detected_language,
    speakers: Array.from(speakerSet),
    confidence: result.language_probability || 0.9,
    processing_mode: "elevenlabs_scribe_v2",
  };
}

// ═══════════════════════════════════════
// ElevenLabs from Storage path (uploaded files)
// ═══════════════════════════════════════
async function transcribeFromStorage(
  supabase: any,
  filePath: string,
  apiKey: string,
  language?: string,
): Promise<TranscriptResult> {
  const { data: fileData, error: dlErr } = await supabase.storage
    .from("episode-files")
    .download(filePath);

  if (!fileData || dlErr) {
    throw new Error("Failed to download file from storage");
  }

  const fileName = filePath.split("/").pop() || "audio.mp3";
  return transcribeWithElevenLabs(fileData, fileName, apiKey, language);
}

// ═══════════════════════════════════════
// SRT Builder
// ═══════════════════════════════════════
function buildSrt(segments: Array<{ start: number; end: number; text: string; speaker?: string }>): string {
  return segments
    .map((seg, i) => {
      const speakerPrefix = seg.speaker ? `[${seg.speaker}] ` : "";
      return `${i + 1}\n${fmtSrt(seg.start)} --> ${fmtSrt(seg.end)}\n${speakerPrefix}${seg.text}\n`;
    })
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
// Subtitle fetch — METADATA ONLY
// ═══════════════════════════════════════
async function fetchSubtitlesAsMetadata(videoId: string): Promise<{
  available: boolean;
  languages: string[];
  has_manual: boolean;
} | null> {
  try {
    const listResp = await fetch(`https://video.google.com/timedtext?v=${videoId}&type=list`);
    if (!listResp.ok) return null;

    const listXml = await listResp.text();
    const languages: string[] = [];
    let hasManual = false;
    const trackRegex = /lang_code="([^"]+)"(?:[^>]*kind="([^"]*)")?/g;
    let match;
    while ((match = trackRegex.exec(listXml)) !== null) {
      languages.push(match[1]);
      if (match[2] !== "asr") hasManual = true;
    }

    return { available: languages.length > 0, languages, has_manual: hasManual };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════
// Unified Transcript Schema
// ═══════════════════════════════════════
interface UnifiedTranscript {
  source_type: string;
  source_url: string | null;
  media_origin: string;
  detected_language: string | null;
  transcript_language: string | null;
  transcript_text: string;
  segments: Array<{ start: number; end: number; text: string; speaker?: string }>;
  speakers: string[];
  confidence: number;
  duration_seconds: number | null;
  processing_mode: string;
  fallback_used: boolean;
  failure_reason: string | null;
}

// ═══════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Timing
  const timings: Record<string, number> = {};
  const startTotal = Date.now();

  try {
    // ── Auth ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return failResponse("auth_failed", "Unauthorized", 401, corsHeaders);
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return failResponse("auth_failed", "Unauthorized", 401, corsHeaders);
    }

    // Rate limit
    const rateLimited = await rateLimitGuard(caller.id, req, { maxRequests: 10, windowSeconds: 3600 }, corsHeaders);
    if (rateLimited) return rateLimited;

    // Regime
    const regime = await getRegimeConfig("transcribe-audio");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return failResponse("unsupported_source", `Service blocked: ${blockReason}`, 403, corsHeaders);
    }

    // ── Input ──
    const body = await req.json();
    const { url, episode_id, file_path, language } = body;

    if (!url && !file_path) {
      return failResponse("invalid_url", "Provide url or file_path", 400, corsHeaders);
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
        return failResponse("invalid_url", "Episode not found or access denied", 404, corsHeaders);
      }
      episode = data;
    }

    // Update status
    const updateStatus = async (status: string, extra?: Record<string, any>) => {
      if (!episode_id) return;
      const update: any = { status };
      if (extra) {
        update.metadata = {
          ...(typeof episode?.metadata === "object" && episode?.metadata ? episode.metadata : {}),
          ...extra,
        };
      }
      await supabase.from("episodes").update(update).eq("id", episode_id);
    };

    // ═══ STEP 1: Detect source ═══
    let source: SourceInfo | null = null;
    if (url) {
      source = detectSource(url);
      console.log(`[pipeline] Source: ${source.platform} (${source.source_type})`);
    }

    // ═══ STEP 2: Fetch metadata ═══
    const t2 = Date.now();
    let metadata: SourceMetadata | null = null;
    if (source) {
      metadata = await fetchMetadata(source);
      console.log(`[pipeline] Metadata: "${metadata.title}" by ${metadata.uploader}`);
    }
    timings.metadata_ms = Date.now() - t2;

    // Update episode title early
    if (episode_id && metadata?.title) {
      await supabase.from("episodes").update({
        title: metadata.title,
        source_url: source?.canonical_url || url,
      } as any).eq("id", episode_id);
    }

    // ═══ CHECK: ElevenLabs API key required ═══
    if (!ELEVENLABS_API_KEY) {
      return failResponse("no_backend_configured", "Transcription backend not configured (ELEVENLABS_API_KEY required)", 500, corsHeaders);
    }

    let sttResult: TranscriptResult;

    // ═══ STEP 3: Audio acquisition + STT ═══
    if (file_path) {
      // ── PATH A: Uploaded file → direct ElevenLabs ──
      await updateStatus("transcribing", { stage: "transcribing_audio" });
      console.log(`[pipeline] File path: ${file_path}`);

      const t3 = Date.now();
      sttResult = await transcribeFromStorage(supabase, file_path, ELEVENLABS_API_KEY, language);
      timings.stt_ms = Date.now() - t3;

    } else if (source?.platform === "youtube" && source.video_id) {
      // ── PATH B: YouTube → extract audio → ElevenLabs ──
      await updateStatus("transcribing", { stage: "extracting_audio" });

      // Step 3a: Extract audio from YouTube
      const t3a = Date.now();
      const audioExtract = await extractYouTubeAudio(source.video_id);
      timings.audio_extract_ms = Date.now() - t3a;

      if (!audioExtract) {
        await updateStatus("error", { failure_class: "media_fetch_failed" });
        return failResponse(
          "media_fetch_failed",
          "Could not extract audio from YouTube video. The video may be private, age-restricted, or geo-blocked.",
          422,
          corsHeaders,
          true,
        );
      }

      // Step 3b: Download audio blob
      await updateStatus("transcribing", { stage: "downloading_audio" });
      const t3b = Date.now();
      let audioBlob: Blob;
      try {
        audioBlob = await downloadAudioBlob(audioExtract.audioUrl);
      } catch (e) {
        await updateStatus("error", { failure_class: "media_fetch_failed" });
        return failResponse(
          "media_fetch_failed",
          e instanceof Error ? e.message : "Audio download failed",
          422,
          corsHeaders,
          true,
        );
      }
      timings.download_ms = Date.now() - t3b;
      console.log(`[pipeline] Audio downloaded: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);

      // Step 3c: Transcribe with ElevenLabs
      await updateStatus("transcribing", { stage: "transcribing_audio" });
      const t3c = Date.now();
      sttResult = await transcribeWithElevenLabs(audioBlob, audioExtract.filename, ELEVENLABS_API_KEY, language);
      timings.stt_ms = Date.now() - t3c;

    } else if (source?.platform === "direct" || source?.platform === "vimeo") {
      // ── PATH C: Direct URL → download → ElevenLabs ──
      await updateStatus("transcribing", { stage: "downloading_audio" });

      const t3 = Date.now();
      let audioBlob: Blob;
      try {
        audioBlob = await downloadAudioBlob(source.canonical_url);
      } catch (e) {
        await updateStatus("error", { failure_class: "media_fetch_failed" });
        return failResponse("media_fetch_failed", e instanceof Error ? e.message : "Download failed", 422, corsHeaders, true);
      }
      timings.download_ms = Date.now() - t3;

      await updateStatus("transcribing", { stage: "transcribing_audio" });
      const t3b = Date.now();
      const filename = source.canonical_url.split("/").pop()?.split("?")[0] || "audio.mp3";
      sttResult = await transcribeWithElevenLabs(audioBlob, filename, ELEVENLABS_API_KEY, language);
      timings.stt_ms = Date.now() - t3b;

    } else {
      await updateStatus("error", { failure_class: "unsupported_source" });
      return failResponse("unsupported_source", "Unsupported source type. Provide a YouTube URL, audio/video URL, or upload a file.", 400, corsHeaders);
    }

    // ═══ STEP 4: Validate STT result ═══
    if (!sttResult.text.trim()) {
      await updateStatus("error", { failure_class: "audio_decode_failed" });
      return failResponse("audio_decode_failed", "Transcription returned empty text. Audio may be silent, corrupted, or too short.", 400, corsHeaders, true);
    }

    console.log(`[pipeline] ✓ STT complete: ${sttResult.text.split(/\s+/).length} words, ${sttResult.segments.length} segments, ${sttResult.speakers.length} speakers, lang=${sttResult.detected_language}`);

    // ═══ STEP 5: Optional subtitle metadata (YouTube only) ═══
    let subtitleMeta: { available: boolean; languages: string[]; has_manual: boolean } | null = null;
    if (source?.platform === "youtube" && source.video_id) {
      subtitleMeta = await fetchSubtitlesAsMetadata(source.video_id);
    }

    // ═══ STEP 6: Build SRT ═══
    const srtContent = buildSrt(sttResult.segments);

    // ═══ STEP 7: Store in DB ═══
    const unified: UnifiedTranscript = {
      source_type: source?.source_type || "audio",
      source_url: source?.canonical_url || url || null,
      media_origin: source?.platform || "upload",
      detected_language: sttResult.detected_language,
      transcript_language: sttResult.detected_language,
      transcript_text: sttResult.text,
      segments: sttResult.segments,
      speakers: sttResult.speakers,
      confidence: sttResult.confidence,
      duration_seconds: sttResult.duration_seconds,
      processing_mode: sttResult.processing_mode,
      fallback_used: false,
      failure_reason: null,
    };

    if (episode_id) {
      await supabase.from("episodes").update({
        transcript: sttResult.text,
        status: "transcribed",
        duration_seconds: sttResult.duration_seconds,
        language: sttResult.detected_language,
        title: metadata?.title || episode?.title || "Untitled",
        metadata: {
          ...(typeof episode?.metadata === "object" && episode?.metadata ? episode.metadata : {}),
          transcription_source: "elevenlabs_scribe_v2",
          processing_mode: "audio_first",
          detected_language: sttResult.detected_language,
          speakers: sttResult.speakers,
          speaker_count: sttResult.speakers.length,
          confidence: sttResult.confidence,
          uploader: metadata?.uploader,
          thumbnail_url: metadata?.thumbnail_url,
          word_count: sttResult.text.split(/\s+/).length,
          segment_count: sttResult.segments.length,
          has_srt: true,
          has_diarization: sttResult.speakers.length > 1,
          subtitle_metadata: subtitleMeta,
          timings,
          total_processing_ms: Date.now() - startTotal,
          transcribed_at: new Date().toISOString(),
        },
      } as any).eq("id", episode_id);
    }

    // ═══ STEP 8: Response ═══
    timings.total_ms = Date.now() - startTotal;

    return new Response(
      JSON.stringify({
        success: true,
        episode_id,
        transcript: sttResult.text,
        transcript_length: sttResult.text.length,
        word_count: sttResult.text.split(/\s+/).length,
        language: sttResult.detected_language,
        source: "audio_stt",
        processing_mode: "elevenlabs_scribe_v2",
        duration_seconds: sttResult.duration_seconds,
        segments: sttResult.segments,
        speakers: sttResult.speakers,
        speaker_count: sttResult.speakers.length,
        has_diarization: sttResult.speakers.length > 1,
        confidence: sttResult.confidence,
        has_srt: true,
        srt: srtContent,
        fallback_used: false,
        timings,
        metadata: metadata
          ? { title: metadata.title, uploader: metadata.uploader, thumbnail_url: metadata.thumbnail_url }
          : null,
        subtitle_metadata: subtitleMeta,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[transcribe-source] Fatal error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
        failure_class: "downstream_pipeline_failed",
        retryable: true,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
