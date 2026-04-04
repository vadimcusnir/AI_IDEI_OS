import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

/*
 * Agent Orchestrator — chains 4 specialized pipeline agents:
 *   1. EXTRACT  — neurons from episode/content
 *   2. STRUCTURE — organize neurons, build relations
 *   3. GENERATE — run AI services on structured neurons
 *   4. MONETIZE — package artifacts as marketplace assets
 *
 * Each stage is idempotent and reports progress via the agent_actions / agent_steps tables.
 */

const InputSchema = z.object({
  episode_id: z.string().uuid().optional(),
  neuron_ids: z.array(z.number()).optional(),
  stages: z.array(z.enum(["extract", "structure", "generate", "monetize"])).default(["extract", "structure", "generate", "monetize"]),
  generate_service_key: z.string().optional(),
  monetize_config: z.object({
    price_neurons: z.number().optional(),
    license_type: z.string().optional(),
  }).optional(),
});

type Stage = "extract" | "structure" | "generate" | "monetize";

interface StageResult {
  stage: Stage;
  status: "completed" | "failed" | "skipped";
  duration_ms: number;
  output: Record<string, unknown>;
  error?: string;
}

async function runExtract(
  supabaseUrl: string, serviceKey: string, userId: string, episodeId: string
): Promise<StageResult> {
  const start = Date.now();
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/extract-neurons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ episode_id: episodeId, user_id: userId }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    return { stage: "extract", status: "completed", duration_ms: Date.now() - start, output: data };
  } catch (e) {
    return { stage: "extract", status: "failed", duration_ms: Date.now() - start, output: {}, error: e instanceof Error ? e.message : "unknown" };
  }
}

async function runStructure(
  supabaseUrl: string, serviceKey: string, userId: string, neuronIds?: number[]
): Promise<StageResult> {
  const start = Date.now();
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/structure-neurons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(neuronIds?.length ? { neuron_ids: neuronIds } : {}),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    return { stage: "structure", status: "completed", duration_ms: Date.now() - start, output: data };
  } catch (e) {
    return { stage: "structure", status: "failed", duration_ms: Date.now() - start, output: {}, error: e instanceof Error ? e.message : "unknown" };
  }
}

async function runGenerate(
  supabaseAdmin: any, userId: string, serviceKey: string, neuronIds: number[]
): Promise<StageResult> {
  const start = Date.now();
  try {
    if (!serviceKey) {
      return { stage: "generate", status: "skipped", duration_ms: 0, output: { reason: "no service_key provided" } };
    }
    // Lookup service
    const { data: svc } = await supabaseAdmin.from("service_catalog")
      .select("id, service_key, credits_cost").eq("service_key", serviceKey).eq("is_active", true).maybeSingle();
    if (!svc) throw new Error(`Service '${serviceKey}' not found`);

    // Check credits
    const { data: credits } = await supabaseAdmin.from("user_credits").select("balance").eq("user_id", userId).maybeSingle();
    if (!credits || credits.balance < svc.credits_cost) {
      throw new Error(`Insufficient credits: need ${svc.credits_cost}, have ${credits?.balance || 0}`);
    }

    // Create job for first neuron (or batch)
    const jobs: string[] = [];
    const targetNeuron = neuronIds[0];
    const { data: job, error } = await supabaseAdmin.from("neuron_jobs").insert({
      author_id: userId, worker_type: serviceKey, status: "pending",
      neuron_id: targetNeuron, params: { neuron_ids: neuronIds },
    }).select("id").single();
    if (error) throw new Error(error.message);
    jobs.push(job.id);

    // Reserve credits
    await supabaseAdmin.rpc("reserve_credits", { _user_id: userId, _amount: svc.credits_cost, _job_id: job.id });

    return { stage: "generate", status: "completed", duration_ms: Date.now() - start, output: { job_ids: jobs, credits_reserved: svc.credits_cost } };
  } catch (e) {
    return { stage: "generate", status: "failed", duration_ms: Date.now() - start, output: {}, error: e instanceof Error ? e.message : "unknown" };
  }
}

