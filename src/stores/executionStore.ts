/**
 * executionStore — Global execution state.
 * Single source of truth for all execution lifecycle.
 * No component owns this — it's shared across the app.
 * 
 * Pattern: useSyncExternalStore for zero-dep global state.
 */
import { useSyncExternalStore, useCallback } from "react";

// ═══ Types ═══

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

export interface OutputItem {
  id: string;
  type: "transcript" | "summary" | "insights" | "frameworks" | "action_plan" | "content" | "raw";
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface StoreState {
  execution: ExecutionState;
  outputs: OutputItem[];
  messages: Message[];
  loading: boolean;
  isStreaming: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

// ═══ Initial State ═══

const INITIAL_EXECUTION: ExecutionState = {
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

const INITIAL_STATE: StoreState = {
  execution: INITIAL_EXECUTION,
  outputs: [],
  messages: [],
  loading: false,
  isStreaming: false,
};

// ═══ Store Implementation ═══

type Listener = () => void;

let state: StoreState = { ...INITIAL_STATE };
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) listener();
}

function getSnapshot(): StoreState {
  return state;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(updater: (prev: StoreState) => Partial<StoreState>) {
  const updates = updater(state);
  state = { ...state, ...updates };
  emitChange();
}

// ═══ Actions ═══

export const executionActions = {
  // Execution lifecycle
  transition(phase: CommandPhase, partial?: Partial<ExecutionState>) {
    setState(prev => ({
      execution: { ...prev.execution, ...partial, phase },
    }));
  },

  reset() {
    setState(() => ({
      execution: { ...INITIAL_EXECUTION },
      outputs: [],
      loading: false,
      isStreaming: false,
    }));
  },

  setPlan(plan: {
    actionId: string | null;
    intent: string;
    confidence: number;
    planName: string;
    totalCredits: number;
    steps: Array<{ tool: string; label: string; credits: number }>;
    objective?: string;
    outputPreview?: string[];
  }) {
    setState(prev => ({
      execution: {
        ...prev.execution,
        phase: "confirming" as const,
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
      },
    }));
  },

  confirmExecution() {
    setState(prev => ({
      execution: {
        ...prev.execution,
        phase: "executing" as const,
        startedAt: new Date().toISOString(),
      },
    }));
  },

  updateStep(toolName: string, update: Partial<TaskStep>) {
    setState(prev => ({
      execution: {
        ...prev.execution,
        steps: prev.execution.steps.map(s =>
          s.tool === toolName && (s.status === "pending" || s.status === "running")
            ? { ...s, ...update }
            : s
        ),
      },
    }));
  },

  completeExecution() {
    setState(prev => ({
      execution: {
        ...prev.execution,
        phase: "completed" as const,
        completedAt: new Date().toISOString(),
        steps: prev.execution.steps.map(s =>
          s.status === "pending" ? { ...s, status: "skipped" as const } : s
        ),
      },
      loading: false,
      isStreaming: false,
    }));
  },

  failExecution(error: string) {
    setState(prev => ({
      execution: {
        ...prev.execution,
        phase: "failed" as const,
        errorMessage: error,
        completedAt: new Date().toISOString(),
      },
      loading: false,
      isStreaming: false,
    }));
  },

  // Messages
  addMessage(msg: Message) {
    setState(prev => ({
      messages: [...prev.messages, msg],
    }));
  },

  updateMessage(id: string, content: string) {
    setState(prev => ({
      messages: prev.messages.map(m => m.id === id ? { ...m, content } : m),
    }));
  },

  upsertAssistantMessage(id: string, content: string) {
    setState(prev => {
      const exists = prev.messages.find(m => m.id === id);
      if (exists) {
        return { messages: prev.messages.map(m => m.id === id ? { ...m, content } : m) };
      }
      return { messages: [...prev.messages, { id, role: "assistant" as const, content, timestamp: new Date() }] };
    });
  },

  setMessages(msgs: Message[]) {
    setState(() => ({ messages: msgs }));
  },

  clearMessages() {
    setState(() => ({ messages: [] }));
  },

  // Outputs
  setOutputs(outputs: OutputItem[]) {
    setState(() => ({ outputs }));
  },

  // Loading
  setLoading(loading: boolean) {
    setState(() => ({ loading }));
  },

  setStreaming(isStreaming: boolean) {
    setState(() => ({ isStreaming }));
  },
};

// ═══ Hook ═══

export function useExecutionStore(): StoreState & typeof executionActions {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snapshot, ...executionActions };
}

// Selector hook for performance — only re-renders when selected slice changes
export function useExecutionSelector<T>(selector: (state: StoreState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  );
}

// Direct access for non-React code (edge functions, utils)
export function getExecutionState(): StoreState {
  return getSnapshot();
}
