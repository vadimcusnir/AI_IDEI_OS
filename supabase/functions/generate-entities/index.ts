import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 120);
}

const CATEGORY_TO_TYPE: Record<string, string> = {
  insight: "insight",
  pattern: "pattern",
  formula: "formula",
  strategy: "application",
  commercial: "application",
  argument_map: "contradiction",
  framework: "pattern",
  narrative: "insight",
  psychological: "profile",
  avatar: "profile",
  transcript: "insight",
};

const FAMILY_KEYWORDS: Record<string, string[]> = {
  decision: ["decision", "choice", "criteria", "tradeoff", "bias", "heuristic", "threshold"],
  strategy: ["strategy", "strategic", "leverage", "competition", "adaptation", "constraint"],
  economic: ["value", "pricing", "incentive", "market", "cost", "scarcity", "resource"],
  behavioral: ["behavior", "motivation", "fear", "status", "habit", "emotional", "identity"],
  cognitive: ["mental model", "thinking", "attention", "abstraction", "learning", "intuition"],
  system: ["system", "feedback", "scaling", "bottleneck", "emergence", "resilience"],
  knowledge: ["knowledge", "transfer", "framework", "validation", "distortion", "gap"],
  communication: ["argument", "narrative", "persuasion", "credibility", "framing", "story"],
  organization: ["leadership", "power", "coordination", "trust", "culture", "hierarchy"],
  innovation: ["innovation", "creative", "experiment", "disruption", "novelty", "invention"],
  risk: ["risk", "uncertainty", "fragility", "cascade", "blindspot", "mitigation"],
  meta: ["contradiction", "paradox", "meta", "assumption", "epistemic", "belief"],
};

function detectFamily(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();
  let best: string | null = null;
  let bestScore = 0;
  for (const [family, keywords] of Object.entries(FAMILY_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = family; }
  }
  return bestScore > 0 ? best : null;
}

const RELATION_WEIGHTS: Record<string, number> = {
  supports: 0.8, contradicts: 0.3, extends: 0.7,
  references: 0.5, derived_from: 1.0, applies_to: 0.6,
};

// ── Batch helper: fetch blocks for multiple neurons at once ──
async function batchFetchBlocks(supabase: any, neuronIds: number[]) {
  const blockMap = new Map<number, any[]>();
  // Supabase .in() has a practical limit of ~300 items, chunk if needed
  const CHUNK = 200;
  for (let i = 0; i < neuronIds.length; i += CHUNK) {
    const chunk = neuronIds.slice(i, i + CHUNK);
    const { data } = await supabase
      .from("neuron_blocks")
      .select("neuron_id, content, type")
      .in("neuron_id", chunk)
      .order("position");
    for (const b of data || []) {
      if (!blockMap.has(b.neuron_id)) blockMap.set(b.neuron_id, []);
      blockMap.get(b.neuron_id)!.push(b);
    }
  }
  return blockMap;
}

