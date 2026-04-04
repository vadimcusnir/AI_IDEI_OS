import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canTransition,
  canDispatch,
  type PipelinePhase,
  type ActionType,
} from "../executionStore";

describe("Pipeline State Machine", () => {
  it("allows valid transitions", () => {
    expect(canTransition("idle", "input_loaded")).toBe(true);
    expect(canTransition("input_loaded", "transcribed")).toBe(true);
    expect(canTransition("transcribed", "extracted")).toBe(true);
    expect(canTransition("extracted", "structured")).toBe(true);
    expect(canTransition("structured", "services_run")).toBe(true);
    expect(canTransition("services_run", "artifacts_ready")).toBe(true);
    expect(canTransition("artifacts_ready", "monetized")).toBe(true);
  });

  it("allows reset to idle from any phase", () => {
    const phases: PipelinePhase[] = [
      "input_loaded", "transcribed", "extracted", "structured",
      "services_run", "artifacts_ready", "monetized",
    ];
    for (const phase of phases) {
      expect(canTransition(phase, "idle")).toBe(true);
    }
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("idle", "extracted")).toBe(false);
    expect(canTransition("idle", "monetized")).toBe(false);
    expect(canTransition("transcribed", "services_run")).toBe(false);
    expect(canTransition("monetized", "extracted")).toBe(false);
  });
});

describe("Action Bus Prerequisites", () => {
  it("allows LOAD_INPUT only from idle", () => {
    expect(canDispatch("LOAD_INPUT", "idle")).toBe(true);
    expect(canDispatch("LOAD_INPUT", "input_loaded")).toBe(false);
  });

  it("allows TRANSCRIBE only from input_loaded", () => {
    expect(canDispatch("TRANSCRIBE", "input_loaded")).toBe(true);
    expect(canDispatch("TRANSCRIBE", "idle")).toBe(false);
  });

  it("allows EXTRACT only from transcribed", () => {
    expect(canDispatch("EXTRACT", "transcribed")).toBe(true);
    expect(canDispatch("EXTRACT", "idle")).toBe(false);
  });

  it("allows RUN_SERVICE from structured or extracted", () => {
    expect(canDispatch("RUN_SERVICE", "structured")).toBe(true);
    expect(canDispatch("RUN_SERVICE", "extracted")).toBe(true);
    expect(canDispatch("RUN_SERVICE", "idle")).toBe(false);
  });

  it("allows SAVE_ARTIFACT only from services_run", () => {
    expect(canDispatch("SAVE_ARTIFACT", "services_run")).toBe(true);
    expect(canDispatch("SAVE_ARTIFACT", "idle")).toBe(false);
  });

  it("allows MONETIZE only from artifacts_ready", () => {
    expect(canDispatch("MONETIZE", "artifacts_ready")).toBe(true);
    expect(canDispatch("MONETIZE", "idle")).toBe(false);
  });
});

describe("Full Pipeline Flow (E2E)", () => {
  const FULL_FLOW: { action: ActionType; fromPhase: PipelinePhase }[] = [
    { action: "LOAD_INPUT", fromPhase: "idle" },
    { action: "TRANSCRIBE", fromPhase: "input_loaded" },
    { action: "EXTRACT", fromPhase: "transcribed" },
    { action: "BUILD_NEURONS", fromPhase: "extracted" },
    { action: "RUN_SERVICE", fromPhase: "structured" },
    { action: "SAVE_ARTIFACT", fromPhase: "services_run" },
    { action: "MONETIZE", fromPhase: "artifacts_ready" },
  ];

  it("all pipeline steps can be dispatched in sequence", () => {
    for (const { action, fromPhase } of FULL_FLOW) {
      expect(canDispatch(action, fromPhase)).toBe(true);
    }
  });

  it("no step can be skipped", () => {
    expect(canDispatch("EXTRACT", "idle")).toBe(false);
    expect(canDispatch("RUN_SERVICE", "input_loaded")).toBe(false);
    expect(canDispatch("MONETIZE", "services_run")).toBe(false);
  });
});
