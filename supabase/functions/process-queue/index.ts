/**
 * process-queue — Processes pending jobs with retry logic + execution regime enforcement.
 * Called via pg_cron or manual trigger.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Allow internal calls only (via pg_cron or admin)
  const internalSecret = req.headers.get("x-internal-secret");
  const authHeader = req.headers.get("authorization") || "";
  let isAuthorized = false;

  // Check internal secret
  const { data: configSecret } = await supabase
    .from("push_config")
    .select("value")
    .eq("key", "internal_secret")
    .single();
  
  if (configSecret && internalSecret === configSecret.value) {
    isAuthorized = true;
  }

  // Or check admin JWT
  if (!isAuthorized && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (user) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (isAdmin) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Detect stale running jobs (stuck > timeout from regime or 10 min default)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: staleJobs } = await supabase
      .from("neuron_jobs")
      .select("id, retry_count, max_retries, worker_type, credits_cost")
      .eq("status", "running")
      .lt("scheduled_at", tenMinAgo)
      .eq("dead_letter", false)
      .limit(20);

    let recoveredCount = 0;
    let deadLetteredCount = 0;
    let regimeBlockedCount = 0;

    for (const job of staleJobs || []) {
      // Check execution regime for this worker type
      const regime = await getRegimeConfig(job.worker_type || "default");
      const effectiveMaxRetries = regime.maxRetries ?? job.max_retries;

      if (job.retry_count < effectiveMaxRetries) {
        // Check regime block before retrying
        const blockReason = checkRegimeBlock(regime, job.credits_cost || 0);
        if (blockReason) {
          await supabase.from("neuron_jobs").update({
            status: "failed",
            error_message: `Regime blocked: ${blockReason}`,
            completed_at: new Date().toISOString(),
          }).eq("id", job.id);
          regimeBlockedCount++;
          continue;
        }

        await supabase.from("neuron_jobs").update({
          status: "pending",
          retry_count: job.retry_count + 1,
          error_message: "Job timed out — auto-retrying",
          // Exponential backoff: 30s, 60s, 120s, 240s...
          scheduled_at: new Date(Date.now() + Math.min(30000 * Math.pow(2, job.retry_count), 300000)).toISOString(),
        }).eq("id", job.id);
        recoveredCount++;
      } else {
        await supabase.from("neuron_jobs").update({
          status: "failed",
          dead_letter: true,
          error_message: "Max retries exceeded — moved to dead letter",
          completed_at: new Date().toISOString(),
        }).eq("id", job.id);
        deadLetteredCount++;
      }
    }

    // 2. Auto-retry recently failed jobs
    const { data: failedJobs } = await supabase
      .from("neuron_jobs")
      .select("id")
      .eq("status", "failed")
      .eq("dead_letter", false)
      .limit(10);

    let retriedCount = 0;
    for (const job of failedJobs || []) {
      const { data: retried } = await supabase.rpc("retry_failed_job", { _job_id: job.id });
      if (retried) retriedCount++;
    }

    // 3. Get queue stats
    const { count: pendingCount } = await supabase
      .from("neuron_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: runningCount } = await supabase
      .from("neuron_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "running");

    const { count: dlqCount } = await supabase
      .from("neuron_jobs")
      .select("*", { count: "exact", head: true })
      .eq("dead_letter", true);

    return new Response(JSON.stringify({
      processed: {
        stale_recovered: recoveredCount,
        dead_lettered: deadLetteredCount,
        regime_blocked: regimeBlockedCount,
        retried: retriedCount,
      },
      queue_stats: {
        pending: pendingCount || 0,
        running: runningCount || 0,
        dead_letter: dlqCount || 0,
      },
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-queue error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
