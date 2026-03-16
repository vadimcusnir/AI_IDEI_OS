/**
 * Source Detection Utility
 * Detects platform, source type, and canonical URL from user input.
 */

export interface SourceDetectionResult {
  source_type: "video" | "audio" | "webpage";
  platform: "youtube" | "vimeo" | "direct" | "unknown";
  canonical_url: string;
}

const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".opus", ".aac", ".wma", ".webm"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm"];

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([\w-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([\w-]{11})/,
  /(?:https?:\/\/)?music\.youtube\.com\/watch\?v=([\w-]{11})/,
];

const VIMEO_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
  /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
];

function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  // Check for v= param in any YouTube URL
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
      const v = parsed.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
    }
  } catch {}
  return null;
}

function extractVimeoId(url: string): string | null {
  for (const pattern of VIMEO_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const lastDot = pathname.lastIndexOf(".");
    if (lastDot === -1) return "";
    return pathname.slice(lastDot).toLowerCase().split("?")[0];
  } catch {
    return "";
  }
}

export function detectSource(url: string): SourceDetectionResult {
  const trimmed = url.trim();

  // YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      source_type: "video",
      platform: "youtube",
      canonical_url: `https://www.youtube.com/watch?v=${ytId}`,
    };
  }

  // Vimeo
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return {
      source_type: "video",
      platform: "vimeo",
      canonical_url: `https://vimeo.com/${vimeoId}`,
    };
  }

  // Direct file links
  const ext = getFileExtension(trimmed);
  if (AUDIO_EXTENSIONS.includes(ext)) {
    return {
      source_type: "audio",
      platform: "direct",
      canonical_url: trimmed,
    };
  }
  if (VIDEO_EXTENSIONS.includes(ext)) {
    return {
      source_type: "video",
      platform: "direct",
      canonical_url: trimmed,
    };
  }

  // Generic webpage
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return {
        source_type: "webpage",
        platform: "unknown",
        canonical_url: trimmed,
      };
    }
  } catch {}

  return {
    source_type: "webpage",
    platform: "unknown",
    canonical_url: trimmed,
  };
}

/**
 * Detect source type from a File object
 */
export function detectFileSource(file: File): SourceDetectionResult {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;

  if (file.type.startsWith("audio/") || AUDIO_EXTENSIONS.includes(ext)) {
    return { source_type: "audio", platform: "direct", canonical_url: file.name };
  }
  if (file.type.startsWith("video/") || VIDEO_EXTENSIONS.includes(ext)) {
    return { source_type: "video", platform: "direct", canonical_url: file.name };
  }

  return { source_type: "webpage", platform: "direct", canonical_url: file.name };
}
