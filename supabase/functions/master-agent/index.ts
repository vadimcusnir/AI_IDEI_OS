import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(system: string, prompt: string, json = true): Promise<any> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  };

  if (json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("AI error:", res.status, t);
    if (res.status === 429) throw new Error("RATE_LIMITED");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`AI_ERROR_${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!json) return content;

  try {
    return JSON.parse(content);
  } catch {
    console.error("Failed to parse AI JSON:", content.slice(0, 500));
    throw new Error("AI_PARSE_ERROR");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { source_content, user_goal, monetization_mode = true, execution_depth = "standard" } = await req.json();

    if (!source_content || source_content.trim().length < 50) {
      return new Response(JSON.stringify({ status: "NO_DATA_AVAILABLE", reason: "Source content too short (min 50 chars)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const steps: any[] = [];
    const log = (step: string, status: string, data?: any) => {
      steps.push({ step, status, timestamp: new Date().toISOString(), ...(data || {}) });
    };

    // ═══════════════════════════════════════
    // STEP 1 — NEURON EXTRACTION
    // ═══════════════════════════════════════
    log("neuron_extraction", "running");

    const neuronCount = execution_depth === "quick" ? 15 : execution_depth === "full" ? 40 : 25;

    const neurons = await callAI(
      `You are a knowledge extraction engine. Extract atomic knowledge units from the provided content. Return JSON with "neurons" array. Each neuron: { "id": "n_001", "type": "insight|pattern|tactic|framework", "content": "...", "confidence": "high|medium" }. Extract exactly ${neuronCount} neurons. Focus on actionable, monetizable knowledge.`,
      `CONTENT:\n${source_content.slice(0, 8000)}\n\nGOAL: ${user_goal || "Extract all valuable knowledge"}`
    );

    if (!neurons?.neurons || neurons.neurons.length < 10) {
      log("neuron_extraction", "failed", { count: neurons?.neurons?.length || 0 });
      return new Response(JSON.stringify({ status: "NO_DATA_AVAILABLE", reason: "Insufficient neurons extracted (<10)", steps }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("neuron_extraction", "completed", { count: neurons.neurons.length });

    // ═══════════════════════════════════════
    // STEP 2 — PATTERN SYNTHESIS
    // ═══════════════════════════════════════
    log("pattern_synthesis", "running");

    const clusters = await callAI(
      `You are a pattern synthesis engine. Group neurons into thematic clusters. Return JSON with "clusters" array. Each cluster: { "cluster_id": "c_001", "theme": "...", "neuron_ids": ["n_001",...], "pattern_type": "strategy|funnel|narrative|system" }. Create 3-8 clusters.`,
      `NEURONS:\n${JSON.stringify(neurons.neurons)}`
    );

    log("pattern_synthesis", "completed", { count: clusters?.clusters?.length || 0 });

    // ═══════════════════════════════════════
    // STEP 3 — SERVICE MATCHING
    // ═══════════════════════════════════════
    log("service_matching", "running");

    const { data: catalog } = await supabase
      .from("service_catalog")
      .select("service_key, name, credits_cost, category, description, service_class, domain, complexity")
      .eq("is_active", true)
      .order("credits_cost")
      .limit(200);

    const themes = (clusters?.clusters || []).map((c: any) => c.theme).join(", ");

    const serviceMatch = await callAI(
      `You are a service matching engine. Given user themes and available services, select the most relevant ones. Return JSON with "selected_services" array. Each: { "service_key": "...", "class": "OTOS|MMS|LCSS", "relevance_score": 0.0-1.0, "reason": "..." }. Select 3-5 OTOS, 1-2 MMS, 0-1 LCSS. Only use service_keys from the catalog provided.`,
      `THEMES: ${themes}\nGOAL: ${user_goal || "Maximize asset generation"}\n\nAVAILABLE SERVICES:\n${JSON.stringify((catalog || []).map(s => ({ key: s.service_key, name: s.name, class: s.service_class, domain: s.domain, cost: s.credits_cost })))}`
    );

    log("service_matching", "completed", { count: serviceMatch?.selected_services?.length || 0 });

    // ═══════════════════════════════════════
    // STEP 4 — SERVICE COMPOSITION
    // ═══════════════════════════════════════
    log("service_composition", "running");

    const selectedServices = serviceMatch?.selected_services || [];

    const executionPlan = selectedServices.map((svc: any, i: number) => ({
      step_id: `step_${i + 1}`,
      service_key: svc.service_key,
      class: svc.class,
      input_dependency: i === 0 ? "source_content" : `step_${i}`,
      output_target: `output_${i + 1}`,
    }));

    log("service_composition", "completed", { steps_count: executionPlan.length });

    // ═══════════════════════════════════════
    // STEP 5 — EXECUTION (AI-simulated)
    // ═══════════════════════════════════════
    log("execution", "running");

    const rawOutputs: any[] = [];
    const neuronSummary = neurons.neurons.slice(0, 10).map((n: any) => n.content).join("\n");

    for (const plan of executionPlan.slice(0, 6)) {
      try {
        const svcInfo = (catalog || []).find((s: any) => s.service_key === plan.service_key);
        const output = await callAI(
          `You are an AI service execution engine. Execute the service described below on the provided knowledge. Return JSON with "output": { "title": "...", "content": "...", "type": "..." }. Generate professional, monetizable content.`,
          `SERVICE: ${svcInfo?.name || plan.service_key} (${svcInfo?.description || "AI service"})\nINPUT KNOWLEDGE:\n${neuronSummary}\nGOAL: ${user_goal || "Generate professional output"}`
        );
        rawOutputs.push({ service_key: plan.service_key, ...output?.output });
      } catch (e) {
        console.error(`Execution error for ${plan.service_key}:`, e);
        rawOutputs.push({ service_key: plan.service_key, error: String(e) });
      }
    }

    log("execution", "completed", { outputs: rawOutputs.length });

    // ═══════════════════════════════════════
    // STEP 6 — ASSET GENERATION
    // ═══════════════════════════════════════
    log("asset_generation", "running");

    const successOutputs = rawOutputs.filter(o => !o.error);

    const assets = await callAI(
      `You are an asset generation engine. Transform execution outputs into monetizable assets. Return JSON with "assets" array. Each asset: { "type": "prompt_pack|framework|content_pack|strategy|funnel|template|checklist|guide", "title": "...", "description": "...", "content": "...", "price_estimate_usd": N }. Generate 10-30 assets. Each must be standalone and marketplace-ready. Prices between 2-92 USD following Root2 (digit sum=2).`,
      `OUTPUTS:\n${JSON.stringify(successOutputs)}\nNEURONS:\n${JSON.stringify(neurons.neurons.slice(0, 15))}\nGOAL: ${user_goal || "Maximize monetization"}`
    );

    log("asset_generation", "completed", { count: assets?.assets?.length || 0 });

    // ═══════════════════════════════════════
    // STEP 7 — QUALITY SCORING
    // ═══════════════════════════════════════
    log("quality_scoring", "running");

    const scoredAssets = await callAI(
      `You are a quality scoring engine. Score each asset on 3 metrics (0-1): determinism, economic_value, reusability. Return JSON with "scored_assets" array. Each: { "index": N, "scores": { "determinism": 0.X, "economic_value": 0.X, "reusability": 0.X }, "final_score": 0.X }. final_score = average of 3 metrics.`,
      `ASSETS:\n${JSON.stringify((assets?.assets || []).map((a: any, i: number) => ({ index: i, title: a.title, type: a.type })))}`
    );

    const scores = scoredAssets?.scored_assets || [];
    const qualifiedAssets = (assets?.assets || []).filter((_: any, i: number) => {
      const score = scores.find((s: any) => s.index === i);
      return !score || score.final_score >= 0.7;
    });

    log("quality_scoring", "completed", { total: assets?.assets?.length || 0, qualified: qualifiedAssets.length });

    if (qualifiedAssets.length < 5) {
      log("quality_scoring", "warning", { reason: "Less than 5 qualified assets" });
    }

    // ═══════════════════════════════════════
    // STEP 8 — MARKETPLACE PACKAGING
    // ═══════════════════════════════════════
    log("marketplace_packaging", "running");

    const marketplaceItems: any[] = [];

    if (monetization_mode) {
      for (const asset of qualifiedAssets.slice(0, 20)) {
        const preview = asset.content ? asset.content.slice(0, Math.floor(asset.content.length * 0.2)) : "";
        const priceNeurons = Math.round((asset.price_estimate_usd || 11) * 500);

        // Insert as draft in knowledge_assets
        const { data: inserted, error: insertErr } = await supabase
          .from("knowledge_assets")
          .insert({
            creator_id: user.id,
            title: asset.title || "Untitled Asset",
            description: (asset.description || "").slice(0, 500),
            content: asset.content || "",
            asset_type: asset.type || "framework",
            price_neurons: priceNeurons,
            is_published: false,
            preview_content: preview,
            tags: [asset.type, "master-agent", "auto-generated"],
          })
          .select("id")
          .single();

        if (!insertErr && inserted) {
          marketplaceItems.push({
            id: inserted.id,
            title: asset.title,
            type: asset.type,
            price_neurons: priceNeurons,
            preview_length: preview.length,
          });
        }
      }
    }

    log("marketplace_packaging", "completed", { items: marketplaceItems.length });

    // ═══════════════════════════════════════
    // STEP 9 — AUTO-SERVICE GENERATION
    // ═══════════════════════════════════════
    log("auto_service_generation", "running");

    const newServices = await callAI(
      `You are a service generation engine. Based on discovered patterns, generate 1-3 NEW service definitions that don't exist in the catalog. Return JSON with "new_services" array. Each: { "service_key": "auto-xxx-yyy", "name": "...", "description": "...", "class": "OTOS|MMS", "domain": "...", "complexity": "low|medium|high", "credits_cost": N }. credits_cost between 290-1450. Make them unique and valuable.`,
      `PATTERNS:\n${JSON.stringify(clusters?.clusters || [])}\nEXISTING SERVICES (avoid duplicates):\n${(catalog || []).slice(0, 50).map((s: any) => s.service_key).join(", ")}`
    );

    // Insert new services as drafts
    const generatedServices: any[] = [];
    for (const svc of (newServices?.new_services || []).slice(0, 3)) {
      const { error: svcErr } = await supabase
        .from("service_catalog")
        .insert({
          service_key: svc.service_key,
          name: svc.name || "Auto-generated Service",
          description: svc.description || "",
          category: svc.domain || "auto-generated",
          domain: svc.domain || "auto",
          service_class: svc.class || "OTOS",
          complexity: svc.complexity || "medium",
          credits_cost: svc.credits_cost || 290,
          is_active: false, // Draft — needs admin approval
          execution_mode: "async",
        });

      if (!svcErr) {
        generatedServices.push(svc);
      }
    }

    log("auto_service_generation", "completed", { count: generatedServices.length });

    // ═══════════════════════════════════════
    // STEP 10 — IDEA RANK SCORING
    // ═══════════════════════════════════════
    log("idea_rank_scoring", "running");

    const ranking = [
      ...marketplaceItems.map((m: any) => ({
        entity_id: m.id,
        type: "asset",
        title: m.title,
        score: (scores.find((s: any) => s.index === marketplaceItems.indexOf(m))?.final_score || 0.75),
      })),
      ...generatedServices.map((s: any, i: number) => ({
        entity_id: s.service_key,
        type: "service",
        title: s.name,
        score: 0.8 - i * 0.05,
      })),
    ].sort((a, b) => b.score - a.score);

    log("idea_rank_scoring", "completed", { ranked: ranking.length });

    // ═══════════════════════════════════════
    // STORE EXECUTION RECORD
    // ═══════════════════════════════════════
    const { data: job } = await supabase.from("neuron_jobs").insert({
      author_id: user.id,
      worker_type: "master_agent",
      status: "completed",
      input: { source_length: source_content.length, user_goal, execution_depth, monetization_mode },
      result: {
        neuron_count: neurons.neurons.length,
        cluster_count: clusters?.clusters?.length || 0,
        services_matched: selectedServices.length,
        assets_generated: qualifiedAssets.length,
        marketplace_items: marketplaceItems.length,
        new_services: generatedServices.length,
      },
      completed_at: new Date().toISOString(),
    }).select("id").single();

    // FINAL RESPONSE
    return new Response(JSON.stringify({
      status: "COMPLETED",
      job_id: job?.id,
      summary: {
        neurons_extracted: neurons.neurons.length,
        clusters_formed: clusters?.clusters?.length || 0,
        services_matched: selectedServices.length,
        services_executed: rawOutputs.length,
        assets_generated: qualifiedAssets.length,
        marketplace_drafts: marketplaceItems.length,
        new_services_created: generatedServices.length,
        top_ranked: ranking.slice(0, 5),
      },
      neurons: neurons.neurons,
      clusters: clusters?.clusters || [],
      selected_services: selectedServices,
      execution_plan: executionPlan,
      assets: qualifiedAssets.map((a: any) => ({ title: a.title, type: a.type, price_usd: a.price_estimate_usd })),
      marketplace_items: marketplaceItems,
      new_services: generatedServices,
      ranking: ranking.slice(0, 10),
      steps,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Master agent error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (msg === "RATE_LIMITED") {
      return new Response(JSON.stringify({ error: "Rate limited. Try again in 30 seconds." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (msg === "CREDITS_EXHAUSTED") {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
