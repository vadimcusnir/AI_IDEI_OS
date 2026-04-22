import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * run-pipeline — IMF Multiplication Pipeline
 * Takes a trigger event + data and executes a sequence of services.
 * Enables: 1 extraction → 50+ deliverables automatically.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Rate limit guard
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 5, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { pipeline_id, trigger_data, neuron_id } = body;

    if (!pipeline_id || typeof pipeline_id !== "string") {
      return new Response(JSON.stringify({ error: "Missing pipeline_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const steps = Array.isArray(pipeline.steps) ? pipeline.steps : [];
    if (steps.length === 0) {
      return new Response(JSON.stringify({ error: "Pipeline has no steps" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Group steps by parallel_group — steps with same group run concurrently
    // Steps without a group run sequentially
    interface StepGroup {
      groupId: string | null;
      steps: Array<{ step: any; index: number }>;
    }

    const stepGroups: StepGroup[] = [];
    let currentGroup: StepGroup | null = null;

    steps.forEach((step: any, idx: number) => {
      const groupId = step.parallel_group || null;
      if (groupId && currentGroup && currentGroup.groupId === groupId) {
        currentGroup.steps.push({ step, index: idx });
      } else {
        const newGroup: StepGroup = { groupId, steps: [{ step, index: idx }] };
        currentGroup = newGroup;
        stepGroups.push(newGroup);
      }
    });

    // Execute step groups — sequential between groups, parallel within groups
    const results: any[] = new Array(steps.length).fill(null);
    let stepsCompleted = 0;

    for (const group of stepGroups) {
      const executeStep = async (stepEntry: { step: any; index: number }): Promise<any> => {
        const { step, index: stepIdx } = stepEntry;
        const maxRetries = step.max_retries ?? 2;
        const svc = serviceMap.get(step.service_key);
        if (!svc) {
          return { service_key: step.service_key, status: "skipped", reason: "service not found" };
        }

        // Regime enforcement
        const regime = await getRegimeConfig(step.service_key);
        const blockReason = checkRegimeBlock(regime, svc.credits_cost || 0);
        if (blockReason) {
          return { service_key: step.service_key, status: "blocked", reason: blockReason };
        }
        if (regime.dryRun) {
          return { service_key: step.service_key, status: "dry_run", reason: "Simulation mode" };
        }

        // Retry loop with exponential backoff
        let lastError = "";
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          if (attempt > 0) {
            // Exponential backoff: 2s, 4s, 8s...
            const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
            await new Promise(r => setTimeout(r, delay));
          }

          try {
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
              lastError = "neuron creation failed";
              continue;
            }

            // Build inputs
            const stepInputs: Record<string, string> = {};
            if (step.input_mapping && typeof step.input_mapping === "object") {
              for (const [key, source] of Object.entries(step.input_mapping)) {
                if (typeof source === "string" && source.startsWith("trigger.")) {
                  stepInputs[key] = trigger_data?.[source.replace("trigger.", "")] || "";
                } else if (typeof source === "string" && source.startsWith("prev.")) {
                  const prevIdx = parseInt(source.replace("prev.", ""), 10);
                  stepInputs[key] = results[prevIdx]?.content?.slice(0, 10000) || "";
                } else {
                  stepInputs[key] = String(source);
                }
              }
            } else {
              stepInputs.context = JSON.stringify(trigger_data || {});
            }

            const { data: job } = await supabase
              .from("neuron_jobs")
              .insert({
                neuron_id: neuron.id,
                author_id: user.id,
                worker_type: step.service_key,
                status: "pending",
                input: stepInputs,
                priority: steps.length - stepIdx,
              })
              .select("id")
              .single();

            if (!job) {
              lastError = "job creation failed";
              continue;
            }

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
              lastError = errBody.error || `HTTP ${resp.status}`;
              // Don't retry on 4xx client errors (except 429)
              if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
                return { service_key: step.service_key, status: "failed", reason: lastError, job_id: job.id, attempts: attempt + 1 };
              }
              continue;
            }

            // Read stream
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

            return {
              service_key: step.service_key,
              status: "completed",
              job_id: job.id,
              neuron_id: neuron.id,
              content_length: content.length,
              content: content.slice(0, 500),
              attempts: attempt + 1,
            };
          } catch (stepErr) {
            lastError = stepErr instanceof Error ? stepErr.message : "Unknown";
            // Continue to next retry attempt
          }
        }

        // All retries exhausted
        return {
          service_key: step.service_key,
          status: "failed",
          reason: `Exhausted ${maxRetries + 1} attempts: ${lastError}`,
          attempts: maxRetries + 1,
        };
      };

      // Execute group: parallel if >1 step, sequential if 1
      if (group.steps.length > 1 && group.groupId) {
        const groupResults = await Promise.allSettled(
          group.steps.map(s => executeStep(s))
        );
        groupResults.forEach((r, i) => {
          const stepIdx = group.steps[i].index;
          results[stepIdx] = r.status === "fulfilled" ? r.value : { status: "error", reason: "Promise rejected" };
          if (results[stepIdx]?.status === "completed") stepsCompleted++;
        });
      } else {
        for (const stepEntry of group.steps) {
          const result = await executeStep(stepEntry);
          results[stepEntry.index] = result;
          if (result.status === "completed") stepsCompleted++;

          // If step failed and has stop_on_failure flag, abort remaining steps in group
          if (result.status === "failed" && stepEntry.step.stop_on_failure) {
            break;
          }
        }
      }

      // Update progress after each group
      await supabase
        .from("imf_pipeline_runs")
        .update({ steps_completed: stepsCompleted })
        .eq("id", run.id);
    }

    // Finalize pipeline run
    const allCompleted = results.filter(Boolean).every((r: any) => r.status === "completed");
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
        .filter((r: any) => r?.status === "completed")
        .reduce((sum: number, r: any) => {
          const svc = serviceMap.get(r.service_key);
          return sum + (svc ? svc.credits_cost : 0);
        }, 0),
      results,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-pipeline error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
