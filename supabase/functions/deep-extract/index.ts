import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * deep-extract — Dynamic NEP-120 Extraction Engine
 * Loads extraction prompts from prompt_registry (NEP families)
 * and runs them against transcript content to create scored neurons.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

// ── NEP Family definitions ──
const NEP_FAMILIES = [
  { key: "decision", label: "Decision", icon: "⚖️" },
  { key: "strategy", label: "Strategy", icon: "♟️" },
  { key: "economic", label: "Economic", icon: "💰" },
  { key: "behavioral", label: "Behavioral", icon: "🧠" },
  { key: "narrative", label: "Narrative", icon: "📖" },
  { key: "technical", label: "Technical", icon: "⚙️" },
  { key: "creative", label: "Creative", icon: "🎨" },
  { key: "relational", label: "Relational", icon: "🤝" },
  { key: "systemic", label: "Systemic", icon: "🔄" },
  { key: "ethical", label: "Ethical", icon: "⚡" },
  { key: "temporal", label: "Temporal", icon: "⏳" },
  { key: "meta_cognitive", label: "Meta-Cognitive", icon: "🔍" },
];

// ── Character-based chunking ──
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
      if (buffer.length > 0) chunks.push(buffer.trim());
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
  const composite = Math.round((n * d * u * dem) * 100);
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

// ── Extractor interface ──
interface Extractor {
  id: string;
  family: string;
  purpose: string;
  core_prompt: string;
  cost_multiplier: number;
  level: string;
}

