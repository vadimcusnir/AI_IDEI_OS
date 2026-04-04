/**
 * chatFileService — Handles file validation, upload, and content extraction for Command Center.
 * Extracted from useCommandCenter (A2 refactor).
 */
import { supabase } from "@/integrations/supabase/client";

// ═══ Constants ═══
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_FILES = 10;
export const MAX_INPUT_LENGTH = 50_000;
const BLOCKED_EXTENSIONS = [".exe", ".bat", ".sh", ".dll", ".bin", ".cmd", ".com", ".msi", ".scr"];

const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".xml", ".html", ".yaml", ".yml", ".toml"];
const MEDIA_REGEX = /\.(mp3|mp4|wav|m4a|webm|ogg|flac|aac|mov|avi)$/i;

// ═══ Validation ═══

export interface FileValidationResult {
  valid: boolean;
  errorKey?: string;
  errorDefault?: string;
  errorParams?: Record<string, string | number>;
}

export function validateFiles(files: File[]): FileValidationResult {
  if (files.length > MAX_FILES) {
    return {
      valid: false,
      errorKey: "errors:too_many_files",
      errorDefault: `Maximum ${MAX_FILES} files allowed`,
    };
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        errorKey: "errors:file_too_large",
        errorDefault: `"${file.name}" exceeds 20MB limit`,
        errorParams: { name: file.name },
      };
    }
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        errorKey: "errors:file_type_blocked",
        errorDefault: `"${file.name}" — file type not supported`,
        errorParams: { name: file.name },
      };
    }
  }

  return { valid: true };
}

export function validateInput(input: string): FileValidationResult {
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      errorKey: "errors:input_too_long",
      errorDefault: `Message is too long (max ${MAX_INPUT_LENGTH.toLocaleString()} characters)`,
    };
  }
  return { valid: true };
}

// ═══ File Content Extraction ═══

function isTextFile(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return TEXT_EXTENSIONS.includes(ext);
}

function isMediaFile(file: File): boolean {
  if (file.type.startsWith("audio/") || file.type.startsWith("video/")) return true;
  return MEDIA_REGEX.test(file.name);
}

/**
 * Process files into a text string that can be appended to the prompt.
 * Text files are read inline; media files are uploaded to storage.
 */
export async function processFilesForPrompt(
  files: File[],
  userId: string,
): Promise<string> {
  if (files.length === 0) return "";

  const parts: string[] = [];

  for (const file of files) {
    if (isTextFile(file)) {
      const text = await file.text();
      parts.push(`\n--- ${file.name} ---\n${text}`);
    } else if (isMediaFile(file)) {
      const filePath = `chat-uploads/${userId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("user-uploads")
        .upload(filePath, file);

      if (uploadErr) {
        parts.push(`\n[Upload failed: ${file.name} — ${uploadErr.message}]`);
      } else {
        const { data: urlData } = supabase.storage
          .from("user-uploads")
          .getPublicUrl(filePath);
        parts.push(`\n[Uploaded: ${file.name} → ${urlData.publicUrl}]`);
      }
    } else {
      parts.push(
        `\n[File attached: ${file.name} (${file.type || "unknown"}, ${(file.size / 1024).toFixed(0)} KB)]`,
      );
    }
  }

  return parts.join("");
}
