import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// NEP-120 family detection from title/content
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
    if (score > bestScore) {
      bestScore = score;
      best = family;
    }
  }
  return bestScore > 0 ? best : null;
}

// Relation type weights for IdeaRank context
const RELATION_WEIGHTS: Record<string, number> = {
  supports: 0.8,
  contradicts: 0.3,
  extends: 0.7,
  references: 0.5,
  derived_from: 1.0,
  applies_to: 0.6,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, neuron_ids } = await req.json();

    if (action === "compute_idearank") {
      // Call the DB function
      const { error } = await supabase.rpc("compute_idearank");
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "IdeaRank computed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const neuron of neurons || []) {
        const entityType = CATEGORY_TO_TYPE[neuron.content_category] || "insight";
        const baseSlug = slugify(neuron.title);
        const slug = `${baseSlug}-${neuron.number}`;

        const { data: existing } = await supabase
          .from("entities")
          .select("id")
          .eq("neuron_id", neuron.id)
          .single();

        // Get blocks for description
        const { data: blocks } = await supabase
          .from("neuron_blocks")
          .select("content, type")
          .eq("neuron_id", neuron.id)
          .order("position")
          .limit(10);

        const description = (blocks || [])
          .filter((b: any) => b.type === "text" && b.content)
          .map((b: any) => b.content)
          .join("\n\n")
          .slice(0, 2000);

        const summary = description.slice(0, 300) || neuron.title;
        const family = detectFamily(neuron.title, description);
        const metaDesc = `${neuron.title} — ${entityType} extracted through intelligence pipeline. ${family ? `Family: ${family}.` : ""}`.slice(0, 160);

        // Count evidence (blocks that reference segments)
        const evidenceCount = (blocks || []).filter((b: any) => b.type === "quote" || b.type === "source" || b.type === "evidence").length;

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

        if (existing) {
          await supabase.from("entities").update(entityData).eq("id", existing.id);
          updated++;
        } else {
          const { error: insertErr } = await supabase.from("entities").insert(entityData);
          if (insertErr) {
            if (insertErr.code === "23505") skipped++;
            else { console.error("Insert error:", insertErr); skipped++; }
          } else {
            created++;
          }
        }
      }

      // Build relations from neuron_links with proper weights
      let relationsCreated = 0;
      if (action === "project_all") {
        const { data: links } = await supabase
          .from("neuron_links")
          .select("source_neuron_id, target_neuron_id, relation_type")
          .limit(5000);

        for (const link of links || []) {
          const [{ data: src }, { data: tgt }] = await Promise.all([
            supabase.from("entities").select("id").eq("neuron_id", link.source_neuron_id).single(),
            supabase.from("entities").select("id").eq("neuron_id", link.target_neuron_id).single(),
          ]);

          if (src && tgt) {
            const relType = (link.relation_type || "RELATES_TO").toUpperCase().replace(/\s+/g, "_");
            const weight = RELATION_WEIGHTS[link.relation_type?.toLowerCase()] || 0.5;
            await supabase.from("entity_relations").upsert(
              {
                source_entity_id: src.id,
                target_entity_id: tgt.id,
                relation_type: relType,
                weight,
              },
              { onConflict: "source_entity_id,target_entity_id,relation_type" }
            );
            relationsCreated++;
          }
        }

        // Compute IdeaRank after projection
        await supabase.rpc("compute_idearank");
      }

      return new Response(
        JSON.stringify({ created, updated, skipped, relationsCreated }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: project_all, project_neurons, compute_idearank" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
