/**
 * executionStore — Global execution state + session + action bus + state machine.
 * Single source of truth for all execution lifecycle.
 * Pattern: useSyncExternalStore for zero-dep global state.
 *
 * State Machine:
 *   idle → input_loaded → transcribed → extracted → structured → services_run → artifacts_ready → monetized
 *
 * Action Bus:
 *   LOAD_INPUT, TRANSCRIBE, EXTRACT, BUILD_NEURONS, RUN_SERVICE, SAVE_ARTIFACT, MONETIZE
 */
import { useSyncExternalStore } from "react";
import { trackTransition } from "@/lib/internalAnalytics";

// ═══ Pipeline State Machine ═══

export type PipelinePhase =
  | "idle"
  | "input_loaded"
  | "transcribed"
  | "extracted"
  | "structured"
  | "services_run"
  | "artifacts_ready"
  | "monetized";

/** Valid transitions: phase → allowed next phases */
const PIPELINE_TRANSITIONS: Record<PipelinePhase, PipelinePhase[]> = {
  idle:            ["input_loaded"],
  input_loaded:    ["transcribed", "idle"],
  transcribed:     ["extracted", "idle"],
  extracted:       ["structured", "idle"],
  structured:      ["services_run", "idle"],
  services_run:    ["artifacts_ready", "idle"],
  artifacts_ready: ["monetized", "idle"],
  monetized:       ["idle"],
};

