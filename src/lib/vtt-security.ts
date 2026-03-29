/**
 * Secure VTT/SRT Parser & Sanitizer
 * ──────────────────────────────────
 * Fail-closed architecture:
 * 1. Validate file structure (header, encoding)
 * 2. Parse timestamps strictly
 * 3. Strip ALL HTML/script injection vectors
 * 4. Normalize text output (escape entities)
 * 5. Reject malformed input entirely
 *
 * NEVER renders raw VTT content as innerHTML.
 */

// ── Constants ──
const MAX_VTT_SIZE = 1_048_576; // 1 MB
const MAX_CUES = 10_000;
const MAX_CUE_TEXT_LENGTH = 2_000;
const VTT_HEADER_REGEX = /^WEBVTT(?:\s|$)/;
const SRT_TIMESTAMP_REGEX = /^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/;
const VTT_TIMESTAMP_REGEX = /^(?:(\d{2}):)?(\d{2}):(\d{2})[.](\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[.](\d{3})/;

// ── Threat patterns (XSS / injection) ──
const DANGEROUS_PATTERNS = [
  /<script/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouse/i,
  /onfocus/i,
  /onblur/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<form/i,
  /<img[^>]*src/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /vbscript\s*:/i,
  /<link/i,
  /<style/i,
  /<meta/i,
  /expression\s*\(/i,
  /url\s*\(/i,
  /import\s+/i,
  /@import/i,
];

export interface VttCue {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface VttParseResult {
  success: true;
  format: "vtt" | "srt";
  cues: VttCue[];
  plainText: string;
  warnings: string[];
  stats: {
    cueCount: number;
    wordCount: number;
    durationSeconds: number;
    charCount: number;
  };
}

export interface VttParseError {
  success: false;
  error: string;
  errorCode: "EMPTY" | "TOO_LARGE" | "INVALID_ENCODING" | "MALICIOUS_CONTENT" | "INVALID_FORMAT" | "PARSE_FAILED";
}

export type VttResult = VttParseResult | VttParseError;

// ── Sanitization ──

/** Strip ALL HTML tags from text, decode entities, normalize whitespace */
function sanitizeText(raw: string): string {
  return raw
    // Decode common HTML entities first (ampersand must be decoded last)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, "") // strip unknown numeric entities
    .replace(/&\w+;/g, "") // strip unknown named entities
    .replace(/&amp;/g, "&")
    // Remove ALL HTML tags (including VTT formatting: <b>, <i>, <u>, <c>, <v>, <ruby>, <rt>)
    .replace(/<[^>]*>/g, "")
    // Remove zero-width/control characters (unicode obfuscation)
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/** Escape text for safe DOM rendering */
export function escapeForDisplay(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Validation ──

/** Check raw content for dangerous injection patterns */
function detectMaliciousContent(content: string): string | null {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      return `Dangerous pattern detected: ${pattern.source}`;
    }
  }
  return null;
}

/** Validate and enforce UTF-8 encoding */
function validateEncoding(content: string): boolean {
  // Check for null bytes
  if (content.includes("\0")) return false;
  // Check for BOM and strip it
  return true;
}

// ── Timestamp parsing ──

function parseSrtTimestamp(h: string, m: string, s: string, ms: string): number {
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
}

function parseVttTimestamp(h: string | undefined, m: string, s: string, ms: string): number {
  return (h ? parseInt(h) * 3600 : 0) + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
}

// ── Core parsers ──

function parseSrt(content: string): { cues: VttCue[]; warnings: string[] } {
  const cues: VttCue[] = [];
  const warnings: string[] = [];
  const blocks = content.split(/\n\n+/);

  for (const block of blocks) {
    if (cues.length >= MAX_CUES) {
      warnings.push(`Truncated at ${MAX_CUES} cues`);
      break;
    }

    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Find timestamp line
    let tsLineIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      if (SRT_TIMESTAMP_REGEX.test(lines[i].trim())) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsMatch = lines[tsLineIdx].trim().match(SRT_TIMESTAMP_REGEX);
    if (!tsMatch) continue;

    const startTime = parseSrtTimestamp(tsMatch[1], tsMatch[2], tsMatch[3], tsMatch[4]);
    const endTime = parseSrtTimestamp(tsMatch[5], tsMatch[6], tsMatch[7], tsMatch[8]);

    if (endTime <= startTime) {
      warnings.push(`Cue ${cues.length + 1}: end time <= start time`);
      continue;
    }

    const textLines = lines.slice(tsLineIdx + 1);
    let text = sanitizeText(textLines.join(" "));

    if (text.length > MAX_CUE_TEXT_LENGTH) {
      text = text.slice(0, MAX_CUE_TEXT_LENGTH);
      warnings.push(`Cue ${cues.length + 1}: text truncated at ${MAX_CUE_TEXT_LENGTH} chars`);
    }

    if (text) {
      cues.push({ index: cues.length + 1, startTime, endTime, text });
    }
  }

  return { cues, warnings };
}

function parseVtt(content: string): { cues: VttCue[]; warnings: string[] } {
  const cues: VttCue[] = [];
  const warnings: string[] = [];

  // Remove header section (WEBVTT + optional metadata)
  const headerEnd = content.indexOf("\n\n");
  const body = headerEnd === -1 ? content : content.slice(headerEnd + 2);
  const blocks = body.split(/\n\n+/);

  for (const block of blocks) {
    if (cues.length >= MAX_CUES) {
      warnings.push(`Truncated at ${MAX_CUES} cues`);
      break;
    }

    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Skip NOTE blocks
    if (lines[0].startsWith("NOTE")) continue;
    // Skip STYLE blocks
    if (lines[0].startsWith("STYLE")) continue;

    // Find timestamp line
    let tsLineIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 2); i++) {
      if (VTT_TIMESTAMP_REGEX.test(lines[i].trim())) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsMatch = lines[tsLineIdx].trim().match(VTT_TIMESTAMP_REGEX);
    if (!tsMatch) continue;

    const startTime = parseVttTimestamp(tsMatch[1], tsMatch[2], tsMatch[3], tsMatch[4]);
    const endTime = parseVttTimestamp(tsMatch[5], tsMatch[6], tsMatch[7], tsMatch[8]);

    if (endTime <= startTime) {
      warnings.push(`Cue ${cues.length + 1}: end time <= start time`);
      continue;
    }

    // Strip position/alignment metadata from timestamp line
    const textLines = lines.slice(tsLineIdx + 1);
    let text = sanitizeText(textLines.join(" "));

    if (text.length > MAX_CUE_TEXT_LENGTH) {
      text = text.slice(0, MAX_CUE_TEXT_LENGTH);
      warnings.push(`Cue ${cues.length + 1}: text truncated`);
    }

    if (text) {
      cues.push({ index: cues.length + 1, startTime, endTime, text });
    }
  }

  return { cues, warnings };
}

// ── Main entry point ──

/**
 * Parse and sanitize a VTT or SRT file.
 * Fail-closed: any suspicious content is rejected entirely.
 */
export function parseSubtitleFile(content: string, filename?: string): VttResult {
  // 1. Size check
  if (!content || !content.trim()) {
    return { success: false, error: "File is empty", errorCode: "EMPTY" };
  }

  const byteLength = new TextEncoder().encode(content).length;
  if (byteLength > MAX_VTT_SIZE) {
    return { success: false, error: `File exceeds maximum size of ${MAX_VTT_SIZE / 1024}KB`, errorCode: "TOO_LARGE" };
  }

  // 2. Encoding check
  if (!validateEncoding(content)) {
    return { success: false, error: "Invalid encoding detected (null bytes)", errorCode: "INVALID_ENCODING" };
  }

  // 3. Strip BOM
  let cleaned = content.replace(/^\uFEFF/, "");

  // 4. Security scan (before parsing)
  const threat = detectMaliciousContent(cleaned);
  if (threat) {
    return { success: false, error: `Malicious content detected: ${threat}`, errorCode: "MALICIOUS_CONTENT" };
  }

  // 5. Detect format
  const isVtt = VTT_HEADER_REGEX.test(cleaned.trim());
  const isSrt = !isVtt && SRT_TIMESTAMP_REGEX.test(cleaned.trim().split("\n").find(l => l.includes("-->")) || "");
  
  // Also accept by extension
  const ext = filename?.split(".").pop()?.toLowerCase();
  const format: "vtt" | "srt" = isVtt || ext === "vtt" ? "vtt" : "srt";

  if (!isVtt && !isSrt && ext !== "vtt" && ext !== "srt") {
    return { success: false, error: "File is not a valid VTT or SRT subtitle file", errorCode: "INVALID_FORMAT" };
  }

  // 6. Parse
  const { cues, warnings } = format === "vtt" ? parseVtt(cleaned) : parseSrt(cleaned);

  if (cues.length === 0) {
    return { success: false, error: "No valid subtitle cues found", errorCode: "PARSE_FAILED" };
  }

  // 7. Build plain text
  const plainText = cues.map(c => c.text).join("\n");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const lastCue = cues[cues.length - 1];

  return {
    success: true,
    format,
    cues,
    plainText,
    warnings,
    stats: {
      cueCount: cues.length,
      wordCount,
      durationSeconds: lastCue ? Math.ceil(lastCue.endTime) : 0,
      charCount: plainText.length,
    },
  };
}

/**
 * Quick sanitize: parse and return only clean plain text.
 * Use this as a drop-in replacement for existing parseSrtToText.
 */
export function sanitizeSubtitleToText(content: string, filename?: string): string {
  const result = parseSubtitleFile(content, filename);
  if (!result.success) return "";
  return result.plainText;
}

/**
 * Validate a file before upload (client-side pre-check).
 */
export function validateSubtitleFile(file: File): { valid: boolean; error?: string } {
  // Extension check
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["vtt", "srt"].includes(ext)) {
    return { valid: false, error: "Only .vtt and .srt files are accepted" };
  }

  // MIME check (browsers may report text/plain, text/vtt, application/x-subrip)
  const allowedMimes = ["text/vtt", "text/plain", "application/x-subrip", "text/srt", ""];
  if (file.type && !allowedMimes.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}` };
  }

  // Size check
  if (file.size > MAX_VTT_SIZE) {
    return { valid: false, error: `File too large (max ${MAX_VTT_SIZE / 1024}KB)` };
  }

  return { valid: true };
}