// ── Batch helper: check existing entities for neuron_ids ──
async function batchCheckExisting(supabase: any, neuronIds: number[]) {
  const existingMap = new Map<number, string>();
  const CHUNK = 200;
  for (let i = 0; i < neuronIds.length; i += CHUNK) {
    const chunk = neuronIds.slice(i, i + CHUNK);
    const { data } = await supabase
      .from("entities")
      .select("id, neuron_id")
      .in("neuron_id", chunk);
    for (const e of data || []) {
      existingMap.set(e.neuron_id, e.id);
    }
  }
  return existingMap;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Rate limit guard
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 10, windowSeconds: 60 }, cors);
    if (rateLimited) return rateLimited;

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { action, neuron_ids } = await req.json();

    // ── Regime check ──
    const regime = await getRegimeConfig("generate-entities");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(
        JSON.stringify({ error: "Blocked by execution regime", reason: blockReason, regime: regime.regime }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
    const isDryRun = regime.dryRun || regime.regime === "simulation";

    if (action === "compute_idearank") {
      if (isDryRun) {
        return new Response(
          JSON.stringify({ success: true, message: "DRY RUN — IdeaRank skipped", dry_run: true }),
          { headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
      const { error } = await supabase.rpc("compute_idearank");
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "IdeaRank computed" }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (action === "project_all" || action === "project_neurons") {
      let query = supabase
        .from("neurons")
        .select("id, number, title, content_category, score, lifecycle, visibility, created_at")
        .eq("visibility", "public")
        .not("content_category", "is", null);

      if (neuron_ids && neuron_ids.length > 0) {
        query = query.in("id", neuron_ids);
      }

      const { data: neurons, error: neuronsErr } = await query.limit(1000);
      if (neuronsErr) throw neuronsErr;

      const neuronList = neurons || [];
      const neuronIds = neuronList.map((n: any) => n.id);

      // ── BATCH: fetch all blocks + existing entities in parallel ──
      const [blockMap, existingMap] = await Promise.all([
        batchFetchBlocks(supabase, neuronIds),
        batchCheckExisting(supabase, neuronIds),
      ]);

      let created = 0, updated = 0, skipped = 0;

      // Process in batches of 20 for upserts
      const BATCH_SIZE = 20;
      for (let i = 0; i < neuronList.length; i += BATCH_SIZE) {
        const batch = neuronList.slice(i, i + BATCH_SIZE);
        const upserts: any[] = [];
        const updates: { id: string; data: any }[] = [];

        for (const neuron of batch) {
          const entityType = CATEGORY_TO_TYPE[neuron.content_category] || "insight";
          const baseSlug = slugify(neuron.title);
          const slug = `${baseSlug}-${neuron.number}`;
          const blocks = blockMap.get(neuron.id) || [];

          const description = blocks
            .filter((b: any) => b.type === "text" && b.content)
            .map((b: any) => b.content)
            .join("\n\n")
            .slice(0, 2000);

          const summary = description.slice(0, 300) || neuron.title;
          const family = detectFamily(neuron.title, description);
          const metaDesc = `${neuron.title} — ${entityType} extracted through intelligence pipeline. ${family ? `Family: ${family}.` : ""}`.slice(0, 160);
          const evidenceCount = blocks.filter((b: any) => b.type === "quote" || b.type === "source" || b.type === "evidence").length;

          const typePath = entityType === "application" ? "applications"
            : entityType === "contradiction" ? "contradictions"
            : entityType + "s";

          const entityData = {
            neuron_id: neuron.id,
            entity_type: entityType,
            slug,
            title: neuron.title,
            summary: summary || null,
            description: description || null,
            meta_description: metaDesc,
            confidence_score: (neuron.score || 0) / 100,
            importance_score: neuron.score || 0,
            evidence_count: evidenceCount,
            insight_family: family,
            is_published: true,
            canonical_url: `/${typePath}/${slug}`,
          };

          const existingId = existingMap.get(neuron.id);
          if (existingId) {
            updates.push({ id: existingId, data: entityData });
          } else {
            upserts.push(entityData);
          }
        }

        // Execute batch insert
        if (upserts.length > 0) {
          const { error: insertErr, data: inserted } = await supabase
            .from("entities").insert(upserts).select("id");
          if (insertErr) {
            if (insertErr.code === "23505") skipped += upserts.length;
            else { console.error("Batch insert error:", insertErr); skipped += upserts.length; }
          } else {
            created += (inserted || []).length;
          }
        }

        // Execute updates (still individual due to different IDs)
        for (const u of updates) {
          await supabase.from("entities").update(u.data).eq("id", u.id);
          updated++;
        }
      }

      // Build relations from neuron_links
      let relationsCreated = 0;
      if (action === "project_all") {
        const { data: links } = await supabase
          .from("neuron_links")
          .select("source_neuron_id, target_neuron_id, relation_type")
          .limit(5000);

        // Batch: get all entity mappings at once
        const allLinkNeuronIds = new Set<number>();
        for (const l of links || []) {
          allLinkNeuronIds.add(l.source_neuron_id);
          allLinkNeuronIds.add(l.target_neuron_id);
        }
        const entityMap = new Map<number, string>();
        const linkIds = Array.from(allLinkNeuronIds);
        const CHUNK = 200;
        for (let i = 0; i < linkIds.length; i += CHUNK) {
          const chunk = linkIds.slice(i, i + CHUNK);
          const { data } = await supabase
            .from("entities").select("id, neuron_id").in("neuron_id", chunk);
          for (const e of data || []) entityMap.set(e.neuron_id, e.id);
        }

        // Batch upsert relations
        const relBatch: any[] = [];
        for (const link of links || []) {
          const srcId = entityMap.get(link.source_neuron_id);
          const tgtId = entityMap.get(link.target_neuron_id);
          if (srcId && tgtId) {
            const relType = (link.relation_type || "RELATES_TO").toUpperCase().replace(/\s+/g, "_");
            const weight = RELATION_WEIGHTS[link.relation_type?.toLowerCase()] || 0.5;
            relBatch.push({
              source_entity_id: srcId,
              target_entity_id: tgtId,
              relation_type: relType,
              weight,
            });
          }
        }

        // Insert relations in chunks
        for (let i = 0; i < relBatch.length; i += 100) {
          const chunk = relBatch.slice(i, i + 100);
          const { data } = await supabase.from("entity_relations")
            .upsert(chunk, { onConflict: "source_entity_id,target_entity_id,relation_type" })
            .select("id");
          relationsCreated += (data || []).length;
        }

        await supabase.rpc("compute_idearank");
      }

      return new Response(
        JSON.stringify({ created, updated, skipped, relationsCreated, dry_run: isDryRun, regime: regime.regime }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: project_all, project_neurons, compute_idearank" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
