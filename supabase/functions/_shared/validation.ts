/**
 * Shared input validation schemas and helpers for edge functions.
 * Centralizes Zod schemas to enforce strict typing on user inputs.
 */
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ── Common schemas ──

export const uuidSchema = z.string().uuid();
export const safeStringSchema = z.string().trim().min(1).max(10000);
export const shortStringSchema = z.string().trim().min(1).max(500);
export const optionalJsonSchema = z.record(z.unknown()).optional();

// ── execute-os-agent ──

export const executeAgentSchema = z.object({
  agent_id: uuidSchema,
  user_id: uuidSchema,
  input: z.object({
    prompt: z.string().trim().max(10000).optional(),
    content: z.string().trim().max(10000).optional(),
  }).passthrough().optional(),
  execution_id: uuidSchema.optional(),
});

// ── execute-service ──

export const executeServiceSchema = z.object({
  serviceName: shortStringSchema,
  serviceLevel: shortStringSchema.optional(),
  category: shortStringSchema.optional(),
  input: safeStringSchema,
});

// ── webhook-ingest ──

export const webhookIngestSchema = z.object({
  title: shortStringSchema.optional(),
  content: safeStringSchema,
  content_type: z.enum(["text", "url", "json", "markdown"]).optional().default("text"),
  url: z.string().url().optional(),
  metadata: optionalJsonSchema,
});

// ── Validation helper ──

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  corsHeaders: Record<string, string>,
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      ),
    };
  }
  return { success: true, data: result.data };
}
