/**
 * ExecutionRightPanel — Cost/progress/outputs tracker.
 * Shows during active execution and completed states.
 */
import { motion } from "framer-motion";
import {
  Coins, Clock, CheckCircle2, XCircle,
  Package, TrendingUp, Loader2, Zap,
  ChevronRight, Save, ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionState, TaskStep } from "@/stores/executionStore";

interface ExecutionRightPanelProps {
  execution: ExecutionState;
  outputCount: number;
  balance: number;
  onSaveTemplate: () => void;
  onViewOutputs: () => void;
}

export function ExecutionRightPanel({
  execution, outputCount, balance, onSaveTemplate, onViewOutputs,
}: ExecutionRightPanelProps) {
  const { phase, steps, totalCredits, startedAt, completedAt, planName, intent, objective } = execution;

  if (phase === "idle") return null;

  const elapsed = startedAt
    ? Math.round(((completedAt ? new Date(completedAt).getTime() : Date.now()) - new Date(startedAt).getTime()) / 1000)
    : 0;
  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const isActive = phase === "executing" || phase === "delivering" || phase === "planning";
  const isDone = phase === "completed";
  const isFailed = phase === "failed";

  return (
    <div
      className="hidden lg:flex flex-col h-full w-[280px] border-l border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden shrink-0"
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Plan header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-6 w-6 rounded-lg flex items-center justify-center",
              isDone ? "bg-success/10" : isFailed ? "bg-destructive/10" : "bg-primary/10"
            )}>
              {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> :
               isFailed ? <XCircle className="h-3.5 w-3.5 text-destructive" /> :
               <Zap className="h-3.5 w-3.5 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{planName || "Execution"}</p>
              <p className="text-micro text-muted-foreground truncate">{intent?.replace(/_/g, " ")}</p>
            </div>
          </div>
          {objective && (
            <p className="text-dense text-muted-foreground/70 line-clamp-2 pl-8">{objective}</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={Coins} label="Cost" value={`${totalCredits} N`} color="text-primary" />
          <StatCard icon={Clock} label="Timp" value={`${elapsed}s`} color="text-muted-foreground" />
          <StatCard icon={Package} label="Outputs" value={`${outputCount}`} color="text-success" />
          <StatCard icon={TrendingUp} label="Balanță" value={`${balance.toLocaleString()}`} color="text-warning" />
        </div>

        {/* Progress */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground/50">
                Progres
              </span>
              <span className="text-micro tabular-nums text-muted-foreground">
                {completedSteps}/{steps.length}
              </span>
            </div>
            <div className="h-2 bg-border/30 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  isDone ? "bg-success" : isFailed ? "bg-destructive" : "bg-primary"
                )}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Step list */}
        {steps.length > 0 && (
          <div className="space-y-1">
            <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground/50">
              Pași execuție
            </span>
            <div className="space-y-0.5">
              {steps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isDone && (
          <div className="space-y-1.5 pt-2 border-t border-border/30">
            <button
              onClick={onViewOutputs}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-medium transition-colors"
            >
              <Package className="h-3.5 w-3.5" />
              <span>Vezi rezultatele ({outputCount})</span>
              <ChevronRight className="h-3 w-3 ml-auto" />
            </button>
            <button
              onClick={onSaveTemplate}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground text-xs font-medium transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvează ca template</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Coins; label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("h-3 w-3", color)} />
        <span className="text-micro text-muted-foreground/60">{label}</span>
      </div>
      <p className={cn("text-sm font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}

function StepRow({ step }: { step: TaskStep }) {
  const statusIcon = {
    pending: <div className="h-2 w-2 rounded-full bg-border/60" />,
    running: <Loader2 className="h-3 w-3 text-primary animate-spin" />,
    completed: <CheckCircle2 className="h-3 w-3 text-success" />,
    failed: <XCircle className="h-3 w-3 text-destructive" />,
    skipped: <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />,
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-md text-dense transition-colors",
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
        <span className="text-nano tabular-nums text-muted-foreground/40 shrink-0">{step.credits}N</span>
      )}
    </div>
  );
}
