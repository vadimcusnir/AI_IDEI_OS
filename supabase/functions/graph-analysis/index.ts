/**
 * graph-analysis — AI-powered contradiction detection, knowledge gap identification, and suggestions.
 * POST /graph-analysis { action: "contradictions" | "gaps" | "suggestions", workspace_id }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const { action, workspace_id } = await req.json();
    if (!workspace_id) throw new Error("workspace_id required");

    // Verify workspace membership
    const { data: member } = await supabase.rpc("is_workspace_member", { _user_id: user.id, _workspace_id: workspace_id });
    if (!member) throw new Error("Not a workspace member");

    if (action === "contradictions") {
      return await findContradictions(supabase, workspace_id);
    } else if (action === "gaps") {
      return await findGaps(supabase, workspace_id);
    } else if (action === "suggestions") {
      return await getSuggestions(supabase, workspace_id);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function findContradictions(supabase: any, workspaceId: string) {
  // Get entities with their summaries for contradiction analysis
  const { data: entities } = await supabase
    .from("entities")
    .select("id, title, entity_type, summary, tags")
    .eq("workspace_id", workspaceId)
    .eq("is_published", true)
    .limit(200);

  if (!entities?.length || entities.length < 2) {
    return jsonResponse({ contradictions: [], message: "Need at least 2 entities" });
  }

  // Group entities by similar tags/types for comparison
  const pairs: { a: any; b: any; reason: string }[] = [];

  for (let i = 0; i < entities.length && pairs.length < 20; i++) {
    for (let j = i + 1; j < entities.length && pairs.length < 20; j++) {
      const a = entities[i];
      const b = entities[j];
      // Same type, different content — potential contradiction
      if (a.entity_type === b.entity_type && a.entity_type !== "profile") {
        const sharedTags = (a.tags || []).filter((t: string) => (b.tags || []).includes(t));
        if (sharedTags.length > 0) {
          pairs.push({ a, b, reason: `Shared tags: ${sharedTags.join(", ")}` });
        }
      }
    }
  }

  if (pairs.length === 0) {
    return jsonResponse({ contradictions: [], message: "No potential contradictions found" });
  }

  // Use AI to analyze top pairs
  const pairsSummary = pairs.slice(0, 10).map((p, i) =>
    `${i + 1}. "${p.a.title}" vs "${p.b.title}"\n   A: ${p.a.summary || "No summary"}\n   B: ${p.b.summary || "No summary"}`
  ).join("\n\n");

  const prompt = `Analyze these entity pairs from a knowledge graph. Identify which pairs contain genuine contradictions (conflicting claims, opposing frameworks, or incompatible assumptions). Return ONLY valid JSON array.

${pairsSummary}

Return format: [{"pair_index": 1, "is_contradiction": true, "severity": "high|moderate|low", "description": "Brief explanation of the contradiction"}]
Only include pairs that ARE contradictions. If none, return [].`;

  const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  const aiData = await aiRes.json();
  const content = aiData.choices?.[0]?.message?.content || "[]";

  let contradictions: any[] = [];
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    contradictions = JSON.parse(cleaned);
  } catch { contradictions = []; }

  // Store found contradictions
  for (const c of contradictions) {
    if (c.is_contradiction && c.pair_index >= 1 && c.pair_index <= pairs.length) {
      const pair = pairs[c.pair_index - 1];
      await supabase.from("contradiction_pairs").upsert({
        workspace_id: workspaceId,
        entity_a_id: pair.a.id,
        entity_b_id: pair.b.id,
        description: c.description,
        severity: c.severity || "moderate",
        ai_analysis: content,
      }, { onConflict: "entity_a_id,entity_b_id" });
    }
  }

  return jsonResponse({ contradictions, pairs_analyzed: pairs.length });
}

async function findGaps(supabase: any, workspaceId: string) {
  const { data: entities } = await supabase
    .from("entities")
    .select("id, title, entity_type, tags, summary")
    .eq("workspace_id", workspaceId)
    .eq("is_published", true)
    .limit(300);

  if (!entities?.length) {
    return jsonResponse({ gaps: [], message: "No entities to analyze" });
  }

  const typeCounts: Record<string, number> = {};
  const allTags: Record<string, number> = {};
  entities.forEach((e: any) => {
    typeCounts[e.entity_type] = (typeCounts[e.entity_type] || 0) + 1;
    (e.tags || []).forEach((t: string) => { allTags[t] = (allTags[t] || 0) + 1; });
  });

  const topTags = Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 30);
  const entitySummary = entities.slice(0, 50).map((e: any) => `- ${e.title} (${e.entity_type})`).join("\n");

  const prompt = `You are a knowledge graph analyst. Given this knowledge graph summary, identify 3-5 knowledge gaps — topics that are mentioned or implied but not yet explored.

Entity types: ${JSON.stringify(typeCounts)}
Top tags: ${topTags.map(([t, c]) => `${t}(${c})`).join(", ")}

Sample entities:
${entitySummary}

Return ONLY valid JSON: [{"topic": "...", "description": "Why this gap matters", "gap_type": "unexplored|shallow|missing_connection", "confidence": 0.0-1.0, "suggested_sources": ["source type 1"]}]`;

  const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });

  const aiData = await aiRes.json();
  const content = aiData.choices?.[0]?.message?.content || "[]";

  let gaps: any[] = [];
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    gaps = JSON.parse(cleaned);
  } catch { gaps = []; }

  // Store gaps
  for (const g of gaps) {
    await supabase.from("knowledge_gaps").insert({
      workspace_id: workspaceId,
      topic: g.topic,
      description: g.description || "",
      gap_type: g.gap_type || "unexplored",
      confidence: g.confidence || 0.5,
      suggested_sources: g.suggested_sources || [],
    });
  }

  return jsonResponse({ gaps, entity_count: entities.length });
}

async function getSuggestions(supabase: any, workspaceId: string) {
  // Get recent entities + gaps
  const [entitiesRes, gapsRes] = await Promise.all([
    supabase.from("entities").select("title, entity_type, tags").eq("workspace_id", workspaceId).eq("is_published", true).order("created_at", { ascending: false }).limit(30),
    supabase.from("knowledge_gaps").select("topic, description").eq("workspace_id", workspaceId).eq("status", "open").limit(10),
  ]);

  const entities = entitiesRes.data || [];
  const gaps = gapsRes.data || [];

  const prompt = `Based on this knowledge graph state, suggest 3-5 specific actions the user should take to strengthen their knowledge base.

Recent entities: ${entities.map((e: any) => `${e.title} (${e.entity_type})`).join(", ")}
Open gaps: ${gaps.map((g: any) => g.topic).join(", ") || "None identified"}

Return ONLY valid JSON: [{"suggestion": "...", "priority": "high|medium|low", "effort": "5min|30min|1hour|1day", "category": "explore|connect|validate|expand"}]`;

  const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    }),
  });

  const aiData = await aiRes.json();
  const content = aiData.choices?.[0]?.message?.content || "[]";

  let suggestions: any[] = [];
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    suggestions = JSON.parse(cleaned);
  } catch { suggestions = []; }

  return jsonResponse({ suggestions });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      "Content-Type": "application/json",
    },
  });
}
