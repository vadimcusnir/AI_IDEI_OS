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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, neuron_ids } = await req.json();

    if (action === "project_all" || action === "project_neurons") {
      // Get public neurons that don't have entities yet (or specific ones)
      let query = supabase
        .from("neurons")
        .select("id, number, title, content_category, score, lifecycle, visibility, created_at")
        .eq("visibility", "public")
        .not("content_category", "is", null);

      if (neuron_ids && neuron_ids.length > 0) {
        query = query.in("id", neuron_ids);
      }

      const { data: neurons, error: neuronsErr } = await query.limit(500);
      if (neuronsErr) throw neuronsErr;

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const neuron of neurons || []) {
        const entityType = CATEGORY_TO_TYPE[neuron.content_category] || "insight";
        const baseSlug = slugify(neuron.title);
        const slug = `${baseSlug}-${neuron.number}`;

        // Check if entity already exists for this neuron
        const { data: existing } = await supabase
          .from("entities")
          .select("id")
          .eq("neuron_id", neuron.id)
          .single();

        // Get neuron blocks for description
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
        const metaDesc = `${neuron.title} — ${entityType} extracted from intelligence pipeline. Confidence: ${neuron.score}%.`;

        const entityData = {
          neuron_id: neuron.id,
          entity_type: entityType,
          slug,
          title: neuron.title,
          summary: summary || null,
          description: description || null,
          meta_description: metaDesc.slice(0, 160),
          confidence_score: (neuron.score || 0) / 100,
          importance_score: neuron.score || 0,
          is_published: true,
          canonical_url: `/${entityType === "application" ? "applications" : entityType + "s"}/${slug}`,
        };

        if (existing) {
          await supabase
            .from("entities")
            .update(entityData)
            .eq("id", existing.id);
          updated++;
        } else {
          const { error: insertErr } = await supabase
            .from("entities")
            .insert(entityData);
          if (insertErr) {
            if (insertErr.code === "23505") { // unique violation on slug
              skipped++;
            } else {
              console.error("Insert error:", insertErr);
              skipped++;
            }
          } else {
            created++;
          }
        }
      }

      // Build relations from neuron_links
      if (action === "project_all") {
        const { data: links } = await supabase
          .from("neuron_links")
          .select("source_neuron_id, target_neuron_id, relation_type")
          .limit(5000);

        let relationsCreated = 0;
        for (const link of links || []) {
          const { data: sourceEntity } = await supabase
            .from("entities")
            .select("id")
            .eq("neuron_id", link.source_neuron_id)
            .single();

          const { data: targetEntity } = await supabase
            .from("entities")
            .select("id")
            .eq("neuron_id", link.target_neuron_id)
            .single();

          if (sourceEntity && targetEntity) {
            const relType = (link.relation_type || "RELATES_TO").toUpperCase().replace(/\s+/g, "_");
            await supabase.from("entity_relations").upsert(
              {
                source_entity_id: sourceEntity.id,
                target_entity_id: targetEntity.id,
                relation_type: relType,
                weight: 1.0,
              },
              { onConflict: "source_entity_id,target_entity_id,relation_type" }
            );
            relationsCreated++;
          }
        }

        return new Response(
          JSON.stringify({ created, updated, skipped, relationsCreated }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ created, updated, skipped }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
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
