import { useState, useCallback, useRef } from "react";

export type CommandPhase =
  | "idle"
  | "planning"
  | "confirming"
  | "executing"
  | "delivering"
  | "storing"
  | "completed"
  | "failed";

export interface TaskStep {
  id: string;
  tool: string;
  label: string;
  credits: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
}

export interface ExecutionState {
  phase: CommandPhase;
  actionId: string | null;
  intent: string;
  confidence: number;
  planName: string;
  totalCredits: number;
  steps: TaskStep[];
  objective: string;
  outputPreview: string[];
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

const INITIAL_STATE: ExecutionState = {
  phase: "idle",
  actionId: null,
  intent: "",
  confidence: 0,
  planName: "",
  totalCredits: 0,
  steps: [],
  objective: "",
  outputPreview: [],
  startedAt: null,
  completedAt: null,
  errorMessage: null,
};

export function useCommandState() {
  const [state, setState] = useState<ExecutionState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const transition = useCallback((phase: CommandPhase, partial?: Partial<ExecutionState>) => {
    setState(prev => ({ ...prev, ...partial, phase }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const setPlan = useCallback((plan: {
    actionId: string | null;
    intent: string;
    confidence: number;
    planName: string;
    totalCredits: number;
    steps: Array<{ tool: string; label: string; credits: number }>;
    objective?: string;
    outputPreview?: string[];
  }) => {
    setState(prev => ({
      ...prev,
      phase: "confirming",
      actionId: plan.actionId,
      intent: plan.intent,
      confidence: plan.confidence,
      planName: plan.planName,
      totalCredits: plan.totalCredits,
      objective: plan.objective || `Execute ${plan.intent.replace(/_/g, " ")}`,
      outputPreview: plan.outputPreview || [],
      steps: plan.steps.map((s, i) => ({
        id: `step-${i}`,
        tool: s.tool,
        label: s.label,
        credits: s.credits,
        status: "pending" as const,
      })),
    }));
  }, []);

  const confirmExecution = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: "executing",
      startedAt: new Date().toISOString(),
    }));
  }, []);

  const updateStep = useCallback((toolName: string, update: Partial<TaskStep>) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.tool === toolName && (s.status === "pending" || s.status === "running")
          ? { ...s, ...update }
          : s
      ),
    }));
  }, []);

  const completeExecution = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: "completed",
      completedAt: new Date().toISOString(),
      steps: prev.steps.map(s => s.status === "pending" ? { ...s, status: "skipped" as const } : s),
    }));
  }, []);

  const failExecution = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      phase: "failed",
      errorMessage: error,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  return {
    state,
    transition,
    reset,
    setPlan,
    confirmExecution,
    updateStep,
    completeExecution,
    failExecution,
  };
}
