import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PipelineStage = "extract" | "structure" | "generate" | "monetize";

interface StageResult {
  stage: PipelineStage;
  status: "completed" | "failed" | "skipped";
  duration_ms: number;
  output: Record<string, unknown>;
  error?: string;
}

interface OrchestratorResult {
  success: boolean;
  action_id: string | null;
  total_duration_ms: number;
  stages: StageResult[];
}

interface OrchestratorInput {
  episode_id?: string;
  neuron_ids?: number[];
  stages?: PipelineStage[];
  generate_service_key?: string;
  monetize_config?: { price_neurons?: number; license_type?: string };
}

export function useAgentOrchestrator() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [results, setResults] = useState<StageResult[]>([]);
  const [progress, setProgress] = useState(0);

  const run = useCallback(async (input: OrchestratorInput): Promise<OrchestratorResult | null> => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const stages = input.stages || ["extract", "structure", "generate", "monetize"];

    try {
      // Simulate stage tracking (the actual execution is server-side)
      const stageInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 95));
      }, 500);

      setCurrentStage(stages[0]);

      const { data, error } = await supabase.functions.invoke("agent-orchestrator", {
        body: input,
      });

      clearInterval(stageInterval);

      if (error) {
        toast.error("Pipeline failed", { description: error.message });
        setIsRunning(false);
        setCurrentStage(null);
        return null;
      }

      const result = data as OrchestratorResult;
      setResults(result.stages);
      setProgress(100);
      setCurrentStage(null);

      if (result.success) {
        const completed = result.stages.filter(s => s.status === "completed").length;
        toast.success(`Pipeline complete`, {
          description: `${completed}/${stages.length} stages completed in ${(result.total_duration_ms / 1000).toFixed(1)}s`,
        });
      } else {
        const failedStage = result.stages.find(s => s.status === "failed");
        toast.error(`Pipeline failed at ${failedStage?.stage}`, {
          description: failedStage?.error || "Unknown error",
        });
      }

      return result;
    } catch (e) {
      toast.error("Pipeline error", { description: e instanceof Error ? e.message : "Unknown error" });
      return null;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { run, isRunning, currentStage, results, progress };
}
