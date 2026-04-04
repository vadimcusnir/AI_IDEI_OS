/**
 * structure-neurons — Auto-structures a user's neurons using AI.
 * Groups neurons into semantic clusters and identifies relationships
 * (supports, contradicts, extends) between them.
 * 
 * Input: { neuron_ids?: number[] } (optional filter; defaults to all user neurons)
 * Output: { clusters: [...], relations: [...], structured_count: number }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { aiCallWithRetry, extractAiContent } from "../_shared/ai-retry.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit
    const rateLimited = await rateLimitGuard(
      user.id + ":structure-neurons", req,
      { maxRequests: 5, windowSeconds: 300 },
      corsHeaders
    );
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));
    const neuronIds: number[] | undefined = body.neuron_ids;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch neurons with blocks
    let neuronsQuery = serviceClient
      .from("neurons")
      .select("id, title, content_category, score, uuid")
      .eq("author_id", user.id)
      .eq("status", "active")
      .order("id", { ascending: true })
      .limit(100);

    if (neuronIds?.length) {
      neuronsQuery = neuronsQuery.in("id", neuronIds);
    }

    const { data: neurons, error: nErr } = await neuronsQuery;
    if (nErr) throw new Error(`Fetch neurons: ${nErr.message}`);
    if (!neurons?.length) {
      return new Response(JSON.stringify({ error: "No neurons found", clusters: [], relations: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch blocks for content
    const nIds = neurons.map(n => n.id);
    const { data: blocks } = await serviceClient
      .from("neuron_blocks")
      .select("neuron_id, content, type, position")
      .in("neuron_id", nIds)
      .eq("type", "text")
      .order("position", { ascending: true });

    // Build neuron summaries for AI
    const blocksByNeuron = new Map<number, string[]>();
    (blocks || []).forEach(b => {
      if (!blocksByNeuron.has(b.neuron_id)) blocksByNeuron.set(b.neuron_id, []);
      blocksByNeuron.get(b.neuron_id)!.push(b.content);
    });

    const neuronSummaries = neurons.map(n => ({
      id: n.id,
      uuid: n.uuid,
      title: n.title,
      category: n.content_category,
      content: (blocksByNeuron.get(n.id) || []).join(" ").slice(0, 500),
    }));

    // AI structuring call
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI API key not configured");

    const prompt = `You are a knowledge structuring engine. Analyze these ${neuronSummaries.length} neurons and:

1. GROUP them into semantic clusters (max 10 clusters). Each cluster needs a name and theme.
2. IDENTIFY relationships between neurons. Types: "supports", "contradicts", "extends", "related".
3. Assign a depth level (1-12, where 1=surface, 12=deep foundational) to each neuron.

NEURONS:
${neuronSummaries.map(n => `[ID:${n.id}] "${n.title}" (${n.category || 'uncategorized'}): ${n.content || 'no content'}`).join("\n\n")}

Respond ONLY with valid JSON:
{
  "clusters": [
    { "name": "string", "theme": "string", "neuron_ids": [1,2,3], "depth_avg": 3 }
  ],
  "relations": [
    { "source_id": 1, "target_id": 2, "type": "supports|contradicts|extends|related", "confidence": 0.85, "reason": "brief reason" }
  ],
  "depth_assignments": [
    { "neuron_id": 1, "depth": 3 }
  ]
}`;

    const aiResp = await aiCallWithRetry(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const aiText = extractAiContent(aiResp);
    
    // Parse with repair
    let structured: any;
    try {
      const cleaned = aiText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      structured = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON", raw: aiText.slice(0, 500) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build UUID lookup
    const idToUuid = new Map(neurons.map(n => [n.id, n.uuid]));

    // Store relations in entity_relations
    const relations = (structured.relations || []).filter(
      (r: any) => idToUuid.has(r.source_id) && idToUuid.has(r.target_id) && r.source_id !== r.target_id
    );

    if (relations.length > 0) {
      const relRows = relations.map((r: any) => ({
        source_entity_id: idToUuid.get(r.source_id)!,
        target_entity_id: idToUuid.get(r.target_id)!,
        relation_type: r.type || "related",
        confidence: Math.min(1, Math.max(0, r.confidence || 0.5)),
        weight: 1,
        metadata: { reason: r.reason, auto_structured: true },
      }));

      // Upsert — delete old auto-structured relations first
      const sourceUuids = [...new Set(relRows.map((r: any) => r.source_entity_id))];
      await serviceClient
        .from("entity_relations")
        .delete()
        .in("source_entity_id", sourceUuids)
        .filter("metadata->>auto_structured", "eq", "true");

      const { error: insertErr } = await serviceClient
        .from("entity_relations")
        .insert(relRows);

      if (insertErr) console.error("Insert relations error:", insertErr.message);
    }

    // Update neuron categories based on clusters (tag with cluster name)
    for (const cluster of structured.clusters || []) {
      for (const nId of cluster.neuron_ids || []) {
        if (idToUuid.has(nId)) {
          await serviceClient
            .from("neurons")
            .update({ content_category: cluster.name })
            .eq("id", nId)
            .eq("author_id", user.id);
        }
      }
    }

    return new Response(JSON.stringify({
      clusters: structured.clusters || [],
      relations: relations.length,
      depth_assignments: structured.depth_assignments || [],
      structured_count: neurons.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[structure-neurons]", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
