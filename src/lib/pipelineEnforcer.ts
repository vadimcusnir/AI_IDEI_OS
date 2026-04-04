/**
 * pipelineEnforcer — Pure functions for server-side & client-side
 * pipeline integrity checks. No React dependency.
 */
import {
  type PipelinePhase,
  type ActionType,
  canDispatch,
  canTransition,
} from "@/stores/executionStore";

export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  currentPhase: PipelinePhase;
  requestedAction?: ActionType;
  requestedPhase?: PipelinePhase;
}

/** Validate an action dispatch against current phase */
export function enforceAction(
  currentPhase: PipelinePhase,
  action: ActionType
): EnforcementResult {
  const allowed = canDispatch(action, currentPhase);
  return {
    allowed,
    currentPhase,
    requestedAction: action,
    reason: allowed
      ? undefined
      : `Action "${action}" cannot be dispatched in phase "${currentPhase}"`,
  };
}

/** Validate a phase transition */
export function enforceTransition(
  from: PipelinePhase,
  to: PipelinePhase
): EnforcementResult {
  const allowed = canTransition(from, to);
  return {
    allowed,
    currentPhase: from,
    requestedPhase: to,
    reason: allowed
      ? undefined
      : `Transition from "${from}" to "${to}" is not allowed`,
  };
}

/** Batch validate: given a sequence of actions, return first failure or all-pass */
export function enforceActionChain(
  startPhase: PipelinePhase,
  actions: ActionType[]
): EnforcementResult {
  // Simulate walking through the phase machine
  const ACTION_RESULT: Record<string, PipelinePhase> = {
    LOAD_INPUT: "input_loaded",
    TRANSCRIBE: "transcribed",
    EXTRACT: "extracted",
    BUILD_NEURONS: "structured",
    RUN_SERVICE: "services_run",
    SAVE_ARTIFACT: "artifacts_ready",
    MONETIZE: "monetized",
  };

  let phase = startPhase;
  for (const action of actions) {
    const result = enforceAction(phase, action);
    if (!result.allowed) return result;
    phase = ACTION_RESULT[action] ?? phase;
  }

  return { allowed: true, currentPhase: phase };
}
