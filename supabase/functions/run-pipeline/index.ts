/**
 * run-pipeline — IMF Multiplication Pipeline
 * Takes a trigger event + data and executes a sequence of services.
 * Enables: 1 extraction → 50+ deliverables automatically.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { pipeline_id, trigger_data, neuron_id } = body;

    if (!pipeline_id || typeof pipeline_id !== "string") {
      return new Response(JSON.stringify({ error: "Missing pipeline_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch pipeline definition
    const { data: pipeline, error: pipeErr } = await supabase
      .from("imf_pipelines")
      .select("*")
      .eq("id", pipeline_id)
      .eq("is_active", true)
      .single();

    if (pipeErr || !pipeline) {
      return new Response(JSON.stringify({ error: "Pipeline not found or inactive" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const steps = Array.isArray(pipeline.steps) ? pipeline.steps : [];
    if (steps.length === 0) {
      return new Response(JSON.stringify({ error: "Pipeline has no steps" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate total credits needed
    const serviceKeys = steps.map((s: any) => s.service_key).filter(Boolean);
    const { data: services } = await supabase
      .from("service_catalog")
      .select("service_key, credits_cost, name")
      .in("service_key", serviceKeys);

    const serviceMap = new Map((services || []).map((s: any) => [s.service_key, s]));
    const totalCost = steps.reduce((sum: number, step: any) => {
      const svc = serviceMap.get(step.service_key);
      return sum + (svc ? svc.credits_cost : 0);
    }, 0);

    // Check credits
    const { data: userCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!userCredits || userCredits.balance < totalCost) {
      return new Response(JSON.stringify({
        error: "Insufficient credits for full pipeline",
        required: totalCost,
        available: userCredits?.balance || 0,
      }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create pipeline run record
    const { data: run, error: runErr } = await supabase
      .from("imf_pipeline_runs")
      .insert({
        pipeline_id,
        user_id: user.id,
        trigger_data: trigger_data || {},
        status: "running",
        total_steps: steps.length,
        steps_completed: 0,
      })
      .select("id")
      .single();

    if (runErr || !run) {
      return new Response(JSON.stringify({ error: "Failed to create pipeline run" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute steps sequentially — each step creates a job
    const results: any[] = [];
    let stepsCompleted = 0;

    for (const step of steps) {
      const svc = serviceMap.get(step.service_key);
      if (!svc) {
        results.push({ service_key: step.service_key, status: "skipped", reason: "service not found" });
        continue;
      }

      // ── Regime enforcement per step ──
      const regime = await getRegimeConfig(step.service_key);
      const blockReason = checkRegimeBlock(regime, svc.credits_cost || 0);
      if (blockReason) {
        results.push({ service_key: step.service_key, status: "blocked", reason: blockReason });
        continue;
      }

      if (regime.dryRun) {
        results.push({ service_key: step.service_key, status: "dry_run", reason: "Simulation mode — no real execution" });
        continue;
      }

      try {
        // Create neuron for this step's output
        const { data: neuron } = await supabase
          .from("neurons")
          .insert({
            author_id: user.id,
            title: `${svc.name} — Pipeline ${pipeline.name}`,
            status: "draft",
            lifecycle: "ingested",
          })
          .select("id")
          .single();

        if (!neuron) {
          results.push({ service_key: step.service_key, status: "failed", reason: "neuron creation failed" });
          continue;
        }

        // Build inputs from trigger_data + step input_mapping
        const stepInputs: Record<string, string> = {};
        if (step.input_mapping && typeof step.input_mapping === "object") {
          for (const [key, source] of Object.entries(step.input_mapping)) {
            if (typeof source === "string" && source.startsWith("trigger.")) {
              const triggerKey = source.replace("trigger.", "");
              stepInputs[key] = trigger_data?.[triggerKey] || "";
            } else if (typeof source === "string" && source.startsWith("prev.")) {
              // Use previous step's result
              const prevIdx = parseInt(source.replace("prev.", ""), 10);
              stepInputs[key] = results[prevIdx]?.content?.slice(0, 10000) || "";
            } else {
              stepInputs[key] = String(source);
            }
          }
        } else {
          // Default: pass all trigger_data as context
          stepInputs.context = JSON.stringify(trigger_data || {});
        }

        // Create job
        const { data: job } = await supabase
          .from("neuron_jobs")
          .insert({
            neuron_id: neuron.id,
            author_id: user.id,
            worker_type: step.service_key,
            status: "pending",
            input: stepInputs,
            priority: steps.length - stepsCompleted, // Higher priority for earlier steps
          })
          .select("id")
          .single();

        if (!job) {
          results.push({ service_key: step.service_key, status: "failed", reason: "job creation failed" });
          continue;
        }

        // Execute via run-service internally
        const resp = await fetch(`${supabaseUrl}/functions/v1/run-service`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            job_id: job.id,
            service_key: step.service_key,
            neuron_id: neuron.id,
            inputs: stepInputs,
          }),
        });

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({ error: "Unknown" }));
          results.push({ service_key: step.service_key, status: "failed", reason: errBody.error, job_id: job.id });
          continue;
        }

        // Read the stream to collect result
        let content = "";
        if (resp.body) {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let nlIdx: number;
            while ((nlIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, nlIdx);
              buffer = buffer.slice(nlIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const d = line.slice(6).trim();
              if (d === "[DONE]") continue;
              try {
                const parsed = JSON.parse(d);
                const c = parsed.choices?.[0]?.delta?.content;
                if (c) content += c;
              } catch { /* partial */ }
            }
          }
        }

        stepsCompleted++;
        results.push({
          service_key: step.service_key,
          status: "completed",
          job_id: job.id,
          neuron_id: neuron.id,
          content_length: content.length,
          content: content.slice(0, 500), // Preview only for pipeline result
        });

        // Update pipeline run progress
        await supabase
          .from("imf_pipeline_runs")
          .update({ steps_completed: stepsCompleted })
          .eq("id", run.id);

      } catch (stepErr) {
        results.push({
          service_key: step.service_key,
          status: "error",
          reason: stepErr instanceof Error ? stepErr.message : "Unknown",
        });
      }
    }

    // Finalize pipeline run
    const allCompleted = results.every((r) => r.status === "completed");
    await supabase
      .from("imf_pipeline_runs")
      .update({
        status: allCompleted ? "completed" : "partial",
        steps_completed: stepsCompleted,
        result: { steps: results },
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return new Response(JSON.stringify({
      pipeline_run_id: run.id,
      status: allCompleted ? "completed" : "partial",
      steps_completed: stepsCompleted,
      total_steps: steps.length,
      total_credits_spent: results
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => {
          const svc = serviceMap.get(r.service_key);
          return sum + (svc ? svc.credits_cost : 0);
        }, 0),
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-pipeline error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
