import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { loadPrompt } from "../_shared/prompt-loader.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

// ══════════════════════════════════════════════════
// CHUNKING — Character-based with overlap
// ══════════════════════════════════════════════════

const CHUNK_MIN = 1200;  // chars
const CHUNK_MAX = 1800;  // chars
const CHUNK_OVERLAP = 175; // chars (150-200 range)

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
      // Overlap: keep tail of previous chunk
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

// ══════════════════════════════════════════════════
// TARGET DISTRIBUTION — 50 units per transcript
// ══════════════════════════════════════════════════

const TARGET_DISTRIBUTION: Record<string, number> = {
  insight: 10,
  concept: 10,
  principle: 6,
  framework: 5,
  pattern: 5,
  application: 5,
  quote: 4,
  statistic: 2,
  question: 3,
};
const TOTAL_TARGET = Object.values(TARGET_DISTRIBUTION).reduce((a, b) => a + b, 0); // 50

// ══════════════════════════════════════════════════
// PASS 1 — Raw extraction per chunk
// ══════════════════════════════════════════════════

const PASS1_PROMPT = `You are a knowledge extraction engine for a Knowledge Operating System.

From this transcript chunk extract knowledge units.

Identify:
- Concepts
- Insights
- Principles
- Frameworks
- Patterns
- Applications
- Quotes (verbatim impactful statements)
- Statistics (numbers, data points, metrics)
- Questions (important questions raised)

For each unit return a JSON object with:
- "title": concise title (max 12 words)
- "type": one of: insight, concept, principle, framework, pattern, application, quote, statistic, question
- "content": 2-4 sentence explanation of the unit
- "confidence": 0.0-1.0 (how certain this is a genuine knowledge unit)
- "tags": array of 2-5 relevant keywords

Extract 3-8 units per chunk, proportional to content density.
Return ONLY a valid JSON array, no markdown wrapping.`;

async function extractPass1(
  apiKey: string,
  chunkText: string,
  episodeTitle: string,
  chunkIndex: number,
  totalChunks: number
): Promise<any[]> {
  const { prompt: systemPrompt } = await loadPrompt("extract_neurons_pass1", PASS1_PROMPT);

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
        { role: "user", content: `Episode: "${episodeTitle}"\n\nChunk ${chunkIndex + 1}/${totalChunks} (${chunkText.length} chars):\n${chunkText}` },
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
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Tag each unit with source chunk
      return parsed.map((unit: any) => ({ ...unit, _chunk: chunkIndex }));
    }
  } catch (e) {
    console.error(`Parse error on chunk ${chunkIndex}:`, e);
  }
  return [];
}

// ══════════════════════════════════════════════════
// FILTERING — Dedup, merge, rank
// ══════════════════════════════════════════════════

function normalizeTitle(title: string): string {
  return (title || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a.map(s => s.toLowerCase()));
  const sb = new Set(b.map(s => s.toLowerCase()));
  const intersection = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : intersection / union;
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = normalizeTitle(a).split(" ");
  const wordsB = normalizeTitle(b).split(" ");
  return jaccard(wordsA, wordsB);
}

function deduplicateAndMerge(units: any[]): any[] {
  const SIMILARITY_THRESHOLD = 0.6;
  const merged: any[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < units.length; i++) {
    if (consumed.has(i)) continue;
    let best = units[i];

    for (let j = i + 1; j < units.length; j++) {
      if (consumed.has(j)) continue;
      const sim = titleSimilarity(best.title, units[j].title);
      const tagSim = jaccard(best.tags || [], units[j].tags || []);

      if (sim > SIMILARITY_THRESHOLD || tagSim > 0.5) {
        // Merge: keep higher confidence, combine content
        consumed.add(j);
        if ((units[j].confidence || 0) > (best.confidence || 0)) {
          best = {
            ...units[j],
            content: best.content + " " + units[j].content,
            tags: [...new Set([...(best.tags || []), ...(units[j].tags || [])])],
            confidence: Math.max(best.confidence || 0, units[j].confidence || 0),
          };
        } else {
          best = {
            ...best,
            content: best.content + " " + units[j].content,
            tags: [...new Set([...(best.tags || []), ...(units[j].tags || [])])],
          };
        }
      }
    }
    merged.push(best);
  }
  return merged;
}

