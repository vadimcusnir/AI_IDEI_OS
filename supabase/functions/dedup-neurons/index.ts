/**
 * dedup-neurons — Embedding-based duplicate detection (Phase 2.3)
 * Finds similar neurons using cosine similarity on embeddings.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

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
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Regime check ──
    const regime = await getRegimeConfig("dedup-neurons");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: blockReason }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { threshold, limit } = await req.json();
    const similarityThreshold = Math.max(0.3, Math.min(0.95, Number(threshold) || 0.40));
    const maxResults = Math.max(1, Math.min(100, Number(limit) || 50));

    // Fetch user's neuron embeddings
    const { data: embeddings, error: embErr } = await supabase
      .from("neuron_embeddings")
      .select("neuron_id, embedding")
      .order("created_at", { ascending: false })
      .limit(500);

    if (embErr || !embeddings || embeddings.length < 2) {
      return new Response(JSON.stringify({
        success: true,
        duplicates_found: 0,
        message: embeddings?.length === 0
          ? "No embeddings found. Run embedding generation first."
          : "Not enough embeddings for comparison.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Filter to user's neurons only
    const { data: userNeurons } = await supabase
      .from("neurons")
      .select("id")
      .eq("author_id", userId)
      .limit(1000);

    const userNeuronIds = new Set((userNeurons || []).map((n: any) => n.id));
    const userEmbeddings = embeddings.filter((e: any) => userNeuronIds.has(e.neuron_id));

    if (userEmbeddings.length < 2) {
      return new Response(JSON.stringify({
        success: true,
        duplicates_found: 0,
        message: "Not enough embeddings for your neurons.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find duplicates using SQL with pgvector
    // We'll use the search_neurons_semantic RPC for each neuron
    const duplicates: Array<{
      neuron_a: number;
      neuron_b: number;
      similarity: number;
    }> = [];

    const seen = new Set<string>();

    for (const emb of userEmbeddings) {
      if (!emb.embedding) continue;

      // Query similar neurons
      const { data: similar } = await supabase.rpc("search_neurons_semantic", {
        query_embedding: emb.embedding,
        match_threshold: similarityThreshold,
        match_count: 10,
        _user_id: userId,
      });

      for (const match of similar || []) {
        if (match.neuron_id === emb.neuron_id) continue;
        const key = [Math.min(emb.neuron_id, match.neuron_id), Math.max(emb.neuron_id, match.neuron_id)].join("-");
        if (seen.has(key)) continue;
        seen.add(key);

        duplicates.push({
          neuron_a: Math.min(emb.neuron_id, match.neuron_id),
          neuron_b: Math.max(emb.neuron_id, match.neuron_id),
          similarity: Math.round(match.similarity * 1000) / 1000,
        });

        if (duplicates.length >= maxResults) break;
      }
      if (duplicates.length >= maxResults) break;
    }

    // Store duplicates in DB
    let stored = 0;
    for (const dup of duplicates) {
      const { error: insertErr } = await supabase
        .from("neuron_duplicates")
        .upsert({
          neuron_a: dup.neuron_a,
          neuron_b: dup.neuron_b,
          similarity: dup.similarity,
          status: "pending",
        }, { onConflict: "neuron_a,neuron_b" });

      if (!insertErr) stored++;
    }

    // Fetch titles for response
    const allIds = [...new Set(duplicates.flatMap(d => [d.neuron_a, d.neuron_b]))];
    const { data: neuronTitles } = await supabase
      .from("neurons")
      .select("id, title")
      .in("id", allIds.length > 0 ? allIds : [0]);

    const titleMap = new Map((neuronTitles || []).map((n: any) => [n.id, n.title]));

    return new Response(JSON.stringify({
      success: true,
      duplicates_found: duplicates.length,
      stored,
      threshold: similarityThreshold,
      duplicates: duplicates.slice(0, 20).map(d => ({
        ...d,
        title_a: titleMap.get(d.neuron_a) || "Unknown",
        title_b: titleMap.get(d.neuron_b) || "Unknown",
      })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("dedup-neurons error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
