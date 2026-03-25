import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

// ══════════════════════════════════════════════════
// Character-based chunking with overlap
// ══════════════════════════════════════════════════

const DEFAULT_MIN_CHARS = 1200;
const DEFAULT_MAX_CHARS = 1800;
const DEFAULT_OVERLAP = 175;

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter((s) => s.length > 0);
}

function chunkWithOverlap(
  text: string,
  minChars = DEFAULT_MIN_CHARS,
  maxChars = DEFAULT_MAX_CHARS,
  overlapChars = DEFAULT_OVERLAP
): string[] {
  const sentences = splitSentences(text);
  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if (buffer.length + sentence.length + 1 > maxChars && buffer.length >= minChars) {
      chunks.push(buffer.trim());
      // Overlap: keep tail of previous chunk
      const overlapStart = Math.max(0, buffer.length - overlapChars);
      buffer = buffer.slice(overlapStart) + " " + sentence;
    } else if (sentence.length > maxChars && buffer.trim()) {
      if (buffer.length > 0) { chunks.push(buffer.trim()); }
      chunks.push(sentence);
      buffer = sentence.slice(Math.max(0, sentence.length - overlapChars));
      continue;
    } else {
      buffer += (buffer ? " " : "") + sentence;
    }
  }

  if (buffer.trim()) {
    if (chunks.length > 0 && buffer.length < minChars) {
      chunks[chunks.length - 1] += " " + buffer.trim();
    } else {
      chunks.push(buffer.trim());
    }
  }

  return chunks;
}

import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── Auth ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = caller.id;

    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (20 chunk operations/hour)" }), {
        status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Regime enforcement ──
    const regime = await getRegimeConfig("chunk-transcript");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: "Service blocked", reason: blockReason, regime: regime.regime }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const InputSchema = z.object({
      episode_id: z.string().uuid("Invalid episode_id format"),
      min_chars: z.number().int().min(200).max(5000).optional().default(DEFAULT_MIN_CHARS),
      max_chars: z.number().int().min(400).max(10000).optional().default(DEFAULT_MAX_CHARS),
      overlap_chars: z.number().int().min(0).max(500).optional().default(DEFAULT_OVERLAP),
    });

    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { episode_id, min_chars, max_chars, overlap_chars } = parsed.data;

    const minC = min_chars;
    const maxC = Math.max(minC + 200, max_chars);

    // Fetch episode
    const { data: episode, error: epErr } = await supabase
      .from("episodes")
      .select("id, title, transcript, status, metadata")
      .eq("id", episode_id)
      .eq("author_id", userId)
      .single();

    if (!episode || epErr) {
      return new Response(JSON.stringify({ error: "Episode not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const transcript = episode.transcript || "";
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "Episode has no transcript content" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const chunks = chunkWithOverlap(transcript, minC, maxC, overlap_chars);

    const result = chunks.map((content, index) => ({
      index,
      content,
      char_count: content.length,
      token_estimate: Math.ceil(content.length / 4),
    }));

    // For a 1h podcast (~80k chars), expect 80-120 chunks at 1200-1800 chars
    if (episode.status === "transcribed" || episode.status === "uploaded") {
      await supabase
        .from("episodes")
        .update({
          status: "chunked",
          metadata: {
            ...(typeof episode.metadata === "object" && episode.metadata ? episode.metadata : {}),
            chunks_count: result.length,
            chunk_params: { min_chars: minC, max_chars: maxC, overlap_chars },
            chunked_at: new Date().toISOString(),
          },
        } as any)
        .eq("id", episode_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        episode_id,
        total_chunks: result.length,
        total_chars: result.reduce((s, c) => s + c.char_count, 0),
        total_tokens: result.reduce((s, c) => s + c.token_estimate, 0),
        params: { min_chars: minC, max_chars: maxC, overlap_chars },
        chunks: result,
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chunk-transcript error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
