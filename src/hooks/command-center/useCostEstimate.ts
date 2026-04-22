/**
 * useCostEstimate — Lightweight pre-execution cost estimator.
 * Derives an approximate NEURONS cost from active command tags + attached files
 * so the user sees the impact BEFORE submitting.
 *
 * This is intentionally heuristic — the real plan estimate comes from the
 * decision engine post-routing. The goal here is "no surprise" UX.
 */
import { useMemo } from "react";

/** Per-command base cost (heuristic, mirrors agent_plan_templates averages). */
const COMMAND_BASE_COST: Record<string, number> = {
  "/extract": 8,
  "/analyze": 12,
  "/transcribe": 15,
  "/segment": 6,
  "/pipeline": 35,
  "/search": 2,
  "/summarize": 5,
  "/compare": 10,
  "/topics": 6,
  "/relate": 6,
  "/contradictions": 8,
  "/generate": 18,
  "/article": 25,
  "/course": 60,
  "/social": 8,
  "/script": 20,
  "/copy": 10,
  "/webinar": 45,
  "/funnel": 30,
  "/services": 0,
  "/avatar33": 80,
  "/profile": 25,
  "/brand": 20,
  "/status": 0,
  "/credits": 0,
  "/jobs": 0,
  "/export": 0,
  "/stats": 0,
  "/db": 0,
  "/help": 0,
  "/feedback": 0,
  "/tags": 0,
};

const FILE_COST_PER_MB = 0.5;
const FILE_FLAT_COST = 1; // overhead per attachment

export function estimateCommandCost(commands: string[], files: File[] = []): number {
  let total = 0;
  for (const cmd of commands) {
    total += COMMAND_BASE_COST[cmd] ?? 5; // unknown command → small default
  }
  for (const f of files) {
    total += FILE_FLAT_COST + Math.ceil((f.size / (1024 * 1024)) * FILE_COST_PER_MB);
  }
  return total;
}

interface Args {
  commands: string[];
  files: File[];
  input: string;
}

export function useCostEstimate({ commands, files, input }: Args) {
  return useMemo(() => {
    const cost = estimateCommandCost(commands, files);
    // Only show when there is something concrete to estimate
    const visible = cost > 0 && (commands.length > 0 || files.length > 0 || input.trim().length > 0);
    return { estimatedCredits: cost, visible };
  }, [commands, files, input]);
}
