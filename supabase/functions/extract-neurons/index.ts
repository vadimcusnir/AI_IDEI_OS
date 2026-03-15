import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";
import { loadPrompt } from "../_shared/prompt-loader.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

// ── Chunking utilities ──

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(s => s.length > 0);
}

function greedyChunk(text: string, minTokens = 200, maxTokens = 800): string[] {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0);
  const chunks: string[] = [];
  let buffer = "";
  let bufferTokens = 0;

  for (const para of paragraphs) {
    for (const sentence of splitSentences(para)) {
      const sentTokens = estimateTokens(sentence);
      if (bufferTokens + sentTokens > maxTokens && bufferTokens >= minTokens) {
        chunks.push(buffer.trim());
        buffer = "";
        bufferTokens = 0;
      }
      if (sentTokens > maxTokens && buffer.trim()) {
        if (bufferTokens > 0) { chunks.push(buffer.trim()); buffer = ""; bufferTokens = 0; }
        chunks.push(sentence);
        continue;
      }
      buffer += (buffer ? " " : "") + sentence;
      bufferTokens += sentTokens;
    }
    if (bufferTokens >= minTokens) {
      chunks.push(buffer.trim());
      buffer = "";
      bufferTokens = 0;
    }
  }
  if (buffer.trim()) {
    if (chunks.length > 0 && bufferTokens < minTokens) {
      chunks[chunks.length - 1] += " " + buffer.trim();
    } else {
      chunks.push(buffer.trim());
    }
  }
  return chunks;
}

// ── AI extraction for a single chunk ──

async function extractNeuronsFromChunk(
  apiKey: string,
  chunkText: string,
  episodeTitle: string,
  chunkIndex: number,
  totalChunks: number
): Promise<any[]> {
  const fallbackPrompt = `You are a neuron extraction engine for a Knowledge Operating System.

Analyze this transcript segment (chunk ${chunkIndex + 1}/${totalChunks}) and extract distinct knowledge units ("neurons").

For each neuron, return a JSON object in a JSON array. Each neuron must have:
- "title": concise title (max 12 words)
- "content_category": one of: transcript, insight, framework, strategy, formula, pattern, avatar, argument_map, narrative, psychological, commercial
- "blocks": array of block objects, each with:
  - "type": one of: text, heading, subheading, quote, idea, reference, list, markdown
  - "content": the block content

Rules:
- Extract 1-5 neurons per segment (proportional to content density)
- Each neuron must be a self-contained knowledge unit
- Classify accurately using the content_category enum
- Use heading blocks for titles, text blocks for explanations, quote blocks for direct quotes, idea blocks for insights
- Return ONLY a valid JSON array, no markdown wrapping`;

  const { prompt: systemPrompt } = await loadPrompt("extract_neurons", fallbackPrompt);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Episode: "${episodeTitle}"\n\nSegment ${chunkIndex + 1}/${totalChunks}:\n${chunkText}` },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    console.error(`AI error on chunk ${chunkIndex}: ${response.status}`);
    return [];
  }

  const aiResult = await response.json();
  const rawContent = aiResult.choices?.[0]?.message?.content || "";

  try {
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error(`Parse error on chunk ${chunkIndex}:`, e);
  }
  return [];
}

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // per hour
const RATE_WINDOW = 3600_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── Authenticate via JWT ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = caller.id;

    // ── Rate limit check ──
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (10 extractions/hour)" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const InputSchema = z.object({
      episode_id: z.string().uuid("Invalid episode_id format"),
    });

    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { episode_id } = parsed.data;

    // ── Fetch episode ──
    const { data: episode, error: epErr } = await supabase
      .from("episodes").select("*").eq("id", episode_id).eq("author_id", userId).single();

    if (!episode || epErr) {
      return new Response(JSON.stringify({ error: "Episode not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = episode.transcript || "";
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "Episode has no transcript content" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Check & spend credits atomically via SECURITY DEFINER function ──
    const EXTRACTION_COST = 100;
    const { data: spent } = await supabase.rpc("spend_credits", {
      _user_id: userId,
      _amount: EXTRACTION_COST,
      _description: `EXTRACTION: ${episode.title}`,
    });

    if (!spent) {
      return new Response(JSON.stringify({
        error: "Insufficient credits for extraction",
        reason_code: "RC.CREDITS.INSUFFICIENT",
        needed: EXTRACTION_COST,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Update episode status ──
    await supabase.from("episodes").update({ status: "analyzing" }).eq("id", episode_id);

    // ── Chunk the transcript ──
    const chunks = greedyChunk(transcript, 200, 800);
    console.log(`Transcript chunked into ${chunks.length} segments`);

    // ── Process chunks in parallel batches of 3 ──
    const BATCH_SIZE = 3;
    const allNeurons: any[] = [];
    for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
      const batch = chunks.slice(batchStart, batchStart + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((chunk, idx) =>
          extractNeuronsFromChunk(
            LOVABLE_API_KEY, chunk, episode.title, batchStart + idx, chunks.length
          )
        )
      );
      for (const extracted of batchResults) {
        allNeurons.push(...extracted);
      }
    }

    if (allNeurons.length === 0) {
      // Refund credits atomically
      await supabase.rpc("add_credits", {
        _user_id: userId,
        _amount: EXTRACTION_COST,
        _description: `REFUND: ${episode.title} — no neurons extracted`,
        _type: "refund",
      });
      await supabase.from("episodes").update({ status: "transcribed" }).eq("id", episode_id);
      return new Response(JSON.stringify({ error: "No neurons extracted" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Create neurons and blocks ──
    const createdNeurons: any[] = [];
    for (const neuronData of allNeurons) {
      const { data: newNeuron, error: nErr } = await supabase
        .from("neurons")
        .insert({
          author_id: userId,
          title: (neuronData.title || "Extracted Neuron").slice(0, 200),
          status: "draft",
          lifecycle: "structured",
          content_category: neuronData.content_category || null,
          episode_id,
          credits_cost: Math.round(EXTRACTION_COST / allNeurons.length),
        })
        .select("id, number")
        .single();

      if (nErr || !newNeuron) { console.error("Neuron creation error:", nErr); continue; }

      const blocks = Array.isArray(neuronData.blocks) ? neuronData.blocks : [];
      for (let i = 0; i < blocks.length; i++) {
        await supabase.from("neuron_blocks").insert({
          neuron_id: newNeuron.id,
          type: blocks[i].type || "text",
          content: (blocks[i].content || "").slice(0, 50_000),
          position: i,
          execution_mode: "passive",
        });
      }

      createdNeurons.push({ id: newNeuron.id, number: newNeuron.number, title: neuronData.title });
    }

    // ── Finalize ──
    await supabase.from("episodes").update({
      status: "analyzed",
      metadata: {
        ...(typeof episode.metadata === "object" && episode.metadata ? episode.metadata : {}),
        chunks_count: chunks.length,
        neurons_extracted: createdNeurons.length,
        analyzed_at: new Date().toISOString(),
      },
    } as any).eq("id", episode_id);

    return new Response(JSON.stringify({
      success: true,
      neurons_created: createdNeurons.length,
      chunks_processed: chunks.length,
      neurons: createdNeurons,
      credits_spent: EXTRACTION_COST,
      episode_status: "analyzed",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("extract-neurons error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
