/**
 * Frontend runtime validation schemas (Zod).
 * Used for user-facing forms: payments, uploads, profile, pipeline input.
 */
import { z } from "zod";

// ── Profile ──
export const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(100),
  bio: z.string().trim().max(500).optional(),
  preferred_language: z.enum(["en", "ro", "ru"]).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// ── Pipeline input ──
export const pipelineInputSchema = z.object({
  input: z.string().trim().min(1, "Content is required").max(50000),
  extractionDepth: z.enum(["quick", "deep"]).default("deep"),
});

// ── URL validation ──
export const urlInputSchema = z.string().trim().url("Invalid URL").refine(
  (u) => {
    try {
      const parsed = new URL(u);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch { return false; }
  },
  { message: "Only HTTP(S) URLs are allowed" }
);

// ── File upload ──
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_EXTENSIONS = ["mp3", "mp4", "m4a", "wav", "ogg", "webm", "txt", "srt", "vtt", "md", "pdf"];

export const fileUploadSchema = z.object({
  name: z.string().min(1),
  size: z.number().max(MAX_FILE_SIZE, "File too large (max 500MB)"),
  type: z.string(),
}).refine(
  (f) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    return ALLOWED_EXTENSIONS.includes(ext);
  },
  { message: `Allowed formats: ${ALLOWED_EXTENSIONS.join(", ")}` }
);

// ── Contact / Feedback ──
export const feedbackSchema = z.object({
  email: z.string().email("Invalid email"),
  message: z.string().trim().min(10, "Too short").max(2000),
  category: z.enum(["bug", "feature", "question", "other"]).default("other"),
});

// ── Helper: validate and return typed result ──
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((i) => i.message),
    };
  }
  return { success: true, data: result.data };
}
