/**
 * deep-extract — Multi-Level Extraction Engine (Phase 2)
 * Runs specialized extraction prompts across 10 levels (L2-L11)
 * on a transcript, creating scored neurons per level.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { loadPrompts } from "../_shared/prompt-loader.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Extraction Level Definitions ──
interface ExtractionLevel {
  key: string;
  label: string;
  category: string;
  systemPrompt: string;
  costMultiplier: number;
}

const EXTRACTION_LEVELS: ExtractionLevel[] = [
  {
    key: "L2_atomic",
    label: "Atomic Extraction",
    category: "insight",
    costMultiplier: 1,
    systemPrompt: `You are an atomic knowledge extraction engine. Extract distinct atomic units from this content:
- Statements of fact or opinion
- Definitions and principles
- Key questions raised
- Actionable takeaways

For each unit, return a JSON object with:
- "title": concise title (max 10 words)
- "content_category": "insight"
- "extraction_level": "L2_atomic"
- "blocks": [{"type":"heading","content":"title"}, {"type":"text","content":"explanation"}, {"type":"idea","content":"core insight"}]
- "scores": {"novelty": 0-1, "information_density": 0-1, "utility": 0-1, "demand": 0-1}

Extract 3-8 units. Return ONLY a valid JSON array.`,
  },
  {
    key: "L3_entity",
    label: "Entity Extraction",
    category: "pattern",
    costMultiplier: 1,
    systemPrompt: `You are an entity extraction engine for a knowledge graph. Identify named entities:
- Persons (with roles, expertise)
- Companies/Organizations
- Concepts and Technical Terms
- Frameworks and Methodologies
- Products/Tools mentioned

For each entity, return a JSON object with:
- "title": entity name
- "content_category": "pattern"
- "extraction_level": "L3_entity"
- "entity_type": "person"|"company"|"concept"|"framework"|"tool"
- "blocks": [{"type":"heading","content":"name"}, {"type":"text","content":"description and context"}, {"type":"reference","content":"source context"}]
- "scores": {"novelty": 0-1, "information_density": 0-1, "utility": 0-1, "demand": 0-1}

Extract 3-10 entities. Return ONLY a valid JSON array.`,
  },
  {
    key: "L4_structural",
    label: "Structural Extraction",
    category: "framework",
    costMultiplier: 1.5,
    systemPrompt: `You are a structural pattern extraction engine. Identify:
- Mental models and frameworks
- Decision-making processes
- Step-by-step methodologies
- Classification systems
- Causal chains and feedback loops

For each structure, return a JSON object with:
- "title": framework/model name (max 10 words)
- "content_category": "framework"
- "extraction_level": "L4_structural"
- "blocks": [{"type":"heading","content":"name"}, {"type":"text","content":"core structure description"}, {"type":"list","content":"key components"}, {"type":"idea","content":"when to apply"}]
- "scores": {"novelty": 0-1, "information_density": 0-1, "utility": 0-1, "demand": 0-1}

Extract 2-5 structures. Return ONLY a valid JSON array.`,
  },
  {
    key: "L5_psychological",
    label: "Psychological Extraction",
    category: "psychological",
    costMultiplier: 1.5,
    systemPrompt: `You are a psychological analysis engine. Extract:
- Cognitive patterns and biases demonstrated
- Emotional drivers and motivations
- Communication style markers
- Decision-making heuristics
- Personality trait indicators (Big Five signals)

For each psychological insight, return a JSON object with:
- "title": pattern name (max 10 words)
- "content_category": "psychological"
- "extraction_level": "L5_psychological"
- "blocks": [{"type":"heading","content":"pattern name"}, {"type":"text","content":"behavioral evidence"}, {"type":"idea","content":"psychological significance"}, {"type":"quote","content":"illustrative quote if available"}]
- "scores": {"novelty": 0-1, "information_density": 0-1, "utility": 0-1, "demand": 0-1}

Extract 2-6 patterns. Return ONLY a valid JSON array.`,
  },
  {
    key: "L6_narrative",
    label: "Narrative Extraction",
    category: "narrative",
    costMultiplier: 1,
    systemPrompt: `You are a narrative structure extraction engine. Identify:
- Anchor stories and anecdotes
- Metaphors and analogies used
- Pivot phrases that shift arguments
- Rhetorical techniques (ethos, pathos, logos)
- Story arcs and narrative patterns

For each narrative element, return a JSON object with:
- "title": element name (max 10 words)
- "content_category": "narrative"
- "extraction_level": "L6_narrative"
- "blocks": [{"type":"heading","content":"name"}, {"type":"text","content":"narrative analysis"}, {"type":"quote","content":"key passage"}, {"type":"idea","content":"persuasion mechanism"}]
- "scores": {"novelty": 0-1, "information_density": 0-1, "utility": 0-1, "demand": 0-1}

Extract 2-5 elements. Return ONLY a valid JSON array.`,
  },
  {
    key: "L7_commercial",
    label: "Commercial Extraction",
    category: "commercial",
    costMultiplier: 1.5,
    systemPrompt: `You are a commercial intelligence extraction engine. Identify:
- Jobs-to-be-done (JTBD) patterns
- Purchase triggers and objection patterns
- Value propositions (explicit and implicit)
- Market opportunities and gaps
- Pricing signals and willingness-to-pay indicators

For each commercial insight, return a JSON object with:
- "title": insight name (max 10 words)
- "content_category": "commercial"
- "extraction_level": "L7_commercial"
- "blocks": [{"type":"heading","content":"name"}, {"type":"text","content":"commercial analysis"}, {"type":"idea","content":"monetization potential"}, {"type":"list","content":"action items"}]
- "scores": {"novelty": 0-1, "information_density": 0-1, "utility": 0-1, "demand": 0-1}

Extract 2-5 insights. Return ONLY a valid JSON array.`,
  },
  {
    key: "L8_pattern",
    label: "Pattern Detection",
    category: "pattern",
    costMultiplier: 1,
    systemPrompt: `You are a meta-pattern detection engine. Identify recurring patterns:
- Decision patterns (how choices are made/justified)
- Persuasion patterns (influence techniques)
- Influence patterns (authority, social proof, reciprocity)
- Argumentation patterns (logical structures used)
- Contradiction patterns (inconsistencies or tensions)

For each pattern, return a JSON object with:
- "title": pattern name (max 10 words)
- "content_category": "pattern"
- "extraction_level": "L8_pattern"
- "blocks": [{"type":"heading","content":"name"}, {"type":"text","content":"pattern description"}, {"type":"text","content":"evidence from content"}, {"type":"idea","content":"reuse potential"}]
- "scores": {"novelty": 0-1, "information_density": 0-1, "utility": 0-1, "demand": 0-1}

Extract 2-5 patterns. Return ONLY a valid JSON array.`,
  },
  {
    key: "L9_synthesis",
    label: "Insight Synthesis",
    category: "strategy",
    costMultiplier: 2,
    systemPrompt: `You are a strategic insight synthesis engine. Generate higher-order insights by combining ideas:
- Strategic insights (cross-domain applications)
- Psychological insights (deep behavioral understanding)
- Commercial insights (business model opportunities)
- Contrarian insights (ideas that challenge conventional wisdom)
- Compound insights (ideas that gain value when combined)

For each synthesis, return a JSON object with:
- "title": synthesis name (max 10 words)
- "content_category": "strategy"
- "extraction_level": "L9_synthesis"
- "blocks": [{"type":"heading","content":"name"}, {"type":"text","content":"synthesis explanation"}, {"type":"idea","content":"strategic implication"}, {"type":"text","content":"application domains"}]
- "scores": {"novelty": 0-1, "information_density": 0-1, "utility": 0-1, "demand": 0-1}

Extract 2-4 syntheses. Return ONLY a valid JSON array.`,
  },
];

// ── Character-based chunking (aligned with extract-neurons) ──
const CHUNK_MIN = 1200;
const CHUNK_MAX = 1800;
const CHUNK_OVERLAP = 175;

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(s => s.length > 0);
}

function chunkWithOverlap(text: string): string[] {
  const sentences = splitSentences(text);
  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if (buffer.length + sentence.length + 1 > CHUNK_MAX && buffer.length >= CHUNK_MIN) {
      chunks.push(buffer.trim());
      const overlapStart = Math.max(0, buffer.length - CHUNK_OVERLAP);
      buffer = buffer.slice(overlapStart) + " " + sentence;
    } else if (sentence.length > CHUNK_MAX && buffer.trim()) {
      if (buffer.length > 0) { chunks.push(buffer.trim()); }
      chunks.push(sentence);
      buffer = sentence.slice(Math.max(0, sentence.length - CHUNK_OVERLAP));
      continue;
    } else {
      buffer += (buffer ? " " : "") + sentence;
    }
  }
  if (buffer.trim()) {
    if (chunks.length > 0 && buffer.length < CHUNK_MIN) {
      chunks[chunks.length - 1] += " " + buffer.trim();
    } else {
      chunks.push(buffer.trim());
    }
  }
  return chunks;
}

// ── AI call ──
async function callAI(apiKey: string, systemPrompt: string, userContent: string): Promise<any[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    console.error(`AI error: ${response.status}`);
    return [];
  }

  const result = await response.json();
  const raw = result.choices?.[0]?.message?.content || "";
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("Parse error:", e);
  }
  return [];
}

// ── Scoring ──
function computeCompositeScore(scores: any): { composite: number; tier: string } {
  const n = Number(scores?.novelty) || 0;
  const d = Number(scores?.information_density) || 0;
  const u = Number(scores?.utility) || 0;
  const dem = Number(scores?.demand) || 0;
  const composite = Math.round((n * d * u * dem) * 100); // 0-100
  const tier = composite > 70 ? "premium" : composite >= 40 ? "standard" : "discard";
  return { composite, tier };
}

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Auth
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

    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (5 deep extractions/hour)" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const DeepExtractSchema = z.object({
      episode_id: z.string().uuid("Invalid episode_id format"),
      levels: z.array(z.string().max(30)).max(12).optional(),
    });
    const parsed = DeepExtractSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { episode_id, levels } = parsed.data;

    // Fetch episode
    const { data: episode, error: epErr } = await supabase
      .from("episodes").select("*").eq("id", episode_id).eq("author_id", userId).single();

    if (!episode || epErr) {
      return new Response(JSON.stringify({ error: "Episode not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = episode.transcript || "";
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "No transcript content" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter requested levels
    const requestedLevels = levels && Array.isArray(levels)
      ? EXTRACTION_LEVELS.filter(l => levels.includes(l.key))
      : EXTRACTION_LEVELS;

    // Calculate cost
    const baseCost = 50;
    const totalCost = Math.round(requestedLevels.reduce(
      (sum, l) => sum + baseCost * l.costMultiplier, 0
    ));

    // Spend credits
    const { data: spent } = await supabase.rpc("spend_credits", {
      _user_id: userId,
      _amount: totalCost,
      _description: `DEEP EXTRACT (${requestedLevels.length} levels): ${episode.title}`,
    });

    if (!spent) {
      return new Response(JSON.stringify({
        error: "Insufficient credits",
        needed: totalCost,
        reason_code: "RC.CREDITS.INSUFFICIENT",
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update status
    await supabase.from("episodes").update({ status: "analyzing" }).eq("id", episode_id);

    // Chunk transcript using character-based chunking
    const chunks = chunkWithOverlap(transcript);
    console.log(`Deep extract: ${chunks.length} chunks (${CHUNK_MIN}-${CHUNK_MAX} chars, ${CHUNK_OVERLAP} overlap)`);
    
    // Use representative sample: for long transcripts pick evenly-spaced chunks (max 5)
    const maxSampleChunks = 5;
    let sampleChunks: string[];
    if (chunks.length <= maxSampleChunks) {
      sampleChunks = chunks;
    } else {
      const step = (chunks.length - 1) / (maxSampleChunks - 1);
      sampleChunks = Array.from({ length: maxSampleChunks }, (_, i) => chunks[Math.round(i * step)]);
    }
    const sampleText = sampleChunks.join("\n\n---\n\n");

    // ── Regime check ──
    const regime = await getRegimeConfig("deep-extract");
    const blockReason = checkRegimeBlock(regime, totalCost);
    if (blockReason) {
      // Refund credits
      await supabase.rpc("add_credits", { _user_id: userId, _amount: totalCost, _description: `REFUND: Regime blocked — ${blockReason}`, _type: "refund" });
      return new Response(JSON.stringify({ error: blockReason }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load dynamic prompts from registry ──
    const promptFallbacks: Record<string, string> = {};
    for (const l of requestedLevels) {
      promptFallbacks[`deep_extract_${l.key}`] = l.systemPrompt;
    }
    const dynamicPrompts = await loadPrompts(
      requestedLevels.map(l => `deep_extract_${l.key}`),
      promptFallbacks
    );

    // Run each extraction level
    const results: Array<{
      level: string;
      neurons_created: number;
      avg_score: number;
    }> = [];
    let totalNeurons = 0;

    for (const level of requestedLevels) {
      console.log(`Running level: ${level.key}`);

      const promptEntry = dynamicPrompts[`deep_extract_${level.key}`];
      const systemPrompt = promptEntry?.prompt || level.systemPrompt;

      const extracted = await callAI(
        LOVABLE_API_KEY,
        systemPrompt,
        `Episode: "${episode.title}"\n\nContent (${sampleChunks.length} segments):\n${sampleText.slice(0, 30000)}`
      );

      let levelNeurons = 0;
      let scoreSum = 0;

      for (const item of extracted) {
        const { composite, tier } = computeCompositeScore(item.scores);

        // Skip low-quality extractions
        if (tier === "discard") continue;

        const { data: newNeuron, error: nErr } = await supabase
          .from("neurons")
          .insert({
            author_id: userId,
            title: (item.title || `${level.label} Extraction`).slice(0, 200),
            status: "draft",
            lifecycle: "structured",
            content_category: item.content_category || level.category,
            episode_id,
            credits_cost: Math.round(totalCost / (requestedLevels.length * 3)),
          })
          .select("id")
          .single();

        if (nErr || !newNeuron) { console.error("Neuron creation error:", nErr); continue; }

        // Create blocks
        const blocks = Array.isArray(item.blocks) ? item.blocks : [];
        for (let i = 0; i < blocks.length; i++) {
          await supabase.from("neuron_blocks").insert({
            neuron_id: newNeuron.id,
            type: blocks[i].type || "text",
            content: (blocks[i].content || "").slice(0, 50_000),
            position: i,
            execution_mode: "passive",
          });
        }

        // Store score
        await supabase.from("insight_scores").upsert({
          neuron_id: newNeuron.id,
          novelty: Number(item.scores?.novelty) || 0,
          information_density: Number(item.scores?.information_density) || 0,
          utility: Number(item.scores?.utility) || 0,
          demand: Number(item.scores?.demand) || 0,
          composite_score: composite,
          tier,
          extraction_level: level.key,
          model_version: "scoring-v1",
        }, { onConflict: "neuron_id" });

        levelNeurons++;
        scoreSum += composite;
        totalNeurons++;
      }

      results.push({
        level: level.key,
        neurons_created: levelNeurons,
        avg_score: levelNeurons > 0 ? Math.round(scoreSum / levelNeurons) : 0,
      });
    }

    // Refund if nothing extracted
    if (totalNeurons === 0) {
      await supabase.rpc("add_credits", {
        _user_id: userId,
        _amount: totalCost,
        _description: `REFUND: Deep extract ${episode.title} — no results`,
        _type: "refund",
      });
      await supabase.from("episodes").update({ status: "transcribed" }).eq("id", episode_id);
      return new Response(JSON.stringify({ error: "No neurons extracted" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Finalize
    await supabase.from("episodes").update({
      status: "analyzed",
      metadata: {
        ...(typeof episode.metadata === "object" && episode.metadata ? episode.metadata : {}),
        deep_extract: {
          levels_run: requestedLevels.map(l => l.key),
          total_neurons: totalNeurons,
          results,
          extracted_at: new Date().toISOString(),
        },
      },
    } as any).eq("id", episode_id);

    return new Response(JSON.stringify({
      success: true,
      total_neurons: totalNeurons,
      credits_spent: totalCost,
      levels_processed: results.length,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("deep-extract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