async function runMonetize(
  supabaseAdmin: any, userId: string, neuronIds: number[], config?: { price_neurons?: number; license_type?: string }
): Promise<StageResult> {
  const start = Date.now();
  try {
    if (!neuronIds.length) {
      return { stage: "monetize", status: "skipped", duration_ms: 0, output: { reason: "no neurons to monetize" } };
    }

    // Create a knowledge asset draft from the neurons
    const { data: neurons } = await supabaseAdmin.from("neurons")
      .select("id, title, tags, content_category, score")
      .in("id", neuronIds).order("score", { ascending: false });

    if (!neurons?.length) throw new Error("No neurons found");

    const topNeuron = neurons[0];
    const { data: asset, error } = await supabaseAdmin.from("knowledge_assets").insert({
      creator_id: userId,
      title: `Asset: ${topNeuron.title}`,
      description: `Auto-generated from ${neurons.length} structured neurons`,
      asset_type: "framework",
      content: JSON.stringify({ neuron_ids: neuronIds, source_neurons: neurons.map((n: any) => ({ id: n.id, title: n.title })) }),
      price_neurons: config?.price_neurons || 50,
      status: "draft",
      tags: topNeuron.tags || [],
    }).select("id").single();

    if (error) throw new Error(error.message);

    return { stage: "monetize", status: "completed", duration_ms: Date.now() - start, output: { asset_id: asset.id, neuron_count: neurons.length } };
  } catch (e) {
    return { stage: "monetize", status: "failed", duration_ms: Date.now() - start, output: {}, error: e instanceof Error ? e.message : "unknown" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const { episode_id, neuron_ids: inputNeuronIds, stages, generate_service_key, monetize_config } = parsed.data;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create tracking action
    const { data: action } = await supabaseAdmin.from("agent_actions").insert({
      user_id: user.id, session_id: "orchestrator", intent_key: "pipeline_orchestration",
      intent_confidence: 1.0, status: "running",
      total_credits_estimated: 0,
      input_summary: `Pipeline: ${stages.join(" → ")}`,
    }).select("id").single();
    const actionId = action?.id;

    // Create steps
    if (actionId) {
      await supabaseAdmin.from("agent_steps").insert(
        stages.map((s, i) => ({ action_id: actionId, step_order: i, tool_name: s, label: s.charAt(0).toUpperCase() + s.slice(1), credits_cost: 0, status: "pending" }))
      );
    }

    const results: StageResult[] = [];
    let currentNeuronIds = inputNeuronIds || [];
    let failed = false;

    for (const stage of stages) {
      if (failed) {
        results.push({ stage, status: "skipped", duration_ms: 0, output: { reason: "previous stage failed" } });
        continue;
      }

      // Mark step running
      if (actionId) {
        await supabaseAdmin.from("agent_steps").update({ status: "running", started_at: new Date().toISOString() })
          .eq("action_id", actionId).eq("tool_name", stage);
      }

      let result: StageResult;

      switch (stage) {
        case "extract": {
          if (!episode_id) {
            result = { stage: "extract", status: "skipped", duration_ms: 0, output: { reason: "no episode_id" } };
          } else {
            result = await runExtract(supabaseUrl, serviceRoleKey, user.id, episode_id);
            // Collect newly created neuron IDs
            if (result.status === "completed" && result.output.neurons) {
              currentNeuronIds = (result.output.neurons as any[]).map((n: any) => n.id);
            }
          }
          break;
        }
        case "structure":
          result = await runStructure(supabaseUrl, serviceRoleKey, user.id, currentNeuronIds);
          break;
        case "generate":
          result = await runGenerate(supabaseAdmin, user.id, generate_service_key || "", currentNeuronIds);
          break;
        case "monetize":
          result = await runMonetize(supabaseAdmin, user.id, currentNeuronIds, monetize_config);
          break;
        default:
          result = { stage, status: "skipped", duration_ms: 0, output: { reason: "unknown stage" } };
      }

      results.push(result);

      // Mark step done
      if (actionId) {
        await supabaseAdmin.from("agent_steps").update({
          status: result.status === "completed" ? "completed" : "failed",
          completed_at: new Date().toISOString(),
          duration_ms: result.duration_ms,
          output_data: result.output,
          error_message: result.error || null,
        }).eq("action_id", actionId).eq("tool_name", stage);
      }

      if (result.status === "failed") failed = true;
    }

    // Finalize action
    const allCompleted = results.every(r => r.status === "completed" || r.status === "skipped");
    if (actionId) {
      await supabaseAdmin.from("agent_actions").update({
        status: allCompleted ? "completed" : "failed",
        completed_at: new Date().toISOString(),
        result_summary: JSON.stringify(results.map(r => ({ stage: r.stage, status: r.status }))),
      }).eq("id", actionId);

      await supabaseAdmin.from("agent_action_history").insert({
        user_id: user.id, intent_key: "pipeline_orchestration",
        success: allCompleted, total_steps: stages.length,
        completed_steps: results.filter(r => r.status === "completed").length,
        total_credits: results.reduce((s, r) => s + ((r.output as any).credits_reserved || 0), 0),
      });
    }

    const totalDuration = results.reduce((s, r) => s + r.duration_ms, 0);

    return new Response(JSON.stringify({
      success: allCompleted,
      action_id: actionId,
      total_duration_ms: totalDuration,
      stages: results,
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

  } catch (e) {
    console.error("agent-orchestrator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