function computeImportanceScore(unit: any, allUnits: any[]): number {
  // semantic_uniqueness: lower title similarity to other units = more unique
  let maxSim = 0;
  for (const other of allUnits) {
    if (other === unit) continue;
    const sim = titleSimilarity(unit.title, other.title);
    if (sim > maxSim) maxSim = sim;
  }
  const semanticUniqueness = 1 - maxSim;

  // conceptual_density: longer content with more tags = denser
  const contentLength = (unit.content || "").length;
  const tagCount = (unit.tags || []).length;
  const conceptualDensity = Math.min(1, (contentLength / 500) * 0.6 + (tagCount / 5) * 0.4);

  // citation_potential: quotes and statistics have high citation, frameworks medium
  const citationMap: Record<string, number> = {
    quote: 0.9, statistic: 0.95, framework: 0.7, principle: 0.65,
    insight: 0.6, concept: 0.5, pattern: 0.55, application: 0.4, question: 0.35,
  };
  const citationPotential = citationMap[unit.type] || 0.5;

  return (semanticUniqueness + conceptualDensity + citationPotential) / 3;
}

function enforceDistribution(units: any[]): any[] {
  // Score all units
  const scored = units.map(u => ({
    ...u,
    importance_score: computeImportanceScore(u, units),
  }));

  // Sort by importance within each type, then fill quotas
  const byType: Record<string, any[]> = {};
  for (const u of scored) {
    const type = u.type || "insight";
    if (!byType[type]) byType[type] = [];
    byType[type].push(u);
  }

  // Sort each type by importance descending
  for (const type of Object.keys(byType)) {
    byType[type].sort((a: any, b: any) => b.importance_score - a.importance_score);
  }

  const result: any[] = [];

  // First pass: fill up to target for each type
  for (const [type, target] of Object.entries(TARGET_DISTRIBUTION)) {
    const available = byType[type] || [];
    const take = Math.min(available.length, target);
    for (let i = 0; i < take; i++) {
      result.push(available[i]);
      available[i]._used = true;
    }
  }

  // Second pass: if under TOTAL_TARGET, fill from remaining highest-scored
  if (result.length < TOTAL_TARGET) {
    const remaining = scored
      .filter(u => !u._used)
      .sort((a, b) => b.importance_score - a.importance_score);
    const deficit = TOTAL_TARGET - result.length;
    for (let i = 0; i < Math.min(deficit, remaining.length); i++) {
      result.push(remaining[i]);
    }
  }

  return result.slice(0, TOTAL_TARGET);
}

// ══════════════════════════════════════════════════
// PASS 2 — Synthesis & framework grouping
// ══════════════════════════════════════════════════

const PASS2_PROMPT = `You are a knowledge synthesis engine. Analyze these extracted neurons.

Identify:
- major insights (the most important discoveries)
- unexpected ideas (contrarian or surprising findings)
- emerging themes (patterns across multiple neurons)
- contradictions (tensions or conflicting viewpoints)

Group related neurons into frameworks. For each framework return:
- "framework_name": name of the framework
- "steps": array of step descriptions
- "explanation": 2-3 sentence explanation
- "related_neurons": array of neuron titles that belong to this framework
- "relations": array of objects with {"source": "neuron title", "target": "neuron title", "type": "supports|contradicts|extends|example_of|related_to"}

Also return a "meta" object with:
- "major_insights": top 3 most important insight titles
- "unexpected_ideas": titles of surprising/contrarian findings
- "emerging_themes": array of theme names
- "contradictions": array of {a, b, description}

Return a JSON object with keys: "frameworks", "meta". No markdown wrapping.`;

async function extractPass2(
  apiKey: string,
  neurons: any[],
  episodeTitle: string
): Promise<{ frameworks: any[]; meta: any }> {
  const { prompt: systemPrompt } = await loadPrompt("extract_neurons_pass2", PASS2_PROMPT);

  const neuronSummary = neurons.map((n, i) =>
    `[${i + 1}] (${n.type}) "${n.title}" — ${(n.content || "").slice(0, 200)}`
  ).join("\n");

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
        { role: "user", content: `Episode: "${episodeTitle}"\n\n${neurons.length} extracted neurons:\n${neuronSummary}` },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    console.error(`Pass 2 AI error: ${response.status}`);
    return { frameworks: [], meta: {} };
  }

  const aiResult = await response.json();
  const raw = aiResult.choices?.[0]?.message?.content || "";

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Pass 2 parse error:", e);
  }
  return { frameworks: [], meta: {} };
}

// ══════════════════════════════════════════════════
// NEURON BLOCK BUILDER
// ══════════════════════════════════════════════════

