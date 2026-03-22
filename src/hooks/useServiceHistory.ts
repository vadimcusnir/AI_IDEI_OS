import { supabase } from "@/integrations/supabase/client";

/**
 * Log a service run to the history table.
 */
export async function logServiceRun(params: {
  userId: string;
  serviceKey: string;
  serviceName: string;
  neuronId?: number;
  jobId?: string;
  creditsCost: number;
  status: string;
  resultPreview?: string;
  durationMs?: number;
  inputs?: Record<string, any>;
  batchId?: string;
}) {
  const { error } = await supabase.from("service_run_history").insert({
    user_id: params.userId,
    service_key: params.serviceKey,
    service_name: params.serviceName,
    neuron_id: params.neuronId,
    job_id: params.jobId,
    credits_cost: params.creditsCost,
    status: params.status,
    result_preview: params.resultPreview?.slice(0, 500) || "",
    duration_ms: params.durationMs,
    inputs: params.inputs || {},
    batch_id: params.batchId,
    completed_at: params.status === "completed" || params.status === "failed" ? new Date().toISOString() : null,
  } as any);

  if (error) console.error("[service-history] Failed to log:", error.message);
}

/**
 * Update a service run status.
 */
export async function updateServiceRun(
  runId: string,
  updates: { status?: string; resultPreview?: string; durationMs?: number }
) {
  const payload: any = {};
  if (updates.status) payload.status = updates.status;
  if (updates.resultPreview) payload.result_preview = updates.resultPreview.slice(0, 500);
  if (updates.durationMs) payload.duration_ms = updates.durationMs;
  if (updates.status === "completed" || updates.status === "failed") {
    payload.completed_at = new Date().toISOString();
  }

  await supabase.from("service_run_history").update(payload).eq("id", runId);
}
