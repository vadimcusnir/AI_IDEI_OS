/**
 * project-neurons — Auto-projects newly extracted neurons into knowledge graph entities.
 * User-scoped (non-admin): only processes neurons owned by the caller.
 * Called automatically after neuron extraction in the pipeline.
 *
 * Input: { episode_id: string }
 * Output: { entities_created, entities_updated, relations_created }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
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
  decision: ["decision", "choice", "criteria", "tradeoff", "bias", "heuristic"],
  strategy: ["strategy", "strategic", "leverage", "competition", "adaptation"],
  economic: ["value", "pricing", "incentive", "market", "cost", "scarcity"],
  behavioral: ["behavior", "motivation", "fear", "status", "habit", "emotional"],
  cognitive: ["mental model", "thinking", "attention", "abstraction", "learning"],
  system: ["system", "feedback", "scaling", "bottleneck", "emergence"],
  knowledge: ["knowledge", "transfer", "framework", "validation", "distortion"],
  communication: ["argument", "narrative", "persuasion", "credibility", "framing"],
  organization: ["leadership", "power", "coordination", "trust", "culture"],
  innovation: ["innovation", "creative", "experiment", "disruption", "novelty"],
  risk: ["risk", "uncertainty", "fragility", "cascade", "blindspot"],
  meta: ["contradiction", "paradox", "meta", "assumption", "epistemic"],
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":project-neurons", req, { maxRequests: 20, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

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
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Regime ──
    const regime = await getRegimeConfig("project-neurons");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: blockReason }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const ProjectSchema = z.object({
      episode_id: z.string().uuid("Invalid episode_id format"),
    });
    const parsed = ProjectSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { episode_id } = parsed.data;

    // ── Get neurons for this episode, owned by this user ──
    const { data: neurons, error: nErr } = await supabase
      .from("neurons")
      .select("id, number, title, content_category, score, lifecycle")
      .eq("episode_id", episode_id)
      .eq("author_id", user.id)
      .not("content_category", "is", null)
      .limit(500);

    if (nErr) throw nErr;
    if (!neurons || neurons.length === 0) {
      return new Response(JSON.stringify({ success: true, entities_created: 0, message: "No neurons to project" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const neuronIds = neurons.map((n: any) => n.id);

    // ── Batch fetch blocks ──
    const blockMap = new Map<number, any[]>();
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

    // ── Check existing entities ──
    const existingMap = new Map<number, string>();
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

    // ── Project neurons → entities ──
    let created = 0, updated = 0;
    const inserts: any[] = [];
    const updates: { id: string; data: any }[] = [];

    for (const neuron of neurons) {
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
      const metaDesc = `${neuron.title} — ${entityType}. ${family ? `Family: ${family}.` : ""}`.slice(0, 160);
      const evidenceCount = blocks.filter((b: any) => ["quote", "source", "evidence"].includes(b.type)).length;

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
        is_published: false, // User-created entities start unpublished
        canonical_url: `/${typePath}/${slug}`,
      };

      const existingId = existingMap.get(neuron.id);
      if (existingId) {
        updates.push({ id: existingId, data: entityData });
      } else {
        inserts.push(entityData);
      }
    }

    // Batch insert
    if (inserts.length > 0) {
      const { data: inserted, error: insErr } = await supabase
        .from("entities").insert(inserts).select("id");
      if (!insErr) created = (inserted || []).length;
      else console.error("Entity insert error:", insErr);
    }

    // Updates
    for (const u of updates) {
      await supabase.from("entities").update(u.data).eq("id", u.id);
      updated++;
    }

    // ── Build inter-neuron relations ──
    let relationsCreated = 0;
    const { data: links } = await supabase
      .from("neuron_links")
      .select("source_neuron_id, target_neuron_id, relation_type")
      .in("source_neuron_id", neuronIds)
      .limit(1000);

    if (links && links.length > 0) {
      // Get entity IDs for linked neurons
      const targetIds = [...new Set(links.map((l: any) => l.target_neuron_id))];
      const entityMap = new Map<number, string>();
      
      // Include source neurons
      for (let i = 0; i < neuronIds.length; i += CHUNK) {
        const chunk = neuronIds.slice(i, i + CHUNK);
        const { data } = await supabase.from("entities").select("id, neuron_id").in("neuron_id", chunk);
        for (const e of data || []) entityMap.set(e.neuron_id, e.id);
      }
      // Include target neurons
      for (let i = 0; i < targetIds.length; i += CHUNK) {
        const chunk = targetIds.slice(i, i + CHUNK);
        const { data } = await supabase.from("entities").select("id, neuron_id").in("neuron_id", chunk);
        for (const e of data || []) entityMap.set(e.neuron_id, e.id);
      }

      const relBatch: any[] = [];
      for (const link of links) {
        const srcId = entityMap.get(link.source_neuron_id);
        const tgtId = entityMap.get(link.target_neuron_id);
        if (srcId && tgtId) {
          relBatch.push({
            source_entity_id: srcId,
            target_entity_id: tgtId,
            relation_type: (link.relation_type || "RELATES_TO").toUpperCase().replace(/\s+/g, "_"),
            weight: 0.5,
          });
        }
      }

      if (relBatch.length > 0) {
        const { data: relInserted } = await supabase
          .from("entity_relations")
          .upsert(relBatch, { onConflict: "source_entity_id,target_entity_id,relation_type" })
          .select("id");
        relationsCreated = (relInserted || []).length;
      }
    }

    // ── Update episode status ──
    await supabase.from("episodes").update({
      metadata: {
        entities_projected: created + updated,
        relations_created: relationsCreated,
        projected_at: new Date().toISOString(),
      },
    } as any).eq("id", episode_id);

    return new Response(JSON.stringify({
      success: true,
      entities_created: created,
      entities_updated: updated,
      relations_created: relationsCreated,
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

  } catch (e) {
    console.error("project-neurons error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
