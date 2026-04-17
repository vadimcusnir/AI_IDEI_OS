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

REQUIRED TOP-LEVEL HEADER (relational registry, MUST be first):
  id: <PRM-XXXXX provided>
  classification:
    domain: <content|seo|branding|sales|ai|research|automation|analysis|production|extraction|orchestration|publishing|general>
    function: <extract|analyze|generate|summarize|classify|rewrite|plan|audit>
    input_type: <transcript|text|image|audio|url|pdf|mixed>
    output_type: <entities|quotes|summary|article|report|prompt|strategy|framework>
  cluster: <semantic_cluster_slug>
  version: "1.0"
  status: active
  complexity: <atomic|modular|system>
  language: ro
  scoring: { utility_score: 1-10, revenue_score: 1-10 }

THEN extended chain-of-thought schema: spec_version, service_key, display_name, category, role, objective,
inputs (required+optional), reasoning_chain (5-10 steps with step/name/instruction/expected_output/self_check),
execution_steps, output_schema (valid JSON Schema), quality_gates (verifiable),
edge_cases, fallbacks, validation_rules, security_rules (always include prompt-injection refusal + no PII leak + no system prompt leak),
forbidden_outputs, examples, metadata (estimated_tokens, recommended_model, temperature, max_output_tokens).
Romanian for user-facing text. Output ONLY YAML. No prose.`;

// Heuristic classification from service metadata
function classify(svc: any): {
  domain: string; function: string; input_type: string; output_type: string; cluster: string;
} {
  const cat = (svc.category || "general").toLowerCase();
  const name = (svc.name || "").toLowerCase();
  const desc = (svc.description || "").toLowerCase();
  const blob = `${name} ${desc}`;

  // function
  let fn = "generate";
  if (cat === "extraction" || /extract|pull|harvest/.test(blob)) fn = "extract";
  else if (cat === "analysis" || /analy|audit|score|evaluat/.test(blob)) fn = "analyze";
  else if (/summari|rezuma/.test(blob)) fn = "summarize";
  else if (/classif|categor/.test(blob)) fn = "classify";
  else if (/rewrite|rephrase|reformul/.test(blob)) fn = "rewrite";
  else if (/plan|strategy|roadmap|funnel|campaign/.test(blob)) fn = "plan";
  else if (/audit/.test(blob)) fn = "audit";

  // input
  let input_type = "mixed";
  if (/transcript|podcast|interview/.test(blob)) input_type = "transcript";
  else if (/image|photo|visual/.test(blob)) input_type = "image";
  else if (/audio|voice/.test(blob)) input_type = "audio";
  else if (/url|link|web/.test(blob)) input_type = "url";
  else if (/pdf|document/.test(blob)) input_type = "pdf";
  else if (/text|content/.test(blob)) input_type = "text";

  // output
  let output_type = "report";
  if (/quote/.test(blob)) output_type = "quotes";
  else if (/entit|person|brand/.test(blob)) output_type = "entities";
  else if (/summary|rezuma/.test(blob)) output_type = "summary";
  else if (/article|post|blog/.test(blob)) output_type = "article";
  else if (/prompt/.test(blob)) output_type = "prompt";
  else if (/strateg/.test(blob)) output_type = "strategy";
  else if (/framework|funnel|pipeline/.test(blob)) output_type = "framework";

  return { domain: cat, function: fn, input_type, output_type, cluster: cat };
}

async function generateYaml(svc: any, model: string, prm_id: string): Promise<string> {
  const c = classify(svc);
  const userMsg = `Generate the YAML execution spec for:
HEADER (use exactly):
  id: ${prm_id}
  classification:
    domain: ${c.domain}
    function: ${c.function}
    input_type: ${c.input_type}
    output_type: ${c.output_type}
  cluster: ${c.cluster}
  version: "1.0"
  status: active
  language: ro
  scoring: { utility_score: 7, revenue_score: 6 }

SERVICE:
service_key: ${svc.service_key}
name: ${svc.name}
category: ${svc.category}
service_class: ${svc.service_class}
credits_cost: ${svc.credits_cost}
description: |
  ${(svc.description || "—").slice(0, 800)}
existing_input_schema: ${JSON.stringify(svc.input_schema ?? [])}
existing_deliverables_schema: ${JSON.stringify(svc.deliverables_schema ?? [])}
Produce the full YAML now (header first, then full spec).`;
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

    // Pick pending services using set-difference (avoid huge overfetch)
    const { data: existing } = await admin
      .from("prompt_registry")
      .select("linked_service_key")
      .eq("generation_status", "done")
      .not("linked_service_key", "is", null);
    const doneKeys = new Set((existing ?? []).map((r: any) => r.linked_service_key));

    // Fetch a small window and filter; if all done, advance the window
    let todo: any[] = [];
    let offset = 0;
    while (todo.length < limit && offset < 500) {
      const { data: candidates } = await admin.from("service_catalog")
        .select("service_key, name, description, category, service_class, credits_cost, input_schema, deliverables_schema")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .range(offset, offset + 49);
      if (!candidates || candidates.length === 0) break;
      for (const c of candidates) {
        if (!doneKeys.has(c.service_key)) todo.push(c);
        if (todo.length >= limit) break;
      }
      offset += 50;
    }

    if (todo.length === 0) {
      await admin.from("prompt_generation_jobs").update({
        status: "done", completed_at: new Date().toISOString(),
      }).eq("id", job.id);
      return new Response(JSON.stringify({ ok: true, message: "Job complete", job_id: job.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark all as generating up-front
    await admin.from("prompt_registry").upsert(
      todo.map((svc: any) => ({
        id: `svc:${svc.service_key}`,
        purpose: `Execution spec for ${svc.name}`,
        category: svc.category || "general",
        core_prompt: "(generating...)",
        generation_status: "generating",
        linked_service_key: svc.service_key,
        generation_model: job.model,
      })),
      { onConflict: "id" }
    );

    // Process in PARALLEL — Lovable AI Gateway handles concurrency
    let pauseReason: string | null = null;
    const results = await Promise.allSettled(todo.map(async (svc: any) => {
      const yaml = await generateYaml(svc, job.model);
      return { svc, yaml };
    }));

    let success = 0, failed = 0, lastKey = job.last_processed_service_key;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const svc = todo[i];
      const promptId = `svc:${svc.service_key}`;
      if (r.status === "fulfilled") {
        await admin.from("prompt_registry").update({
          core_prompt: r.value.yaml,
          yaml_spec: r.value.yaml,
          generation_status: "done",
          generated_at: new Date().toISOString(),
          generation_error: null,
        }).eq("id", promptId);
        success++;
        lastKey = svc.service_key;
      } else {
        const msg = (r.reason as Error)?.message || "unknown";
        failed++;
        await admin.from("prompt_registry").update({
          generation_status: "failed",
          generation_error: msg.slice(0, 500),
        }).eq("id", promptId);
        if (msg === "RATE_LIMIT" || msg === "PAYMENT_REQUIRED") pauseReason = msg;
      }
    }

    if (pauseReason) {
      await admin.from("prompt_generation_jobs").update({
        status: "paused",
        processed_count: job.processed_count + success + failed,
        success_count: job.success_count + success,
        failed_count: job.failed_count + failed,
        last_processed_service_key: lastKey,
        metadata: { ...(job.metadata ?? {}), pause_reason: pauseReason, paused_at: new Date().toISOString() },
      }).eq("id", job.id);
      return new Response(JSON.stringify({ ok: false, paused: true, reason: pauseReason, success, failed }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