function buildBlocks(unit: any): Array<{ type: string; content: string }> {
  const blocks: Array<{ type: string; content: string }> = [];
  blocks.push({ type: "heading", content: unit.title || "Untitled" });

  if (unit.type === "quote") {
    blocks.push({ type: "quote", content: unit.content || "" });
  } else if (unit.type === "statistic") {
    blocks.push({ type: "text", content: unit.content || "" });
    blocks.push({ type: "reference", content: `Confidence: ${unit.confidence || 0}` });
  } else {
    blocks.push({ type: "text", content: unit.content || "" });
    if (unit.type === "framework" || unit.type === "pattern") {
      blocks.push({ type: "idea", content: `Type: ${unit.type} — reusable knowledge structure` });
    }
  }

  if (unit.tags && unit.tags.length > 0) {
    blocks.push({ type: "reference", content: `Tags: ${unit.tags.join(", ")}` });
  }

  if (unit.importance_score !== undefined) {
    blocks.push({ type: "reference", content: `Importance: ${(unit.importance_score * 100).toFixed(0)}/100` });
  }

  return blocks;
}

// Map unit types to neuron content_category
const TYPE_TO_CATEGORY: Record<string, string> = {
  insight: "insight",
  concept: "insight",
  principle: "insight",
  framework: "framework",
  pattern: "pattern",
  application: "commercial",
  quote: "narrative",
  statistic: "insight",
  question: "insight",
};

// ══════════════════════════════════════════════════
// RATE LIMITING
// ══════════════════════════════════════════════════

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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