export function canTransition(from: PipelinePhase, to: PipelinePhase): boolean {
  return PIPELINE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ═══ Action Bus ═══

export type ActionType =
  | "LOAD_INPUT"
  | "TRANSCRIBE"
  | "EXTRACT"
  | "BUILD_NEURONS"
  | "RUN_SERVICE"
  | "SAVE_ARTIFACT"
  | "MONETIZE";

/** Which pipeline phase is required before dispatching an action */
const ACTION_PREREQUISITES: Record<ActionType, PipelinePhase[]> = {
  LOAD_INPUT:     ["idle"],
  TRANSCRIBE:     ["input_loaded"],
  EXTRACT:        ["transcribed"],
  BUILD_NEURONS:  ["extracted"],
  RUN_SERVICE:    ["structured", "extracted"],
  SAVE_ARTIFACT:  ["services_run"],
  MONETIZE:       ["artifacts_ready"],
};

/** Which pipeline phase the action produces on success */
const ACTION_RESULT_PHASE: Record<ActionType, PipelinePhase> = {
  LOAD_INPUT:     "input_loaded",
  TRANSCRIBE:     "transcribed",
  EXTRACT:        "extracted",
  BUILD_NEURONS:  "structured",
  RUN_SERVICE:    "services_run",
  SAVE_ARTIFACT:  "artifacts_ready",
  MONETIZE:       "monetized",
};

export function canDispatch(action: ActionType, currentPhase: PipelinePhase): boolean {
  return ACTION_PREREQUISITES[action]?.includes(currentPhase) ?? false;
}

// ═══ Execution Session ═══

export interface InputSource {
  type: "file" | "url" | "text" | "voice";
  value: string;           // URL, file path, or raw text
  fileName?: string;
  mimeType?: string;
  episodeId?: string;
}

export interface SessionNeuron {
  id: number;
  title: string;
  type: string;
  confidence: number;
}

export interface SessionService {
  serviceKey: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  jobId?: string;
  creditsSpent?: number;
}

export interface SessionArtifact {
  id: string;
  title: string;
  type: string;
  format: string;
  previewUrl?: string;
}

export interface ExecutionSession {
  /** Unique session ID */
  id: string;
  /** Pipeline state machine phase */
  pipelinePhase: PipelinePhase;
  /** Input source */
  input: InputSource | null;
  /** Transcript text (after TRANSCRIBE) */
  transcript: string | null;
  /** Extracted neurons (after EXTRACT) */
  neurons: SessionNeuron[];
  /** Services executed (after RUN_SERVICE) */
  services: SessionService[];
  /** Generated artifacts (after SAVE_ARTIFACT) */
  artifacts: SessionArtifact[];
  /** Job IDs associated with this session */
  jobIds: string[];
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

// ═══ Legacy Execution Types (kept for backward compat) ═══

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
  /** URL to navigate to when step is completed (e.g. /neurons, /jobs/123) */
  resultUrl?: string;
  /** Short label for the result link */
  resultLabel?: string;
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

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

// ═══ Store State ═══

interface StoreState {
  /** Global pipeline session */
  session: ExecutionSession;
  /** Legacy execution state (Command Center) */
  execution: ExecutionState;
  outputs: OutputItem[];
  messages: Message[];
  loading: boolean;
  isStreaming: boolean;
}

// ═══ Initial State ═══

function createEmptySession(): ExecutionSession {
  return {
    id: crypto.randomUUID(),
    pipelinePhase: "idle",
    input: null,
    transcript: null,
    neurons: [],
    services: [],
    artifacts: [],
    jobIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

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
  session: createEmptySession(),
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

function updateSession(updater: (prev: ExecutionSession) => Partial<ExecutionSession>) {
  setState(prev => ({
    session: {
      ...prev.session,
      ...updater(prev.session),
      updatedAt: new Date().toISOString(),
    },
  }));
}

// ═══ Persistence ═══

const SESSION_STORAGE_KEY = "ai-idei-execution-session";

function persistSession() {
  try {
    const s = state.session;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
  } catch { /* quota exceeded — ignore */ }
}

function restoreSession(): ExecutionSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExecutionSession;
  } catch {
    return null;
  }
}

// Restore on load
const restored = restoreSession();
if (restored) {
  state = { ...state, session: restored };
}

// ═══ Actions ═══

export const executionActions = {
  // ── Pipeline Action Bus ──

  /** Dispatch a pipeline action. Returns false if action not allowed in current phase. */
  dispatch(action: ActionType, payload?: Record<string, unknown>): boolean {
    const currentPhase = state.session.pipelinePhase;
    if (!canDispatch(action, currentPhase)) {
      console.warn(`[ActionBus] Cannot dispatch ${action} in phase ${currentPhase}`);
      return false;
    }

    const nextPhase = ACTION_RESULT_PHASE[action];

    switch (action) {
      case "LOAD_INPUT":
        updateSession(() => ({
          pipelinePhase: nextPhase,
          input: (payload as unknown as { input: InputSource })?.input ?? null,
        }));
        break;
      case "TRANSCRIBE":
        updateSession(() => ({
          pipelinePhase: nextPhase,
          transcript: (payload?.transcript as string) ?? null,
        }));
        break;
      case "EXTRACT":
        updateSession(() => ({
          pipelinePhase: nextPhase,
          neurons: (payload?.neurons as SessionNeuron[]) ?? [],
        }));
        break;
      case "BUILD_NEURONS":
        updateSession(() => ({ pipelinePhase: nextPhase }));
        break;
      case "RUN_SERVICE":
        updateSession(prev => ({
          pipelinePhase: nextPhase,
          services: [...prev.services, ...(payload?.services as SessionService[] ?? [])],
          jobIds: [...prev.jobIds, ...((payload?.jobIds as string[]) ?? [])],
        }));
        break;
      case "SAVE_ARTIFACT":
        updateSession(prev => ({
          pipelinePhase: nextPhase,
          artifacts: [...prev.artifacts, ...(payload?.artifacts as SessionArtifact[] ?? [])],
        }));
        break;
      case "MONETIZE":
        updateSession(() => ({ pipelinePhase: nextPhase }));
        break;
    }

    trackTransition(currentPhase, nextPhase, { action, payload: payload ? Object.keys(payload) : [] });
    persistSession();
    return true;
  },

  /** Reset pipeline to idle */
  resetPipeline() {
    updateSession(() => ({
      ...createEmptySession(),
    }));
    persistSession();
  },

  /** Force pipeline phase (for recovery) */
  forcePipelinePhase(phase: PipelinePhase) {
    updateSession(() => ({ pipelinePhase: phase }));
    persistSession();
  },

  // ── Legacy Execution lifecycle ──

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

  // ── Messages ──

  addMessage(msg: Message) {
    setState(prev => ({ messages: [...prev.messages, msg] }));
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

  // ── Outputs ──

  setOutputs(outputs: OutputItem[]) {
    setState(() => ({ outputs }));
  },

  // ── Loading ──

  setLoading(loading: boolean) {
    setState(() => ({ loading }));
  },

  setStreaming(isStreaming: boolean) {
    setState(() => ({ isStreaming }));
  },
};

// ═══ Hooks ═══

export function useExecutionStore(): StoreState & typeof executionActions {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snapshot, ...executionActions };
}

export function useExecutionSelector<T>(selector: (state: StoreState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  );
}

/** Pipeline session selector */
export function usePipelineSession(): ExecutionSession {
  return useExecutionSelector(s => s.session);
}

/** Check if an action can be dispatched in current pipeline phase */
export function useCanDispatch(action: ActionType): boolean {
  const phase = useExecutionSelector(s => s.session.pipelinePhase);
  return canDispatch(action, phase);
}

// Direct access for non-React code
export function getExecutionState(): StoreState {
  return getSnapshot();
}
