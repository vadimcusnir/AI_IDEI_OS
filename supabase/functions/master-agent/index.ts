import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sanitizeUserInput } from "../_shared/sanitize-prompt.ts";
import { reportError } from "../_shared/error-reporter.ts";
import { buildBoundedMessages } from "../_shared/prompt-boundary.ts";
import {
  getTierLimits,
  economyPreFlight,
  safetyCheck,
  loadExecutionMemory,
  buildExecutionPlan,
  applyScoreVerdicts,
  createKernelLog,
  type KernelState,
  type ExecutionPlan,
} from "../_shared/kernel-modules.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(system: string, prompt: string, json = true, userId?: string): Promise<any> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const { messages } = buildBoundedMessages({
    system,
    userParts: [{ label: "task_input", content: prompt, maxLen: 20000 }],
    alertSourceFn: "master-agent",
    userId,
  });

  const body: any = {
    model: "google/gemini-2.5-flash",
    messages,
  };
  if (json) body.response_format = { type: "json_object" };

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

function jsonRes(req: Request, body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, svcKey);

  // ═══ AUTH ═══
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonRes(req, { error: "Unauthorized" }, 401);

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authErr || !user) return jsonRes(req, { error: "Invalid token" }, 401);

  // Rate limit (user-based, post-auth)
  const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
  if (rateLimited) return rateLimited;

  const kernel = createKernelLog();

  try {
    const { source_content, user_goal: rawGoal, monetization_mode = true, execution_depth = "standard" } = await req.json();
    const user_goal = sanitizeUserInput(rawGoal || "", 2000);

    if (!source_content || source_content.trim().length < 50) {
      return jsonRes(req, { status: "NO_DATA_AVAILABLE", reason: "Source content too short (min 50 chars)" });
    }

    // ═══════════════════════════════════════
    // KERNEL GATE 1 — SAFETY GUARD
    // ═══════════════════════════════════════
    kernel.log("safety_guard", "PLANNING", "running");
    const safety = await safetyCheck(supabase, user.id);
    if (!safety.allowed) {
      kernel.log("safety_guard", "FAILED", "blocked", { reason: safety.reason });
      return jsonRes(req, { status: "BLOCKED", reason: safety.reason, throttle_seconds: safety.throttle_seconds }, 429);
    }
    kernel.log("safety_guard", "PLANNING", "passed");

    // ═══════════════════════════════════════
    // KERNEL GATE 2 — TIER RESOLUTION
    // ═══════════════════════════════════════
    kernel.log("tier_resolution", "PLANNING", "running");
    const { data: accessState } = await supabase
      .from("access_window_state")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();

    const userTier = accessState?.tier || "free";
    const tierLimits = getTierLimits(userTier);
    kernel.log("tier_resolution", "PLANNING", "resolved", { tier: userTier, limits: tierLimits });

    // ═══════════════════════════════════════
    // KERNEL GATE 3 — MEMORY SYSTEM
    // ═══════════════════════════════════════
    kernel.log("memory_load", "PLANNING", "running");
    const memory = await loadExecutionMemory(supabase, user.id);
    kernel.log("memory_load", "PLANNING", "loaded", { runs: memory.total_runs, priority_services: memory.successful_services.length });

    // ═══════════════════════════════════════
    // KERNEL GATE 4 — PLANNER
    // ═══════════════════════════════════════
    kernel.log("planner", "PLANNING", "running");
    const plan = buildExecutionPlan(tierLimits, memory, 200, execution_depth);
    kernel.log("planner", "PLANNING", "plan_ready", { strategy: plan.strategy, estimated_cost: plan.estimated_cost, max_services: plan.max_services, max_assets: plan.max_assets });

    // ═══════════════════════════════════════
    // KERNEL GATE 5 — ECONOMY CONTROLLER
    // ═══════════════════════════════════════
    kernel.log("economy_controller", "PLANNING", "running");
    const economy = await economyPreFlight(supabase, user.id, plan.estimated_cost, userTier);
    if (!economy.allowed) {
      kernel.log("economy_controller", "FAILED", "blocked", { reason: economy.reason, deficit: economy.deficit });
      return jsonRes(req, {
        status: "INSUFFICIENT_BALANCE",
        reason: economy.reason,
        estimated_cost: economy.estimated_cost,
        balance: economy.balance,
        deficit: economy.deficit,
        tier_discount_pct: economy.tier_discount_pct,
        steps: kernel.getSteps(),
      }, 402);
    }
    kernel.log("economy_controller", "PLANNING", "approved", { cost: economy.estimated_cost, balance: economy.balance, discount: economy.tier_discount_pct });

    // ═══════════════════════════════════════
    // RESERVE NEURONS (ATOMIC)
    // ═══════════════════════════════════════
    kernel.log("reserve_neurons", "PLANNING", "running");
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: economy.estimated_cost,
    });
    if (reserveErr || !reserved) {
      kernel.log("reserve_neurons", "FAILED", "reserve_failed", { error: reserveErr?.message });
      return jsonRes(req, { status: "RESERVE_FAILED", reason: "Could not reserve neurons", steps: kernel.getSteps() }, 402);
    }
    kernel.log("reserve_neurons", "PLANNING", "reserved", { amount: economy.estimated_cost });

    let settled = false;

    try {
      // ═══════════════════════════════════════
      // STEP 1 — NEURON EXTRACTION
      // ═══════════════════════════════════════
      kernel.log("neuron_extraction", "EXECUTING", "running");
      const neurons = await callAI(
        `You are a knowledge extraction engine. Extract atomic knowledge units from the provided content. Return JSON with "neurons" array. Each neuron: { "id": "n_001", "type": "insight|pattern|tactic|framework", "content": "...", "confidence": "high|medium" }. Extract exactly ${plan.neuron_target} neurons. Focus on actionable, monetizable knowledge.`,
        `CONTENT:\n${source_content.slice(0, 8000)}\n\nGOAL: ${user_goal || "Extract all valuable knowledge"}`
      );

      if (!neurons?.neurons || neurons.neurons.length < 10) {
        kernel.log("neuron_extraction", "FAILED", "insufficient", { count: neurons?.neurons?.length || 0 });
        throw new Error("NO_DATA_AVAILABLE: Insufficient neurons (<10)");
      }
      kernel.log("neuron_extraction", "EXECUTING", "completed", { count: neurons.neurons.length });

      // ═══════════════════════════════════════
      // STEP 2 — PATTERN SYNTHESIS
      // ═══════════════════════════════════════
      kernel.log("pattern_synthesis", "EXECUTING", "running");
      const clusters = await callAI(
        `You are a pattern synthesis engine. Group neurons into thematic clusters. Return JSON with "clusters" array. Each cluster: { "cluster_id": "c_001", "theme": "...", "neuron_ids": ["n_001",...], "pattern_type": "strategy|funnel|narrative|system" }. Create 3-8 clusters.`,
        `NEURONS:\n${JSON.stringify(neurons.neurons)}`
      );
      kernel.log("pattern_synthesis", "EXECUTING", "completed", { count: clusters?.clusters?.length || 0 });

      // ═══════════════════════════════════════
      // STEP 3 — SERVICE MATCHING (with memory boost)
      // ═══════════════════════════════════════
      kernel.log("service_matching", "EXECUTING", "running");
      const { data: catalog } = await supabase
        .from("service_catalog")
        .select("service_key, name, credits_cost, category, description, service_class, domain, complexity")
        .eq("is_active", true)
        .order("credits_cost")
        .limit(200);

      const themes = (clusters?.clusters || []).map((c: any) => c.theme).join(", ");
      const memoryHint = memory.successful_services.length > 0
        ? `\nPRIORITY SERVICES (historically successful): ${memory.successful_services.join(", ")}`
        : "";
      const blockHint = plan.blocked_services.length > 0
        ? `\nAVOID SERVICES (historically failed): ${plan.blocked_services.join(", ")}`
        : "";

      const serviceMatch = await callAI(
        `You are a service matching engine. Select the most relevant services. Return JSON with "selected_services" array. Each: { "service_key": "...", "class": "OTOS|MMS|LCSS", "relevance_score": 0.0-1.0, "reason": "..." }. Select max ${plan.max_services} services total. Only use service_keys from the catalog. Maximize revenue/cost ratio.${memoryHint}${blockHint}`,
        `THEMES: ${themes}\nGOAL: ${user_goal || "Maximize asset generation"}\n\nAVAILABLE SERVICES:\n${JSON.stringify((catalog || []).slice(0, 100).map(s => ({ key: s.service_key, name: s.name, class: s.service_class, domain: s.domain, cost: s.credits_cost })))}`
      );
      const selectedServices = (serviceMatch?.selected_services || []).slice(0, plan.max_services);
      kernel.log("service_matching", "EXECUTING", "completed", { count: selectedServices.length, capped_by_tier: plan.max_services });

      // ═══════════════════════════════════════
      // STEP 4 — SERVICE COMPOSITION
      // ═══════════════════════════════════════
      kernel.log("service_composition", "EXECUTING", "running");
      const executionPlan = selectedServices.map((svc: any, i: number) => ({
        step_id: `step_${i + 1}`,
        service_key: svc.service_key,
        class: svc.class,
        input_dependency: i === 0 ? "source_content" : `step_${i}`,
        output_target: `output_${i + 1}`,
      }));
      kernel.log("service_composition", "EXECUTING", "completed", { steps: executionPlan.length });

      // ═══════════════════════════════════════
      // STEP 5 — EXECUTION (with retry)
      // ═══════════════════════════════════════
      kernel.log("execution", "EXECUTING", "running");
      const rawOutputs: any[] = [];
      const neuronSummary = neurons.neurons.slice(0, 10).map((n: any) => n.content).join("\n");
      const failedServiceKeys: string[] = [];

      for (const step of executionPlan) {
        const svcInfo = (catalog || []).find((s: any) => s.service_key === step.service_key);
        let success = false;
        let lastError = "";

        // Retry up to 2 times
        for (let attempt = 0; attempt < 2 && !success; attempt++) {
          try {
            const output = await callAI(
              `You are an AI service execution engine. Execute the service on the provided knowledge. Return JSON with "output": { "title": "...", "content": "...", "type": "..." }. Generate professional, monetizable content.`,
              `SERVICE: ${svcInfo?.name || step.service_key} (${svcInfo?.description || "AI service"})\nINPUT KNOWLEDGE:\n${neuronSummary}\nGOAL: ${user_goal || "Generate professional output"}`
            );
            rawOutputs.push({ service_key: step.service_key, ...output?.output, attempt });
            success = true;
          } catch (e) {
            lastError = String(e);
            console.error(`Execution attempt ${attempt + 1} failed for ${step.service_key}:`, e);
            if (String(e).includes("RATE_LIMITED")) {
              // Wait before retry on rate limit
              await new Promise(r => setTimeout(r, 5000));
            }
          }
        }

        if (!success) {
          rawOutputs.push({ service_key: step.service_key, error: lastError });
          failedServiceKeys.push(step.service_key);
        }
      }
      kernel.log("execution", "EXECUTING", "completed", { total: rawOutputs.length, failed: failedServiceKeys.length });

      // ═══════════════════════════════════════
      // STEP 6 — ASSET GENERATION (capped by tier)
      // ═══════════════════════════════════════
      kernel.log("asset_generation", "SCORING", "running");
      const successOutputs = rawOutputs.filter(o => !o.error);

      const assetTarget = Math.min(plan.max_assets, 30);
      const assets = await callAI(
        `You are an asset generation engine. Transform outputs into monetizable assets. Return JSON with "assets" array. Each: { "type": "prompt_pack|framework|content_pack|strategy|funnel|template|checklist|guide", "title": "...", "description": "...", "content": "...", "price_estimate_usd": N }. Generate ${Math.min(10, assetTarget)}-${assetTarget} assets. Prices between 2-92 USD (Root2: digit sum=2).`,
        `OUTPUTS:\n${JSON.stringify(successOutputs)}\nNEURONS:\n${JSON.stringify(neurons.neurons.slice(0, 15))}\nGOAL: ${user_goal || "Maximize monetization"}`
      );
      const generatedAssets = (assets?.assets || []).slice(0, plan.max_assets);
      kernel.log("asset_generation", "SCORING", "completed", { generated: generatedAssets.length, cap: plan.max_assets });

      // ═══════════════════════════════════════
      // STEP 7 — QUALITY SCORING (Scorer Engine)
      // ═══════════════════════════════════════
      kernel.log("quality_scoring", "SCORING", "running");
      const scoredRaw = await callAI(
        `You are a quality scoring engine. Score each asset on 3 metrics (0-1): determinism, economic_value, reusability. Return JSON with "scored_assets" array. Each: { "index": N, "scores": { "determinism": 0.X, "economic_value": 0.X, "reusability": 0.X }, "final_score": 0.X }. final_score = average.`,
        `ASSETS:\n${JSON.stringify(generatedAssets.map((a: any, i: number) => ({ index: i, title: a.title, type: a.type })))}`
      );

      const scoredAssets = applyScoreVerdicts(scoredRaw?.scored_assets || []);
      const accepted = scoredAssets.filter(s => s.verdict === "accept");
      const rejected = scoredAssets.filter(s => s.verdict === "reject");
      const qualifiedAssets = generatedAssets.filter((_: any, i: number) => {
        const score = scoredAssets.find(s => s.index === i);
        return !score || score.verdict === "accept";
      });

      kernel.log("quality_scoring", "SCORING", "completed", { accepted: accepted.length, rejected: rejected.length, total: scoredAssets.length });

      if (qualifiedAssets.length < 5) {
        kernel.log("quality_scoring", "SCORING", "warning", { reason: `Only ${qualifiedAssets.length} qualified assets` });
      }

      // ═══════════════════════════════════════
      // STEP 8 — MARKETPLACE PACKAGING
      // ═══════════════════════════════════════
      kernel.log("marketplace_packaging", "PACKAGING", "running");
      const marketplaceItems: any[] = [];

      if (monetization_mode) {
        for (const asset of qualifiedAssets.slice(0, plan.max_assets)) {
          const preview = asset.content ? asset.content.slice(0, Math.floor(asset.content.length * 0.2)) : "";
          const priceNeurons = Math.round((asset.price_estimate_usd || 11) * 500);

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
            marketplaceItems.push({ id: inserted.id, title: asset.title, type: asset.type, price_neurons: priceNeurons });
          }
        }
      }
      kernel.log("marketplace_packaging", "PACKAGING", "completed", { items: marketplaceItems.length });

      // ═══════════════════════════════════════
      // STEP 9 — AUTO-SERVICE GENERATION
      // ═══════════════════════════════════════
      kernel.log("auto_service_generation", "MONETIZING", "running");
      const newServices = await callAI(
        `You are a service generation engine. Generate 1-3 NEW service definitions. Return JSON with "new_services" array. Each: { "service_key": "auto-xxx-yyy", "name": "...", "description": "...", "class": "OTOS|MMS", "domain": "...", "complexity": "low|medium|high", "credits_cost": N }. credits_cost between 290-1450 (Root2).`,
        `PATTERNS:\n${JSON.stringify(clusters?.clusters || [])}\nEXISTING (avoid):\n${(catalog || []).slice(0, 50).map((s: any) => s.service_key).join(", ")}`
      );

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
            is_active: false,
            execution_mode: "async",
          });
        if (!svcErr) generatedServices.push(svc);
      }
      kernel.log("auto_service_generation", "MONETIZING", "completed", { count: generatedServices.length });

      // ═══════════════════════════════════════
      // STEP 10 — IDEA RANK SCORING
      // ═══════════════════════════════════════
      kernel.log("idea_rank_scoring", "MONETIZING", "running");
      const ranking = [
        ...marketplaceItems.map((m: any, idx: number) => ({
          entity_id: m.id, type: "asset", title: m.title,
          score: scoredAssets.find(s => s.index === idx)?.final_score || 0.75,
        })),
        ...generatedServices.map((s: any, i: number) => ({
          entity_id: s.service_key, type: "service", title: s.name,
          score: 0.8 - i * 0.05,
        })),
      ].sort((a, b) => b.score - a.score);
      kernel.log("idea_rank_scoring", "MONETIZING", "completed", { ranked: ranking.length });

      // ═══════════════════════════════════════
      // STEP 11 — DECISION ENGINE (Layer 3)
      // Converts execution results into scored action blueprint
      // ═══════════════════════════════════════
      kernel.log("decision_engine", "SCORING", "running");
      let decisionBlueprint: any = null;
      try {
        const decisionFindings = [
          {
            type: "execution_summary",
            source: "master_agent",
            data: {
              neurons_extracted: neurons.neurons.length,
              clusters_formed: clusters?.clusters?.length || 0,
              services_matched: selectedServices.length,
              services_failed: failedServiceKeys.length,
              assets_generated: qualifiedAssets.length,
              assets_rejected: rejected.length,
              cost_charged: economy.estimated_cost,
            },
          },
          {
            type: "quality_analysis",
            source: "scorer",
            data: {
              accepted_count: accepted.length,
              rejected_count: rejected.length,
              avg_score: accepted.length > 0
                ? accepted.reduce((s: number, a: any) => s + a.final_score, 0) / accepted.length
                : 0,
              score_distribution: scoredAssets.map((s: any) => ({
                index: s.index,
                score: s.final_score,
                verdict: s.verdict,
              })),
            },
          },
          {
            type: "service_performance",
            source: "executor",
            data: {
              selected: selectedServices.map((s: any) => s.service_key),
              failed: failedServiceKeys,
              success_rate: selectedServices.length > 0
                ? (selectedServices.length - failedServiceKeys.length) / selectedServices.length
                : 0,
            },
          },
          ...(failedServiceKeys.length > 0 ? [{
            type: "failure_analysis",
            source: "executor",
            data: {
              failed_services: failedServiceKeys,
              recovery_suggestion: "retry_with_different_model_or_skip",
            },
          }] : []),
        ];

        decisionBlueprint = await callAI(
          `You are the Decision Engine for AI-IDEI. Analyze the master-agent execution results and produce a scored action blueprint.

SCORING (1-10):
- clarity: How clear and actionable are outputs?
- redundancy: How much overlap between assets?
- visual_consistency: How uniform is the output quality?
- conversion_impact: Revenue potential of generated assets
- technical_integrity: Execution reliability

Return JSON:
{
  "system_state": {
    "total_assets": N,
    "quality_pass_rate": 0.0-1.0,
    "service_success_rate": 0.0-1.0,
    "cost_efficiency": 0.0-1.0
  },
  "structural_verdict": "coherent|overfragmented|inconsistent",
  "quality_verdict": "high|medium|low",
  "commercial_verdict": "high_conversion|medium|leaking",
  "decisions": [
    {
      "action": "retry|merge|enhance|remove|reprice",
      "priority": "P0|P1|P2",
      "target": "...",
      "reason": "...",
      "scores": { "clarity": N, "redundancy": N, "visual_consistency": N, "conversion_impact": N, "technical_integrity": N },
      "final_score": N,
      "method": ["step1", "step2"],
      "estimated_effort": "trivial|small|medium|large"
    }
  ],
  "compression_actions": ["merge X into Y", "..."],
  "next_run_recommendations": {
    "services_to_prioritize": ["..."],
    "services_to_avoid": ["..."],
    "optimal_depth": "quick|standard|full",
    "estimated_improvement_pct": N
  }
}
Max 10 decisions. Be decisive, not descriptive.`,
          `EXECUTION FINDINGS:\n${JSON.stringify(decisionFindings, null, 1).slice(0, 8000)}`
        );
        kernel.log("decision_engine", "SCORING", "completed", {
          decisions: decisionBlueprint?.decisions?.length || 0,
          verdict: decisionBlueprint?.commercial_verdict || "unknown",
        });
      } catch (decisionErr) {
        console.error("Decision engine phase failed (non-critical):", decisionErr);
        kernel.log("decision_engine", "SCORING", "failed", { error: String(decisionErr) });
      }

      // ═══════════════════════════════════════
      // SETTLE NEURONS (SUCCESS)
      // ═══════════════════════════════════════
      kernel.log("settle_neurons", "COMPLETED", "running");
      await supabase.rpc("settle_neurons", {
        _user_id: user.id,
        _amount: economy.estimated_cost,
      });
      settled = true;
      kernel.log("settle_neurons", "COMPLETED", "settled", { amount: economy.estimated_cost });

      // ═══════════════════════════════════════
      // STORE EXECUTION + MEMORY
      // ═══════════════════════════════════════
      const executionResult = {
        neuron_count: neurons.neurons.length,
        cluster_count: clusters?.clusters?.length || 0,
        services_matched: selectedServices.length,
        assets_generated: qualifiedAssets.length,
        marketplace_items: marketplaceItems.length,
        new_services: generatedServices.length,
        cost_charged: economy.estimated_cost,
        tier: userTier,
        strategy: plan.strategy,
        top_services: selectedServices.map((s: any) => s.service_key),
        failed_service_keys: failedServiceKeys,
      };

      const { data: job } = await supabase.from("neuron_jobs").insert({
        author_id: user.id,
        worker_type: "master_agent",
        status: "completed",
        input: { source_length: source_content.length, user_goal, execution_depth, monetization_mode, plan },
        result: executionResult,
        completed_at: new Date().toISOString(),
      }).select("id").single();

      // Store in user_memory for learning loop
      await supabase.from("user_memory").insert({
        user_id: user.id,
        category: "master_agent_run",
        memory_key: `run_${job?.id || Date.now()}`,
        memory_value: {
          services_used: selectedServices.map((s: any) => s.service_key),
          assets_count: qualifiedAssets.length,
          avg_score: accepted.length > 0 ? accepted.reduce((sum: number, s: any) => sum + s.final_score, 0) / accepted.length : 0,
          strategy: plan.strategy,
        },
        source: "master_agent",
      }).catch(() => {}); // non-critical

      // FINAL RESPONSE
      return jsonRes(req, {
        status: "COMPLETED",
        job_id: job?.id,
        kernel: {
          tier: userTier,
          strategy: plan.strategy,
          cost_charged: economy.estimated_cost,
          tier_discount_pct: economy.tier_discount_pct,
          safety: "passed",
          memory_runs: memory.total_runs,
          state_flow: kernel.getSteps().map(s => s.state),
        },
        summary: {
          neurons_extracted: neurons.neurons.length,
          clusters_formed: clusters?.clusters?.length || 0,
          services_matched: selectedServices.length,
          services_executed: rawOutputs.length,
          services_failed: failedServiceKeys.length,
          assets_generated: qualifiedAssets.length,
          assets_rejected: rejected.length,
          marketplace_drafts: marketplaceItems.length,
          new_services_created: generatedServices.length,
          top_ranked: ranking.slice(0, 5),
        },
        decision_blueprint: decisionBlueprint || null,
        neurons: neurons.neurons,
        clusters: clusters?.clusters || [],
        selected_services: selectedServices,
        execution_plan: executionPlan,
        assets: qualifiedAssets.map((a: any) => ({ title: a.title, type: a.type, price_usd: a.price_estimate_usd })),
        marketplace_items: marketplaceItems,
        new_services: generatedServices,
        ranking: ranking.slice(0, 10),
        scored_assets: scoredAssets,
        steps: kernel.getSteps(),
      });

    } catch (innerErr) {
      // ═══ RELEASE NEURONS ON FAILURE ═══
      if (!settled) {
        kernel.log("release_neurons", "FAILED", "releasing");
        await supabase.rpc("release_neurons", {
          _user_id: user.id,
          _amount: economy.estimated_cost,
        }).catch(() => {});
        kernel.log("release_neurons", "FAILED", "released", { amount: economy.estimated_cost });
      }

      // Store failed job for memory
      await supabase.from("neuron_jobs").insert({
        author_id: user.id,
        worker_type: "master_agent",
        status: "failed",
        input: { source_length: source_content.length, user_goal, execution_depth, plan },
        result: { error: String(innerErr), steps: kernel.getSteps() },
        completed_at: new Date().toISOString(),
      }).catch(() => {});

      throw innerErr;
    }

  } catch (err) {
    console.error("Master agent error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (msg === "RATE_LIMITED") {
      return jsonRes(req, { error: "Rate limited. Try again in 30 seconds.", steps: kernel.getSteps() }, 429);
    }
    if (msg === "CREDITS_EXHAUSTED") {
      return jsonRes(req, { error: "AI credits exhausted. Please add funds.", steps: kernel.getSteps() }, 402);
    }
    if (msg.startsWith("NO_DATA_AVAILABLE")) {
      return jsonRes(req, { status: "NO_DATA_AVAILABLE", reason: msg, steps: kernel.getSteps() });
    }
    // Wave 5 — alert on unexpected failures (skip rate-limit/credit-exhaustion/no-data = expected)
    await reportError(err, {
      functionName: "master-agent",
      alert: { severity: "high", serviceKey: "master-agent", impactScope: "10-step autonomous production engine", recommendedAction: "Check kernel.getSteps() output, verify economy gates and AI provider quotas." },
    });

    return jsonRes(req, { error: msg, steps: kernel.getSteps() }, 500);
  }
});
