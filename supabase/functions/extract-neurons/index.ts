import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Chunking utilities (shared with chunk-transcript) ──

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
  const systemPrompt = `You are a neuron extraction engine for a Knowledge Operating System.

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

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { episode_id, user_id } = await req.json();

    if (!episode_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing episode_id or user_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch episode ──
    const { data: episode, error: epErr } = await supabase
      .from("episodes").select("*").eq("id", episode_id).eq("author_id", user_id).single();

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

    // ── Check credits (100 per extraction) ──
    const EXTRACTION_COST = 100;
    const { data: credits } = await supabase
      .from("user_credits").select("balance, total_spent").eq("user_id", user_id).single();

    if (!credits || credits.balance < EXTRACTION_COST) {
      return new Response(JSON.stringify({
        error: "Insufficient credits for extraction",
        reason_code: "RC.CREDITS.INSUFFICIENT",
        needed: EXTRACTION_COST,
        have: credits?.balance ?? 0,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Reserve credits
    await supabase.from("user_credits").update({
      balance: credits.balance - EXTRACTION_COST,
      total_spent: credits.total_spent + EXTRACTION_COST,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user_id);

    // ── Update episode status ──
    await supabase.from("episodes").update({ status: "analyzing" }).eq("id", episode_id);

    // ── Chunk the transcript ──
    const chunks = greedyChunk(transcript, 200, 800);
    console.log(`Transcript chunked into ${chunks.length} segments`);

    // ── Process each chunk (sequentially to respect rate limits) ──
    const allNeurons: any[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const extracted = await extractNeuronsFromChunk(
        LOVABLE_API_KEY, chunks[i], episode.title, i, chunks.length
      );
      allNeurons.push(...extracted);
    }

    if (allNeurons.length === 0) {
      // Release credits
      await supabase.from("user_credits").update({
        balance: credits.balance, total_spent: credits.total_spent,
      }).eq("user_id", user_id);
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
          author_id: user_id,
          title: neuronData.title || "Extracted Neuron",
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
          content: blocks[i].content || "",
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

    await supabase.from("credit_transactions").insert({
      user_id,
      amount: -EXTRACTION_COST,
      type: "spend",
      description: `EXTRACTION: ${episode.title} → ${createdNeurons.length} neurons (${chunks.length} chunks)`,
    });

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