// ══════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════

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
      return new Response(JSON.stringify({ error: "Rate limit exceeded (10 extractions/hour)" }), {
        status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { episode_id } = parsed.data;

    // ── Fetch episode ──
    const { data: episode, error: epErr } = await supabase
      .from("episodes").select("*").eq("id", episode_id).eq("author_id", userId).single();

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

    // ── Regime check ──
    const regime = await getRegimeConfig("extract-neurons");
    const EXTRACTION_COST = 100;
    const blockReason = checkRegimeBlock(regime, EXTRACTION_COST);
    if (blockReason) {
      return new Response(JSON.stringify({ error: blockReason }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── RESERVE neurons (atomic wallet) ──
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: userId,
      _amount: EXTRACTION_COST,
      _description: `RESERVE: Extraction — ${episode.title}`,
    });

    if (reserveErr || !reserved) {
      return new Response(JSON.stringify({
        error: "Insufficient credits for extraction",
        reason_code: "RC.CREDITS.INSUFFICIENT",
        needed: EXTRACTION_COST,
      }), { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    let settled = false;

    await supabase.from("episodes").update({ status: "analyzing" }).eq("id", episode_id);

    // ═══════════════════════════════════════
    // PASS 1 — Chunk + Extract raw units
    // ═══════════════════════════════════════
    const chunks = chunkWithOverlap(transcript);
    console.log(`Chunked transcript: ${chunks.length} segments (${CHUNK_MIN}-${CHUNK_MAX} chars, ${CHUNK_OVERLAP} overlap)`);

    const BATCH_SIZE = 3;
    const allRawUnits: any[] = [];

    for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
      const batch = chunks.slice(batchStart, batchStart + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((chunk, idx) =>
          extractPass1(LOVABLE_API_KEY, chunk, episode.title, batchStart + idx, chunks.length)
        )
      );
      for (const extracted of batchResults) {
        allRawUnits.push(...extracted);
      }
    }

    console.log(`Pass 1 complete: ${allRawUnits.length} raw units extracted`);

    if (allRawUnits.length === 0) {
      // RELEASE reserved neurons — no output
      await supabase.rpc("release_neurons", {
        _user_id: userId, _amount: EXTRACTION_COST,
        _description: `RELEASE: ${episode.title} — no neurons extracted`,
      }).catch(() => {});
      await supabase.from("episodes").update({ status: "transcribed" }).eq("id", episode_id);
      return new Response(JSON.stringify({ error: "No neurons extracted" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════
    // FILTERING — Dedup, merge, rank, enforce distribution
    // ═══════════════════════════════════════
    const deduplicated = deduplicateAndMerge(allRawUnits);
    console.log(`After dedup/merge: ${deduplicated.length} units (from ${allRawUnits.length} raw)`);

    const finalUnits = enforceDistribution(deduplicated);
    console.log(`After distribution enforcement: ${finalUnits.length} units (target: ${TOTAL_TARGET})`);

    // ═══════════════════════════════════════
    // PASS 2 — Synthesis & framework grouping
    // ═══════════════════════════════════════
    const { frameworks, meta } = await extractPass2(LOVABLE_API_KEY, finalUnits, episode.title);
    console.log(`Pass 2 complete: ${frameworks.length} frameworks, meta keys: ${Object.keys(meta).join(", ")}`);

    // ═══════════════════════════════════════
    // PERSIST — Create neurons and blocks
    // ═══════════════════════════════════════
    const createdNeurons: any[] = [];

    for (const unit of finalUnits) {
      const { data: newNeuron, error: nErr } = await supabase
        .from("neurons")
        .insert({
          author_id: userId,
          title: (unit.title || "Extracted Neuron").slice(0, 200),
          status: "draft",
          lifecycle: "structured",
          content_category: TYPE_TO_CATEGORY[unit.type] || "insight",
          episode_id,
          credits_cost: Math.round(EXTRACTION_COST / finalUnits.length),
        })
        .select("id, number")
        .single();

      if (nErr || !newNeuron) { console.error("Neuron creation error:", nErr); continue; }

      const blocks = buildBlocks(unit);
      for (let i = 0; i < blocks.length; i++) {
        await supabase.from("neuron_blocks").insert({
          neuron_id: newNeuron.id,
          type: blocks[i].type,
          content: blocks[i].content.slice(0, 50_000),
          position: i,
          execution_mode: "passive",
        });
      }

      createdNeurons.push({
        id: newNeuron.id,
        number: newNeuron.number,
        title: unit.title,
        type: unit.type,
        importance_score: unit.importance_score,
      });
    }

    // ═══════════════════════════════════════
    // PERSIST — Store neuron_links from Pass 2 frameworks
    // ═══════════════════════════════════════
    const neuronByTitle = new Map(createdNeurons.map(n => [normalizeTitle(n.title), n.id]));
    const linkInserts: Array<{ source_neuron_id: number; target_neuron_id: number; relation_type: string }> = [];

    for (const fw of frameworks) {
      if (!Array.isArray(fw.relations)) continue;
      for (const rel of fw.relations) {
        const sourceId = neuronByTitle.get(normalizeTitle(rel.source));
        const targetId = neuronByTitle.get(normalizeTitle(rel.target));
        if (sourceId && targetId && sourceId !== targetId) {
          const relType = (rel.type || "related_to").toLowerCase().replace(/\s+/g, "_");
          linkInserts.push({
            source_neuron_id: sourceId,
            target_neuron_id: targetId,
            relation_type: relType,
          });
        }
      }
    }

    let relationsCreated = 0;
    if (linkInserts.length > 0) {
      const { data: inserted, error: linkErr } = await supabase
        .from("neuron_links")
        .upsert(linkInserts, { onConflict: "source_neuron_id,target_neuron_id,relation_type" })
        .select("id");
      if (linkErr) console.error("neuron_links insert error:", linkErr);
      else relationsCreated = (inserted || []).length;
      console.log(`Stored ${relationsCreated} neuron relations from ${frameworks.length} frameworks`);
    }

    // ── Finalize ──
    const typeCounts: Record<string, number> = {};
    for (const n of createdNeurons) {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    }

    await supabase.from("episodes").update({
      status: "analyzed",
      metadata: {
        ...(typeof episode.metadata === "object" && episode.metadata ? episode.metadata : {}),
        chunks_count: chunks.length,
        chunk_params: { min_chars: CHUNK_MIN, max_chars: CHUNK_MAX, overlap_chars: CHUNK_OVERLAP },
        raw_units_extracted: allRawUnits.length,
        after_dedup: deduplicated.length,
        neurons_extracted: createdNeurons.length,
        type_distribution: typeCounts,
        frameworks_detected: frameworks.length,
        pass2_meta: meta,
        analyzed_at: new Date().toISOString(),
      },
    } as any).eq("id", episode_id);

    // SETTLE neurons on success
    await supabase.rpc("settle_neurons", { _user_id: userId, _amount: EXTRACTION_COST, _description: `SETTLE: Extraction — ${createdNeurons.length} neurons` });
    settled = true;

    return new Response(JSON.stringify({
      success: true,
      neurons_created: createdNeurons.length,
      chunks_processed: chunks.length,
      raw_extracted: allRawUnits.length,
      after_dedup: deduplicated.length,
      type_distribution: typeCounts,
      frameworks: frameworks.length,
      relations_created: relationsCreated,
      meta,
      neurons: createdNeurons,
      credits_spent: EXTRACTION_COST,
      episode_status: "analyzed",
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

  } catch (e) {
    console.error("extract-neurons error:", e);
    // RELEASE neurons on unhandled failure
    if (typeof settled !== "undefined" && !settled && userId) {
      await supabase.rpc("release_neurons", { _user_id: userId, _amount: EXTRACTION_COST, _description: `RELEASE: Extraction — error` }).catch(() => {});
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
