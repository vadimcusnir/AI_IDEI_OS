import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PipelineStage = "extract" | "structure" | "generate" | "monetize";

interface StageResult {
  stage: PipelineStage;
  status: "completed" | "failed" | "skipped";
  duration_ms: number;
  output: Record<string, unknown>;
  error?: string;
  attempts?: number;
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
  retry_config?: { max_retries?: number; backoff_base_ms?: number };
}

export function useAgentOrchestrator() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [results, setResults] = useState<StageResult[]>([]);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
    setCurrentStage(null);
    toast.info("Pipeline cancelled");
  }, []);

  const run = useCallback(async (input: OrchestratorInput): Promise<OrchestratorResult | null> => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const stages = input.stages || ["extract", "structure", "generate", "monetize"];

    try {
      const stageInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 95));
      }, 500);

      setCurrentStage(stages[0]);

      const { data, error } = await supabase.functions.invoke("agent-orchestrator", {
        body: input,
      });

      clearInterval(stageInterval);

      if (controller.signal.aborted) return null;

      if (error) {
        const msg = error.message || "Unknown error";
        if (msg.includes("429") || msg.includes("Too many")) {
          toast.error("Rate limit atins", { description: "Așteaptă câteva secunde și reîncearcă." });
        } else if (msg.includes("503") || msg.includes("kill_switch")) {
          toast.error("Platformă în mentenanță", { description: "Execuțiile sunt temporar suspendate." });
        } else {
          toast.error("Pipeline failed", { description: msg });
        }
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
        const totalRetries = result.stages.reduce((s, r) => s + ((r.attempts || 1) - 1), 0);
        const retryNote = totalRetries > 0 ? ` (${totalRetries} retries)` : "";
        toast.success(`Pipeline complet`, {
          description: `${completed}/${stages.length} stagii finalizate în ${(result.total_duration_ms / 1000).toFixed(1)}s${retryNote}`,
        });
      } else {
        const failedStage = result.stages.find(s => s.status === "failed");
        toast.error(`Pipeline eșuat la ${failedStage?.stage}`, {
          description: failedStage?.error || "Eroare necunoscută",
        });
      }

      return result;
    } catch (e) {
      if (controller.signal.aborted) return null;
      toast.error("Eroare pipeline", { description: e instanceof Error ? e.message : "Eroare necunoscută" });
      return null;
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, []);

  return { run, cancel, isRunning, currentStage, results, progress };
}