// ── Load extractors from DB ──
async function loadExtractors(
  supabase: any,
  families?: string[],
  extractorIds?: string[]
): Promise<Extractor[]> {
  let query = supabase
    .from("prompt_registry")
    .select("id, purpose, core_prompt, metadata")
    .eq("category", "extraction")
    .eq("is_active", true)
    .like("id", "nep_%");

  if (extractorIds && extractorIds.length > 0) {
    query = query.in("id", extractorIds);
  }

  const { data, error } = await query.limit(200);
  if (error || !data) {
    console.error("Failed to load extractors:", error);
    return [];
  }

  let extractors: Extractor[] = data.map((row: any) => {
    const meta = typeof row.metadata === "object" && row.metadata ? row.metadata : {};
    return {
      id: row.id,
      family: meta.family || "unknown",
      purpose: row.purpose || "",
      core_prompt: row.core_prompt,
      cost_multiplier: Number(meta.cost_multiplier) || 1,
      level: meta.level || "L2",
    };
  });

  // Filter by families if specified
  if (families && families.length > 0) {
    extractors = extractors.filter(e => families.includes(e.family));
  }

  return extractors;
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  // Handle GET for listing available extractors
  if (req.method === "GET") {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const extractors = await loadExtractors(supabase);
      
      // Group by family
      const byFamily: Record<string, any[]> = {};
      for (const ext of extractors) {
        if (!byFamily[ext.family]) byFamily[ext.family] = [];
        byFamily[ext.family].push({
          id: ext.id,
          purpose: ext.purpose,
          cost_multiplier: ext.cost_multiplier,
          level: ext.level,
        });
      }

      const familiesWithExtractors = NEP_FAMILIES.map(f => ({
        ...f,
        extractors: byFamily[f.key] || [],
        count: (byFamily[f.key] || []).length,
      }));

      return new Response(JSON.stringify({
        families: familiesWithExtractors,
        total_extractors: extractors.length,
      }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    } catch (e) {
      console.error("GET extractors error:", e);
      return new Response(JSON.stringify({ error: "Failed to load extractors" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Auth
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
      return new Response(JSON.stringify({ error: "Rate limit exceeded (5 deep extractions/hour)" }), {
        status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const DeepExtractSchema = z.object({
      episode_id: z.string().uuid("Invalid episode_id format"),
      families: z.array(z.string().max(30)).max(12).optional(),
      extractor_ids: z.array(z.string().max(60)).max(120).optional(),
    });
    const parsed = DeepExtractSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { episode_id, families, extractor_ids } = parsed.data;

    // Fetch episode
    const { data: episode, error: epErr } = await supabase
      .from("episodes").select("*").eq("id", episode_id).eq("author_id", userId).single();

    if (!episode || epErr) {
      return new Response(JSON.stringify({ error: "Episode not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const workspaceId = episode.workspace_id;

    const transcript = episode.transcript || "";
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "No transcript content" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Load extractors dynamically from DB
    const extractors = await loadExtractors(supabase, families, extractor_ids);
    if (extractors.length === 0) {
      return new Response(JSON.stringify({ error: "No extractors found for selected families" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log(`Deep extract: ${extractors.length} extractors from ${[...new Set(extractors.map(e => e.family))].join(", ")}`);

    // Calculate cost
    const baseCost = 50;
    const totalCost = Math.round(extractors.reduce(
      (sum, e) => sum + baseCost * e.cost_multiplier, 0
    ));

    // RESERVE neurons (atomic wallet)
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: userId,
      _amount: totalCost,
      _description: `RESERVE: Deep Extract (${extractors.length} extractors): ${episode.title}`,
    });

    if (reserveErr || !reserved) {
      return new Response(JSON.stringify({
        error: "Insufficient credits",
        needed: totalCost,
        reason_code: "RC.CREDITS.INSUFFICIENT",
      }), { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    let settled = false;

    // Update status
    await supabase.from("episodes").update({ status: "analyzing" }).eq("id", episode_id);

    // Chunk transcript
    const chunks = chunkWithOverlap(transcript);
    const maxSampleChunks = 5;
    let sampleChunks: string[];
    if (chunks.length <= maxSampleChunks) {
      sampleChunks = chunks;
    } else {
      const step = (chunks.length - 1) / (maxSampleChunks - 1);
      sampleChunks = Array.from({ length: maxSampleChunks }, (_, i) => chunks[Math.round(i * step)]);
    }
    const sampleText = sampleChunks.join("\n\n---\n\n");

    // Regime check
    const regime = await getRegimeConfig("deep-extract");
    const blockReason = checkRegimeBlock(regime, totalCost);
    if (blockReason) {
      await supabase.rpc("release_neurons", { _user_id: userId, _amount: totalCost, _description: `RELEASE: Regime blocked — ${blockReason}` }).catch(() => {});
      return new Response(JSON.stringify({ error: blockReason }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Create tracking job
    const { data: trackingJob } = await supabase
      .from("neuron_jobs")
      .insert({
        author_id: userId,
        worker_type: "deep-extract",
        status: "running",
        depth: "deep",
        workspace_id: workspaceId,
        input: { episode_id, families: families || [], extractor_count: extractors.length },
      })
      .select("id")
      .single();
    const jobId = trackingJob?.id;

    // Run each extractor
    const results: Array<{
      extractor_id: string;
      family: string;
      neurons_created: number;
      avg_score: number;
    }> = [];
    let totalNeurons = 0;

    // Process extractors in batches of 3 for parallel execution
    const BATCH_SIZE = 3;
    for (let batchStart = 0; batchStart < extractors.length; batchStart += BATCH_SIZE) {
      const batch = extractors.slice(batchStart, batchStart + BATCH_SIZE);
      
      const batchResults = await Promise.all(batch.map(async (extractor) => {
        console.log(`Running extractor: ${extractor.id} (${extractor.family})`);

        const extracted = await callAI(
          LOVABLE_API_KEY,
          extractor.core_prompt,
          `Episode: "${episode.title}"\n\nContent (${sampleChunks.length} segments):\n${sampleText.slice(0, 30000)}`
        );

        let extractorNeurons = 0;
        let scoreSum = 0;

        for (const item of extracted) {
          // Compute score from confidence + type heuristics
          const confidence = Number(item.confidence) || 0.5;
          const scores = {
            novelty: confidence * 0.8 + Math.random() * 0.2,
            information_density: Math.min(1, (item.content?.length || 0) / 500),
            utility: confidence,
            demand: 0.5 + Math.random() * 0.3,
          };
          const { composite, tier } = computeCompositeScore(scores);

          if (tier === "discard") continue;

          const { data: newNeuron, error: nErr } = await supabase
            .from("neurons")
            .insert({
              author_id: userId,
              title: (item.title || `${extractor.purpose}`).slice(0, 200),
              status: "draft",
              lifecycle: "structured",
              content_category: item.type || "insight",
              episode_id,
              workspace_id: workspaceId,
              credits_cost: Math.round(baseCost * extractor.cost_multiplier / 3),
            })
            .select("id")
            .single();

          if (nErr || !newNeuron) { console.error("Neuron creation error:", nErr); continue; }

          // Create blocks
          const blocks = [
            { type: "heading", content: item.title || "Untitled" },
            { type: "text", content: item.content || "" },
            { type: "reference", content: `Family: ${extractor.family} | Extractor: ${extractor.id} | Confidence: ${(confidence * 100).toFixed(0)}%` },
          ];
          if (item.tags && item.tags.length > 0) {
            blocks.push({ type: "reference", content: `Tags: ${item.tags.join(", ")}` });
          }

          for (let i = 0; i < blocks.length; i++) {
            await supabase.from("neuron_blocks").insert({
              neuron_id: newNeuron.id,
              type: blocks[i].type,
              content: blocks[i].content.slice(0, 50_000),
              position: i,
              execution_mode: "passive",
            });
          }

          // Store score
          await supabase.from("insight_scores").upsert({
            neuron_id: newNeuron.id,
            novelty: scores.novelty,
            information_density: scores.information_density,
            utility: scores.utility,
            demand: scores.demand,
            composite_score: composite,
            tier,
            extraction_level: extractor.level,
            model_version: "nep-120-v1",
          }, { onConflict: "neuron_id" });

          extractorNeurons++;
          scoreSum += composite;
        }

        return {
          extractor_id: extractor.id,
          family: extractor.family,
          neurons_created: extractorNeurons,
          avg_score: extractorNeurons > 0 ? Math.round(scoreSum / extractorNeurons) : 0,
        };
      }));

      for (const r of batchResults) {
        results.push(r);
        totalNeurons += r.neurons_created;
      }
    }

    // Release if nothing extracted
    if (totalNeurons === 0) {
      await supabase.rpc("release_neurons", {
        _user_id: userId,
        _amount: totalCost,
        _description: `RELEASE: Deep extract ${episode.title} — no results`,
      }).catch(() => {});
      await supabase.from("episodes").update({ status: "transcribed" }).eq("id", episode_id);
      if (jobId) {
        await supabase.from("neuron_jobs").update({
          status: "failed", completed_at: new Date().toISOString(),
          error_message: "No neurons extracted",
          result: { error: "No neurons extracted" },
        }).eq("id", jobId);
      }
      return new Response(JSON.stringify({ error: "No neurons extracted" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // SETTLE neurons on success
    await supabase.rpc("settle_neurons", {
      _user_id: userId,
      _amount: totalCost,
      _description: `SETTLE: Deep Extract — ${totalNeurons} neurons`,
    });
    settled = true;

    // Finalize
    const familiesUsed = [...new Set(results.map(r => r.family))];
    await supabase.from("episodes").update({
      status: "analyzed",
      metadata: {
        ...(typeof episode.metadata === "object" && episode.metadata ? episode.metadata : {}),
        deep_extract: {
          extractors_run: extractors.map(e => e.id),
          families_used: familiesUsed,
          total_neurons: totalNeurons,
          results,
          extracted_at: new Date().toISOString(),
          engine_version: "nep-120-v1",
        },
      },
    } as any).eq("id", episode_id);

    // Mark tracking job completed
    if (jobId) {
      await supabase.from("neuron_jobs").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        progress: 100,
        result: {
          total_neurons: totalNeurons,
          credits_spent: totalCost,
          extractors_used: extractors.length,
          families_used: familiesUsed,
        },
      }).eq("id", jobId);
    }

    return new Response(JSON.stringify({
      success: true,
      total_neurons: totalNeurons,
      credits_spent: totalCost,
      extractors_used: extractors.length,
      families_used: familiesUsed,
      results,
      job_id: jobId,
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

  } catch (e) {
    console.error("deep-extract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
