// batch-generate-prompts
// Processes a small batch (default 8) of services per invocation.
// Designed to be called by pg_cron every minute OR manually by admin.
// Picks the oldest pending services and generates YAML for each (sequential to respect rate limits).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const BATCH_SIZE = 4;

// Reuse the same system prompt as generate-service-prompt (kept inline for isolation)
const SYSTEM_PROMPT = `You are a senior AI prompt engineer producing PRODUCTION-GRADE YAML execution specs for an AI knowledge-extraction OS.
Output MUST be a single valid YAML document (no markdown fences, no commentary).
Use EXTENDED CHAIN-OF-THOUGHT schema with: spec_version, service_key, display_name, category, language=ro, role, objective,
inputs (required+optional), reasoning_chain (5-10 steps with step/name/instruction/expected_output/self_check),
execution_steps, output_schema (valid JSON Schema), quality_gates (verifiable),
edge_cases, fallbacks, validation_rules, security_rules (always include prompt-injection refusal + no PII leak + no system prompt leak),
forbidden_outputs, examples, metadata (estimated_tokens, recommended_model, temperature, max_output_tokens).
Romanian for user-facing text. Output ONLY YAML. No prose.`;

async function generateYaml(svc: any, model: string): Promise<string> {
  const userMsg = `Generate the YAML execution spec for:
service_key: ${svc.service_key}
name: ${svc.name}
category: ${svc.category}
service_class: ${svc.service_class}
credits_cost: ${svc.credits_cost}
description: |
  ${(svc.description || "—").slice(0, 800)}
existing_input_schema: ${JSON.stringify(svc.input_schema ?? [])}
existing_deliverables_schema: ${JSON.stringify(svc.deliverables_schema ?? [])}
Produce the full YAML now.`;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      reasoning: { effort: "medium" },
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  const yaml = data?.choices?.[0]?.message?.content as string | undefined;
  if (!yaml || yaml.length < 200) throw new Error("YAML too short");
  return yaml.replace(/^```ya?ml\s*/i, "").replace(/```\s*$/m, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const job_id = body.job_id as string | undefined;
    const limit = Math.min(Number(body.batch_size) || BATCH_SIZE, 20);

    // Find or create active job
    let job: any = null;
    if (job_id) {
      const { data } = await admin.from("prompt_generation_jobs").select("*").eq("id", job_id).maybeSingle();
      job = data;
    } else {
      const { data } = await admin.from("prompt_generation_jobs")
        .select("*").in("status", ["queued", "running"])
        .order("created_at", { ascending: true }).limit(1).maybeSingle();
      job = data;
    }

    if (!job) {
      return new Response(JSON.stringify({ ok: true, message: "No active job" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (job.status === "paused" || job.status === "done" || job.status === "failed") {
      return new Response(JSON.stringify({ ok: true, status: job.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark running on first run
    if (job.status === "queued") {
      await admin.from("prompt_generation_jobs").update({
        status: "running", started_at: new Date().toISOString(),
      }).eq("id", job.id);
    }

    // Pick services that don't have a done prompt yet
    const { data: existing } = await admin
      .from("prompt_registry")
      .select("linked_service_key")
      .eq("generation_status", "done")
      .not("linked_service_key", "is", null);
    const doneKeys = new Set((existing ?? []).map((r: any) => r.linked_service_key));

    let q = admin.from("service_catalog")
      .select("service_key, name, description, category, service_class, credits_cost, input_schema, deliverables_schema")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(limit + doneKeys.size); // overfetch then filter
    const { data: candidates } = await q;
    const todo = (candidates ?? []).filter((s: any) => !doneKeys.has(s.service_key)).slice(0, limit);

    if (todo.length === 0) {
      await admin.from("prompt_generation_jobs").update({
        status: "done", completed_at: new Date().toISOString(),
      }).eq("id", job.id);
      return new Response(JSON.stringify({ ok: true, message: "Job complete", job_id: job.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let success = 0, failed = 0, lastKey = job.last_processed_service_key;
    for (const svc of todo) {
      const promptId = `svc:${svc.service_key}`;
      try {
        await admin.from("prompt_registry").upsert({
          id: promptId,
          purpose: `Execution spec for ${svc.name}`,
          category: svc.category || "general",
          core_prompt: "(generating...)",
          generation_status: "generating",
          linked_service_key: svc.service_key,
          generation_model: job.model,
        }, { onConflict: "id" });

        const yaml = await generateYaml(svc, job.model);

        await admin.from("prompt_registry").update({
          core_prompt: yaml,
          yaml_spec: yaml,
          generation_status: "done",
          generated_at: new Date().toISOString(),
          generation_error: null,
        }).eq("id", promptId);
        success++;
        lastKey = svc.service_key;
      } catch (e) {
        const msg = (e as Error).message;
        failed++;
        await admin.from("prompt_registry").update({
          generation_status: "failed",
          generation_error: msg.slice(0, 500),
        }).eq("id", promptId);
        // If rate limited / billing issue, stop the batch and pause job
        if (msg === "RATE_LIMIT" || msg === "PAYMENT_REQUIRED") {
          await admin.from("prompt_generation_jobs").update({
            status: "paused",
            processed_count: job.processed_count + success + failed,
            success_count: job.success_count + success,
            failed_count: job.failed_count + failed,
            last_processed_service_key: lastKey,
            metadata: { ...(job.metadata ?? {}), pause_reason: msg, paused_at: new Date().toISOString() },
          }).eq("id", job.id);
          return new Response(JSON.stringify({ ok: false, paused: true, reason: msg, success, failed }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    await admin.from("prompt_generation_jobs").update({
      processed_count: job.processed_count + success + failed,
      success_count: job.success_count + success,
      failed_count: job.failed_count + failed,
      last_processed_service_key: lastKey,
    }).eq("id", job.id);

    return new Response(JSON.stringify({
      ok: true, job_id: job.id, batch_processed: success + failed, success, failed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("batch-generate-prompts error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
