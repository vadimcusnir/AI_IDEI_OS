/**
 * TaskExecutionCard — Minimal 3-layer execution card.
 * Layer 1: PRIMARY (status + title + cost/time)
 * Layer 2: SECONDARY (progress bar + steps collapsed)
 * Layer 3: TERTIARY (actions)
 * 
 * Color rules:
 *   green = success ONLY
 *   red = error ONLY
 *   everything else = grayscale
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, Loader2, Clock, Coins,
  ChevronDown, ChevronRight, FileText, RotateCcw,
  Save, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommandPhase, TaskStep, ExecutionState, OutputItem } from "@/stores/executionStore";

interface TaskExecutionCardProps {
  execution: ExecutionState;
  outputs: OutputItem[];
  onRetry?: () => void;
  onSaveTemplate?: () => void;
  onSaveAllOutputs?: () => void;
  onViewOutputs?: () => void;
}

const STEP_ICON: Record<TaskStep["status"], React.ReactNode> = {
  pending: <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />,
  running: <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  failed: <XCircle className="h-3 w-3 text-destructive" />,
  skipped: <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/10" />,
};

export function TaskExecutionCard({
  execution, outputs, onRetry, onSaveTemplate, onSaveAllOutputs, onViewOutputs,
}: TaskExecutionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const { phase, intent, planName, totalCredits, steps, startedAt, completedAt, errorMessage } = execution;

  // Live elapsed timer
  useEffect(() => {
    if (!startedAt || completedAt) return;
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, completedAt]);

  const finalElapsed = startedAt && completedAt
    ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    : elapsed;

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const consumedCredits = steps
    .filter(s => s.status === "completed" || s.status === "running")
    .reduce((sum, s) => sum + s.credits, 0);

  const isActive = phase === "planning" || phase === "confirming" || phase === "executing" || phase === "delivering" || phase === "storing";
  const isDone = phase === "completed";
  const isFailed = phase === "failed";

  if (phase === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border overflow-hidden",
        isDone && "border-green-500/15",
        isFailed && "border-destructive/15",
        isActive && "border-border/30",
      )}
    >
      {/* ═══ LAYER 1: PRIMARY — Status + Title + Meta ═══ */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Status icon — the ONLY colored element */}
        {isActive ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">
            {isDone ? "Execution Complete" : isFailed ? "Execution Failed" : planName || intent.replace(/_/g, " ") || "Processing..."}
          </p>
        </div>

        {/* Inline meta — cost + time */}
        <div className="flex items-center gap-3 shrink-0 text-[11px] tabular-nums text-muted-foreground">
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {consumedCredits}N
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {finalElapsed}s
          </span>
        </div>
      </div>

      {/* ═══ LAYER 2: SECONDARY — Progress + Output summary ═══ */}
      {steps.length > 0 && (
        <div className="px-4 pb-2">
          {/* Progress bar — neutral color */}
          <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isDone ? "bg-green-500" : isFailed ? "bg-destructive" : "bg-muted-foreground/40"
              )}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground/50 tabular-nums">
              {completedSteps}/{steps.length} steps
            </span>
            {/* Expand toggle for steps */}
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              {expanded ? "Hide" : "Details"}
              {expanded
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />
              }
            </button>
          </div>
        </div>
      )}

      {/* Steps detail — collapsed by default */}
      <AnimatePresence initial={false}>
        {expanded && steps.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-2 space-y-0.5">
              {steps.map(step => (
                <div key={step.id} className="flex items-center gap-2 py-1 text-[11px]">
                  <div className="shrink-0 w-3 flex items-center justify-center">
                    {STEP_ICON[step.status]}
                  </div>
                  <span className={cn(
                    "flex-1 truncate",
                    step.status === "completed" ? "text-foreground" :
                    step.status === "running" ? "text-foreground font-medium" :
                    step.status === "failed" ? "text-destructive" :
                    "text-muted-foreground/40",
                  )}>
                    {step.label}
                  </span>
                  <span className="text-[9px] tabular-nums text-muted-foreground/30 shrink-0">
                    {step.credits}N
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {errorMessage && (
        <div className="px-4 py-2 border-t border-destructive/10">
          <p className="text-[11px] text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Output summary — compact, no grid */}
      {isDone && outputs.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border/15">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3 w-3 text-foreground/60" />
            <span className="text-[11px] font-semibold text-foreground">
              {outputs.length} output{outputs.length !== 1 ? "s" : ""} generated
            </span>
          </div>
          <div className="space-y-0.5">
            {outputs.slice(0, 3).map((out) => (
              <div key={out.id} className="flex items-center gap-2 py-0.5">
                <FileText className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <span className="text-[11px] text-muted-foreground truncate flex-1">{out.title}</span>
                <span className="text-[9px] text-muted-foreground/30 uppercase shrink-0">{out.type}</span>
              </div>
            ))}
            {outputs.length > 3 && (
              <span className="text-[10px] text-muted-foreground/40">
                +{outputs.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* ═══ LAYER 3: TERTIARY — Actions (max 2 CTAs) ═══ */}
      {(isDone || isFailed) && (
        <div className="px-4 py-2.5 border-t border-border/15 flex items-center gap-2">
          {/* Primary CTA */}
          {isDone && outputs.length > 0 && onViewOutputs && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 rounded-lg" onClick={onViewOutputs}>
              <FileText className="h-3 w-3" /> View Outputs
            </Button>
          )}
          {isDone && onSaveTemplate && (
            <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1.5 rounded-lg text-muted-foreground" onClick={onSaveTemplate}>
              <Save className="h-3 w-3" /> Save Workflow
            </Button>
          )}
          {isFailed && onRetry && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 rounded-lg" onClick={onRetry}>
              <RotateCcw className="h-3 w-3" /> Retry
            </Button>
          )}
          {isDone && onRetry && (
            <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1.5 rounded-lg text-muted-foreground/50" onClick={onRetry}>
              <RotateCcw className="h-3 w-3" /> Re-run
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
