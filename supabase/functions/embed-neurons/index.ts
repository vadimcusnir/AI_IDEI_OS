import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * embed-neurons — Generates vector embeddings for neurons using Lovable AI.
 * Stores in neuron_embeddings table for semantic search.
 * 
 * Accepts: { episode_id?: string, neuron_ids?: number[], batch_size?: number }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":embed-neurons", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    // Auth — require authenticated user or internal secret
    const authHeader = req.headers.get("authorization") || "";
    const internalSecret = req.headers.get("x-internal-secret");
    let userId: string | null = null;
    let isInternal = false;

    const { data: configSecret } = await supabase
      .from("push_config")
      .select("value")
      .eq("key", "internal_secret")
      .single();

    if (configSecret && internalSecret === configSecret.value) {
      isInternal = true;
    }

    if (!isInternal) {
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user }, error } = await userClient.auth.getUser();
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    }

    // ── Regime check ──
    const regime = await getRegimeConfig("embed-neurons");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: blockReason }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { episode_id, neuron_ids, batch_size = 50, text_only, content: textContent } = body;

    // ── Text-only mode: generate embedding for a search query ──
    if (text_only && textContent) {
      const embResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a semantic embedding generator. Given content, output EXACTLY 768 comma-separated floating point numbers between -1 and 1 that represent the semantic meaning of the content. Output ONLY the numbers, no other text.`,
            },
            { role: "user", content: textContent.slice(0, 2000) },
          ],
          temperature: 0,
          max_tokens: 8000,
        }),
      });
      if (!embResponse.ok) {
        return new Response(JSON.stringify({ error: "Embedding generation failed" }), {
          status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const embData = await embResponse.json();
      const embText = embData.choices?.[0]?.message?.content?.trim();
      if (!embText) {
        return new Response(JSON.stringify({ error: "Empty embedding response" }), {
          status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const numbers = embText.split(",").map((n: string) => parseFloat(n.trim())).filter((n: number) => !isNaN(n));
      while (numbers.length < 768) numbers.push(0);
      if (numbers.length > 768) numbers.length = 768;
      const magnitude = Math.sqrt(numbers.reduce((s: number, n: number) => s + n * n, 0));
      const normalized = magnitude > 0 ? numbers.map((n: number) => n / magnitude) : numbers;
      return new Response(JSON.stringify({ embedding: normalized }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Determine which neurons to embed
    let query = supabase
      .from("neurons")
      .select("id, title")
      .order("created_at", { ascending: false })
      .limit(Math.min(batch_size, 100));

    if (episode_id) {
      // Embed all neurons from a specific episode
      query = supabase
        .from("neurons")
        .select("id, title")
        .eq("episode_id", episode_id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (userId && !isInternal) {
        query = query.eq("author_id", userId);
      }
    } else if (neuron_ids && Array.isArray(neuron_ids)) {
      query = query.in("id", neuron_ids.slice(0, 100));
    } else if (userId && !isInternal) {
      query = query.eq("author_id", userId);
    }

    const { data: neurons, error: nErr } = await query;
    if (nErr || !neurons?.length) {
      return new Response(JSON.stringify({ error: "No neurons found", embedded: 0 }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch blocks for each neuron to build content
    const neuronIds = neurons.map(n => n.id);
    const CHUNK = 200;
    const allBlocks: any[] = [];
    for (let i = 0; i < neuronIds.length; i += CHUNK) {
      const chunk = neuronIds.slice(i, i + CHUNK);
      const { data } = await supabase
        .from("neuron_blocks")
        .select("neuron_id, content, type")
        .in("neuron_id", chunk)
        .order("position", { ascending: true });
      if (data) allBlocks.push(...data);
    }

    const contentMap = new Map<number, string>();
    for (const block of allBlocks) {
      const existing = contentMap.get(block.neuron_id) || "";
      contentMap.set(block.neuron_id, existing + "\n" + block.content);
    }

    // Generate embeddings via Lovable AI
    let embeddedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process in batches of 5 for parallel execution
    const EMBED_BATCH = 5;
    for (let batchStart = 0; batchStart < neurons.length; batchStart += EMBED_BATCH) {
      const batch = neurons.slice(batchStart, batchStart + EMBED_BATCH);
      
      const batchResults = await Promise.allSettled(batch.map(async (neuron) => {
        const content = `${neuron.title}\n${contentMap.get(neuron.id) || ""}`.trim();
        if (!content || content.length < 10) return "skip";

        const contentHash = btoa(content.slice(0, 200)).slice(0, 32);

        // Check if embedding already exists with same content
        const { data: existing } = await supabase
          .from("neuron_embeddings")
          .select("content_hash")
          .eq("neuron_id", neuron.id)
          .eq("model", "text-embedding-004")
          .single();

        if (existing?.content_hash === contentHash) return "skip";

        const embResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `You are a semantic embedding generator. Given content, output EXACTLY 768 comma-separated floating point numbers between -1 and 1 that represent the semantic meaning of the content. Output ONLY the numbers, no other text. The numbers should capture: topic, sentiment, complexity, domain, abstraction level, and key concepts.`,
              },
              { role: "user", content: content.slice(0, 4000) },
            ],
            temperature: 0,
            max_tokens: 8000,
          }),
        });

        if (!embResponse.ok) throw new Error(`AI error ${embResponse.status}`);

        const embData = await embResponse.json();
        const embText = embData.choices?.[0]?.message?.content?.trim();
        if (!embText) throw new Error("empty response");

        const numbers = embText.split(",").map((n: string) => parseFloat(n.trim())).filter((n: number) => !isNaN(n));
        while (numbers.length < 768) numbers.push(0);
        if (numbers.length > 768) numbers.length = 768;

        const magnitude = Math.sqrt(numbers.reduce((s: number, n: number) => s + n * n, 0));
        const normalized = magnitude > 0 ? numbers.map((n: number) => n / magnitude) : numbers;

        const vectorStr = `[${normalized.join(",")}]`;
        await supabase.from("neuron_embeddings").upsert({
          neuron_id: neuron.id,
          embedding: vectorStr,
          content_hash: contentHash,
          model: "text-embedding-004",
        }, { onConflict: "neuron_id,model" });

        return "embedded";
      }));

      for (let i = 0; i < batchResults.length; i++) {
        const r = batchResults[i];
        if (r.status === "fulfilled") {
          if (r.value === "embedded") embeddedCount++;
          else if (r.value === "skip") skippedCount++;
        } else {
          errors.push(`Neuron ${batch[i].id}: ${r.reason}`);
        }
      }
    }

    // Debit embedding credits atomically (1 credit per neuron embedded)
    if (embeddedCount > 0 && userId) {
      const creditCost = embeddedCount;
      const { data: reserved } = await supabase.rpc("reserve_neurons", {
        _user_id: userId,
        _amount: creditCost,
        _description: `RESERVE: Embedding: ${embeddedCount} neuron(s)`,
      });
      if (reserved) {
        await supabase.rpc("settle_neurons", {
          _user_id: userId,
          _amount: creditCost,
          _description: `SETTLE: Embedding: ${embeddedCount} neuron(s)`,
        });
      }
    }

    return new Response(JSON.stringify({
      embedded: embeddedCount,
      total: neurons.length,
      skipped: skippedCount,
      credits_charged: embeddedCount > 0 ? embeddedCount : 0,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("embed-neurons error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
