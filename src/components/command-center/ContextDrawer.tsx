/**
 * ContextDrawer — Right panel that appears ON DEMAND during execution.
 * Auto-opens when execution starts, collapsible by user.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Save, Package, CheckCircle2, XCircle, Zap, Clock, Coins, Loader2, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionState, TaskStep, OutputItem } from "@/stores/executionStore";

interface ContextDrawerProps {
  execution: ExecutionState;
  outputs: OutputItem[];
  balance: number;
  onSaveTemplate: () => void;
  onViewOutputs: () => void;
  onRerun: () => void;
}

export function ContextDrawer({
  execution, outputs, balance, onSaveTemplate, onViewOutputs, onRerun,
}: ContextDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { phase, steps, totalCredits, startedAt, completedAt, planName, intent, objective } = execution;

  // Auto-open when execution starts
  useEffect(() => {
    if (phase === "planning" || phase === "executing" || phase === "confirming") {
      setIsOpen(true);
    }
  }, [phase]);

  // Auto-close when idle
  useEffect(() => {
    if (phase === "idle") setIsOpen(false);
  }, [phase]);

  if (phase === "idle" && !isOpen) return null;

  const elapsed = startedAt
    ? Math.round(((completedAt ? new Date(completedAt).getTime() : Date.now()) - new Date(startedAt).getTime()) / 1000)
    : 0;
  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const isDone = phase === "completed";
  const isFailed = phase === "failed";
  const isActive = phase === "executing" || phase === "delivering" || phase === "planning";

  return (
    <>
      {/* Desktop drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="hidden lg:flex flex-col h-full border-l border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "h-6 w-6 rounded-lg flex items-center justify-center shrink-0",
                  isDone ? "bg-green-500/10" : isFailed ? "bg-destructive/10" : "bg-primary/10"
                )}>
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> :
                   isFailed ? <XCircle className="h-3.5 w-3.5 text-destructive" /> :
                   isActive ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" /> :
                   <Zap className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{planName || "Execution"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{intent?.replace(/_/g, " ")}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Objective */}
              {objective && (
                <p className="text-[11px] text-muted-foreground/70 line-clamp-2">{objective}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard icon={Coins} label="Cost" value={`${totalCredits} N`} color="text-primary" />
                <StatCard icon={Clock} label="Timp" value={`${elapsed}s`} color="text-muted-foreground" />
                <StatCard icon={Package} label="Outputs" value={`${outputs.length}`} color="text-green-500" />
                <StatCard icon={Coins} label="Balanță" value={`${balance.toLocaleString()}`} color="text-amber-500" />
              </div>

              {/* Progress */}
              {steps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Progres</span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">{completedSteps}/{steps.length}</span>
                  </div>
                  <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        isDone ? "bg-green-500" : isFailed ? "bg-destructive" : "bg-primary"
                      )}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Steps */}
              {steps.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Pași</span>
                  <div className="space-y-0.5">
                    {steps.map((step) => (
                      <StepRow key={step.id} step={step} />
                    ))}
                  </div>
                </div>
              )}

              {/* Done actions */}
              {isDone && (
                <div className="space-y-1.5 pt-2 border-t border-border/20">
                  {outputs.length > 0 && (
                    <button
                      onClick={onViewOutputs}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-medium transition-colors"
                    >
                      <Package className="h-3.5 w-3.5" />
                      <span>Vezi rezultatele ({outputs.length})</span>
                      <ChevronRight className="h-3 w-3 ml-auto" />
                    </button>
                  )}
                  <button
                    onClick={onSaveTemplate}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground text-xs font-medium transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Salvează ca template</span>
                  </button>
                  <button
                    onClick={onRerun}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground text-xs font-medium transition-colors"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Rulează din nou</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 right-0 w-[300px] z-50 border-l border-border bg-card shadow-xl overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <span className="text-xs font-bold">Execution Context</span>
                <button onClick={() => setIsOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {steps.length > 0 && (
                  <div className="space-y-0.5">
                    {steps.map((step) => (
                      <StepRow key={step.id} step={step} />
                    ))}
                  </div>
                )}
                {isDone && outputs.length > 0 && (
                  <button
                    onClick={onViewOutputs}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span>Vezi rezultatele ({outputs.length})</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Coins; label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-lg border border-border/20 bg-muted/10 p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className={cn("h-3 w-3", color)} />
        <span className="text-[10px] text-muted-foreground/60">{label}</span>
      </div>
      <p className={cn("text-sm font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}

function StepRow({ step }: { step: TaskStep }) {
  const statusIcon = {
    pending: <div className="h-2 w-2 rounded-full bg-border/60" />,
    running: <Loader2 className="h-3 w-3 text-primary animate-spin" />,
    completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
    failed: <XCircle className="h-3 w-3 text-destructive" />,
    skipped: <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />,
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors",
      step.status === "running" && "bg-primary/[0.04]",
    )}>
      <div className="shrink-0">{statusIcon[step.status]}</div>
      <span className={cn(
        "truncate flex-1",
        step.status === "completed" ? "text-foreground" :
        step.status === "running" ? "text-primary font-medium" :
        step.status === "failed" ? "text-destructive" :
        "text-muted-foreground/60"
      )}>
        {step.label}
      </span>
      {step.credits > 0 && (
        <span className="text-[9px] tabular-nums text-muted-foreground/40 shrink-0">{step.credits}N</span>
      )}
    </div>
  );
}
