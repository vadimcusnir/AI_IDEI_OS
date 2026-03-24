/**
 * useExecutionHistory — Persists completed executions to agent_action_history
 * and manages the execution → asset → template capital loop.
 */
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ExecutionState } from "@/stores/executionStore";

interface PersistOptions {
  execution: ExecutionState;
  outputCount: number;
}

export function useExecutionHistory() {
  const { user } = useAuth();

  /** Persist a completed execution run to the history table */
  const persistRun = useCallback(async ({ execution, outputCount }: PersistOptions) => {
    if (!user || execution.phase !== "completed") return null;

    const startTime = execution.startedAt ? new Date(execution.startedAt).getTime() : Date.now();
    const endTime = execution.completedAt ? new Date(execution.completedAt).getTime() : Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    const completedSteps = execution.steps.filter(s => s.status === "completed").length;

    try {
      const { data, error } = await supabase.from("agent_action_history").insert({
        user_id: user.id,
        intent_key: execution.intent || "general",
        plan_template_id: null,
        total_credits: execution.totalCredits,
        total_steps: execution.steps.length,
        completed_steps: completedSteps,
        success: execution.phase === "completed" && !execution.errorMessage,
        duration_seconds: durationSeconds > 0 ? durationSeconds : null,
      } as any).select("id").single();

      if (error) {
        console.warn("[execution-history] Failed to persist run:", error.message);
        return null;
      }
      return data?.id || null;
    } catch {
      return null;
    }
  }, [user]);

  /** Save all outputs as artifacts in a single batch */
  const persistOutputsBatch = useCallback(async (
    outputs: Array<{ title: string; content: string; type: string }>,
    tags: string[] = []
  ) => {
    if (!user || outputs.length === 0) return 0;

    const rows = outputs.map(o => ({
      author_id: user.id,
      title: o.title,
      content: o.content,
      artifact_type: o.type === "raw" ? "document" : o.type,
      format: "markdown" as const,
      status: "draft" as const,
      tags: [o.type, "command-center", ...tags],
      metadata: {} as any,
    }));

    try {
      const { data, error } = await supabase.from("artifacts").insert(rows).select("id");
      if (error) {
        console.warn("[execution-history] Batch save failed:", error.message);
        return 0;
      }
      return data?.length || 0;
    } catch {
      return 0;
    }
  }, [user]);

  /** Fetch recent execution stats for the welcome screen */
  const getRecentStats = useCallback(async () => {
    if (!user) return { totalRuns: 0, successRate: 0, totalCreditsSpent: 0 };

    try {
      const { data, count } = await supabase
        .from("agent_action_history")
        .select("success, total_credits", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!data || data.length === 0) return { totalRuns: 0, successRate: 0, totalCreditsSpent: 0 };

      const successCount = data.filter((r: any) => r.success).length;
      const totalCredits = data.reduce((sum: number, r: any) => sum + (r.total_credits || 0), 0);

      return {
        totalRuns: count || data.length,
        successRate: Math.round((successCount / data.length) * 100),
        totalCreditsSpent: totalCredits,
      };
    } catch {
      return { totalRuns: 0, successRate: 0, totalCreditsSpent: 0 };
    }
  }, [user]);

  return { persistRun, persistOutputsBatch, getRecentStats };
}
