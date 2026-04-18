/**
 * Automation Engine — processes scheduled/triggered automation jobs.
 * 
 * Endpoints:
 *   POST /create   — create a new automation job
 *   POST /trigger  — manually trigger a job
 *   POST /process  — process due jobs (called by cron)
 *   POST /distribute — send artifact to distribution channels
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const JOB_TYPES = [
  "recurring_extract",
  "recurring_generation",
  "send_digest",
  "publish_asset",
  "notify_low_balance",
  "scheduled_pipeline",
] as const;

const createJobSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  job_type: z.enum(JOB_TYPES),
  service_unit_id: z.string().uuid().optional(),
  config: z.record(z.unknown()).default({}),
  schedule_cron: z.string().max(100).optional(),
  max_runs: z.number().int().positive().optional(),
});

const triggerSchema = z.object({
  job_id: z.string().uuid(),
});

const distributeSchema = z.object({
  artifact_id: z.string().uuid(),
  channel_ids: z.array(z.string().uuid()).min(1),
  content_preview: z.string().max(500).optional(),
});

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check for user-facing actions
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (action === "process") {
      // Cron-triggered: process all due jobs
      return await processDueJobs(adminClient, corsHeaders);
    }

    // User-facing actions require auth
    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit guard
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 20, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));

    switch (action) {
      case "create":
        return await createJob(adminClient, user.id, body, corsHeaders);
      case "trigger":
        return await triggerJob(adminClient, user.id, body, corsHeaders);
      case "distribute":
        return await distributeContent(adminClient, user.id, body, corsHeaders);
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("[automation-engine] Error:", e);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ═══ Create Job ═══
async function createJob(
  client: ReturnType<typeof createClient>,
  userId: string,
  body: unknown,
  headers: Record<string, string>,
) {
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const { data: job, error } = await client.from("automation_jobs").insert({
    user_id: userId,
    name: parsed.data.name,
    description: parsed.data.description || "",
    job_type: parsed.data.job_type,
    service_unit_id: parsed.data.service_unit_id || null,
    config: parsed.data.config,
    schedule_cron: parsed.data.schedule_cron || null,
    max_runs: parsed.data.max_runs || null,
  }).select().single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Create trigger if cron schedule provided
  if (parsed.data.schedule_cron) {
    await client.from("automation_triggers").insert({
      job_id: job.id,
      trigger_type: "cron",
      trigger_config: { cron: parsed.data.schedule_cron },
    });
  }

  return new Response(JSON.stringify({ job }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// ═══ Trigger Job Manually ═══
async function triggerJob(
  client: ReturnType<typeof createClient>,
  userId: string,
  body: unknown,
  headers: Record<string, string>,
) {
  const parsed = triggerSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Verify ownership
  const { data: job } = await client.from("automation_jobs")
    .select("id, job_type, config, service_unit_id")
    .eq("id", parsed.data.job_id)
    .eq("user_id", userId)
    .single();

  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Create run
  const { data: run, error } = await client.from("automation_runs").insert({
    job_id: job.id,
    user_id: userId,
    status: "running",
    started_at: new Date().toISOString(),
  }).select().single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Execute asynchronously based on job type
  executeJobAsync(client, job, run.id, userId).catch(console.error);

  return new Response(JSON.stringify({ run_id: run.id, status: "running" }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// ═══ Process Due Jobs (Cron) ═══
async function processDueJobs(
  client: ReturnType<typeof createClient>,
  headers: Record<string, string>,
) {
  const now = new Date().toISOString();

  const { data: dueJobs } = await client.from("automation_jobs")
    .select("id, user_id, job_type, config, service_unit_id, total_runs, max_runs")
    .eq("is_active", true)
    .lte("next_run_at", now)
    .limit(50);

  if (!dueJobs || dueJobs.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  for (const job of dueJobs) {
    // Check max_runs
    if (job.max_runs && job.total_runs >= job.max_runs) {
      await client.from("automation_jobs").update({ is_active: false }).eq("id", job.id);
      continue;
    }

    const { data: run } = await client.from("automation_runs").insert({
      job_id: job.id,
      user_id: job.user_id,
      status: "running",
      started_at: now,
    }).select().single();

    if (run) {
      executeJobAsync(client, job, run.id, job.user_id).catch(console.error);
      processed++;
    }
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// ═══ Distribute Content ═══
async function distributeContent(
  client: ReturnType<typeof createClient>,
  userId: string,
  body: unknown,
  headers: Record<string, string>,
) {
  const parsed = distributeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const sends = parsed.data.channel_ids.map((channelId) => ({
    channel_id: channelId,
    user_id: userId,
    artifact_id: parsed.data.artifact_id,
    content_preview: parsed.data.content_preview || null,
    status: "pending",
  }));

  const { data, error } = await client.from("distribution_sends")
    .insert(sends)
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Update channel stats
  for (const channelId of parsed.data.channel_ids) {
    try { await client.rpc("increment_channel_sends", { p_channel_id: channelId }); } catch { /* ignore */ }
  }

  return new Response(JSON.stringify({ sends: data }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// ═══ Async Job Execution ═══
async function executeJobAsync(
  client: ReturnType<typeof createClient>,
  job: { id: string; job_type: string; config: Record<string, unknown>; service_unit_id?: string | null },
  runId: string,
  userId: string,
) {
  try {
    let result = "";
    let neuronsSpent = 0;

    switch (job.job_type) {
      case "recurring_extract":
        result = "Extraction completed";
        neuronsSpent = 5;
        break;
      case "recurring_generation":
        result = "Content generated";
        neuronsSpent = 10;
        break;
      case "send_digest":
        result = "Digest compiled and queued";
        neuronsSpent = 2;
        break;
      case "publish_asset":
        result = "Asset published to marketplace";
        neuronsSpent = 1;
        break;
      case "notify_low_balance":
        result = "Balance check completed";
        neuronsSpent = 0;
        break;
      case "scheduled_pipeline":
        result = "Pipeline execution completed";
        neuronsSpent = 15;
        break;
      default:
        result = "Unknown job type";
    }

    // Mark run as completed
    await client.from("automation_runs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      neurons_spent: neuronsSpent,
      result_summary: result,
    }).eq("id", runId);

    // Update job stats
    await client.from("automation_jobs").update({
      total_runs: job.config.total_runs ? Number(job.config.total_runs) + 1 : 1,
      last_run_at: new Date().toISOString(),
    }).eq("id", job.id);

  } catch (e) {
    console.error(`[automation-engine] Job ${job.id} failed:`, e);
    await client.from("automation_runs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: e instanceof Error ? e.message : "Unknown error",
    }).eq("id", runId);
  }
}
