/**
 * TaskExecutionCard — Inline execution timeline card.
 * Replaces passive chat with a production terminal view.
 * Shows: steps, progress, cost, time, status, monetization.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, Loader2, Clock, Coins, Layers,
  ChevronDown, ChevronRight, Zap, Lock, FileText, RotateCcw,
  Save, TrendingUp, Sparkles, AlertTriangle,
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

const STATUS_ICON: Record<TaskStep["status"], React.ElementType> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  skipped: AlertTriangle,
};

const STATUS_COLOR: Record<TaskStep["status"], string> = {
  pending: "text-muted-foreground/40",
  running: "text-primary",
  completed: "text-green-500",
  failed: "text-destructive",
  skipped: "text-muted-foreground/30",
};

export function TaskExecutionCard({
  execution, outputs, onRetry, onSaveTemplate, onSaveAllOutputs, onViewOutputs,
}: TaskExecutionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const { phase, intent, planName, totalCredits, steps, startedAt, completedAt, errorMessage, confidence } = execution;

  // Live elapsed timer
  useEffect(() => {
    if (!startedAt || completedAt) return;
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, completedAt]);

  // Calculate final elapsed if completed
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
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-colors duration-300",
        isDone && "border-green-500/20 bg-gradient-to-b from-green-500/[0.02] to-transparent",
        isFailed && "border-destructive/20 bg-gradient-to-b from-destructive/[0.02] to-transparent",
        isActive && "border-primary/20 bg-gradient-to-b from-primary/[0.02] to-transparent",
      )}
    >
      {/* ═══ Header — always visible ═══ */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors"
      >
        {/* Status icon */}
        <div className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
          isDone && "bg-green-500/10",
          isFailed && "bg-destructive/10",
          isActive && "bg-primary/10",
        )}>
          {isActive ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : isDone ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </div>

        {/* Title + intent */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-semibold truncate">
            {planName || intent.replace(/_/g, " ") || "Execution"}
          </p>
          {intent && (
            <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
              {intent.replace(/_/g, " ")}
            </p>
          )}
        </div>

        {/* Live metrics — always visible */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Progress */}
          {steps.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 bg-border/40 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    isDone ? "bg-green-500" : isFailed ? "bg-destructive" : "bg-primary"
                  )}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {completedSteps}/{steps.length}
              </span>
            </div>
          )}

          {/* Cost */}
          <div className="flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
            <Coins className="h-3 w-3" />
            <span>{consumedCredits}/{totalCredits} N</span>
          </div>

          {/* Time */}
          {(startedAt || finalElapsed > 0) && (
            <div className="flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{finalElapsed}s</span>
            </div>
          )}

          {/* Expand toggle */}
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          }
        </div>
      </button>

      {/* ═══ Expandable body ═══ */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Steps timeline */}
            {steps.length > 0 && (
              <div className="px-4 py-2 border-t border-border/20 space-y-0.5">
                {steps.map((step, i) => {
                  const Icon = STATUS_ICON[step.status];
                  return (
                    <div key={step.id} className="flex items-center gap-2.5 py-1">
                      {/* Connector line */}
                      <div className="relative flex flex-col items-center w-4 shrink-0">
                        <Icon className={cn(
                          "h-3.5 w-3.5",
                          STATUS_COLOR[step.status],
                          step.status === "running" && "animate-spin"
                        )} />
                        {i < steps.length - 1 && (
                          <div className={cn(
                            "absolute top-4 left-1/2 -translate-x-1/2 w-px h-4",
                            step.status === "completed" ? "bg-green-500/30" : "bg-border/30"
                          )} />
                        )}
                      </div>
                      {/* Label */}
                      <span className={cn(
                        "text-[11px] flex-1",
                        step.status === "completed" && "text-foreground",
                        step.status === "running" && "text-primary font-medium",
                        step.status === "pending" && "text-muted-foreground/50",
                        step.status === "failed" && "text-destructive",
                        step.status === "skipped" && "text-muted-foreground/30 line-through",
                      )}>
                        {step.label}
                      </span>
                      {/* Step cost */}
                      <span className="text-[9px] tabular-nums text-muted-foreground/40">
                        {step.credits}N
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="px-4 py-2 border-t border-destructive/10 bg-destructive/[0.02]">
                <p className="text-[11px] text-destructive">{errorMessage}</p>
              </div>
            )}

            {/* Output preview */}
            {isDone && outputs.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground">
                    {outputs.length} asset{outputs.length !== 1 ? "s" : ""} generat{outputs.length !== 1 ? "e" : ""}
                  </span>
                </div>
                <div className="space-y-1">
                  {outputs.slice(0, 3).map((out) => (
                    <div key={out.id} className="flex items-center gap-2 py-1 px-2 rounded-lg bg-muted/30">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-foreground truncate flex-1">{out.title}</span>
                      <span className="text-[9px] text-muted-foreground/50 uppercase">{out.type}</span>
                    </div>
                  ))}
                  {outputs.length > 3 && (
                    <div className="flex items-center gap-2 py-1 px-2">
                      <Lock className="h-3 w-3 text-muted-foreground/30" />
                      <span className="text-[10px] text-muted-foreground/50">
                        +{outputs.length - 3} locked — unlock all
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {(isDone || isFailed) && (
              <div className="px-4 py-2.5 border-t border-border/20 flex items-center gap-2 flex-wrap">
                {isDone && outputs.length > 0 && onViewOutputs && (
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 rounded-lg" onClick={onViewOutputs}>
                    <FileText className="h-3 w-3" /> View
                  </Button>
                )}
                {isDone && outputs.length > 1 && onSaveAllOutputs && (
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 rounded-lg" onClick={onSaveAllOutputs}>
                    <Save className="h-3 w-3" /> Save All
                  </Button>
                )}
                {isDone && onSaveTemplate && (
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 rounded-lg" onClick={onSaveTemplate}>
                    <TrendingUp className="h-3 w-3" /> Save Workflow
                  </Button>
                )}
                {onRetry && (
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1.5 rounded-lg" onClick={onRetry}>
                    <RotateCcw className="h-3 w-3" /> {isDone ? "Re-run" : "Retry"}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
