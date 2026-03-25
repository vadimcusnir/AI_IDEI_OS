import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * P2-013: Job Queue Manager
 * Provides queue primitives: enqueue, dequeue, retry, dead-letter.
 * Uses neuron_jobs table with priority-based FIFO.
 */
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, ...params } = await req.json();

    switch (action) {
      case "enqueue": {
        const { neuron_id, worker_type, input, priority = 5, author_id } = params;
        const { data, error } = await supabase.from("neuron_jobs").insert({
          neuron_id,
          worker_type,
          input,
          priority,
          author_id,
          status: "pending",
          max_retries: 3,
        }).select("id").single();

        if (error) throw error;
        return new Response(JSON.stringify({ job_id: data.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "dequeue": {
        // Claim next pending job by priority (highest first), FIFO within same priority
        const { worker_type } = params;
        const { data: job, error } = await supabase
          .from("neuron_jobs")
          .select("*")
          .eq("status", "pending")
          .eq("worker_type", worker_type)
          .eq("dead_letter", false)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!job) {
          return new Response(JSON.stringify({ job: null }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Claim the job
        await supabase.from("neuron_jobs")
          .update({ status: "processing" })
          .eq("id", job.id)
          .eq("status", "pending"); // Optimistic lock

        return new Response(JSON.stringify({ job }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "complete": {
        const { job_id, result } = params;
        const { error } = await supabase.from("neuron_jobs")
          .update({
            status: "completed",
            result,
            completed_at: new Date().toISOString(),
          })
          .eq("id", job_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "fail": {
        const { job_id, error_message } = params;
        // Check retry count
        const { data: job } = await supabase.from("neuron_jobs")
          .select("retry_count, max_retries")
          .eq("id", job_id)
          .single();

        if (!job) throw new Error("Job not found");

        const newRetry = (job.retry_count || 0) + 1;
        const isDead = newRetry >= (job.max_retries || 3);

        await supabase.from("neuron_jobs").update({
          status: isDead ? "failed" : "pending",
          error_message,
          retry_count: newRetry,
          dead_letter: isDead,
          scheduled_at: isDead ? null : new Date(Date.now() + Math.pow(2, newRetry) * 1000).toISOString(),
        }).eq("id", job_id);

        return new Response(JSON.stringify({ retried: !isDead, dead_letter: isDead }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "stats": {
        const { data: stats } = await supabase.from("neuron_jobs")
          .select("status", { count: "exact", head: false });

        const counts: Record<string, number> = {};
        for (const s of stats || []) {
          counts[s.status] = (counts[s.status] || 0) + 1;
        }

        return new Response(JSON.stringify({ queue_stats: counts }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
