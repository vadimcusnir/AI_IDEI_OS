/**
 * ExecutionStatusBar — Premium status strip showing live execution phase.
 * Matches the Home page's aesthetic with subtle gradients and backdrop blur.
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, XCircle, Shield,
  Coins, Clock, Zap, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandPhase } from "@/stores/executionStore";

interface ExecutionStatusBarProps {
  phase: CommandPhase;
  intent: string;
  totalCredits: number;
  stepsCompleted: number;
  totalSteps: number;
  startedAt: string | null;
  errorMessage: string | null;
}

const PHASE_CONFIG: Record<CommandPhase, {
  label: string;
  icon: typeof Loader2;
  color: string;
  bg: string;
  animate?: boolean;
}> = {
  idle: { label: "Ready", icon: Shield, color: "text-muted-foreground", bg: "bg-transparent" },
  planning: { label: "Planning execution...", icon: Loader2, color: "text-primary", bg: "bg-primary/[0.03]", animate: true },
  confirming: { label: "Awaiting confirmation", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/[0.03]" },
  executing: { label: "Executing", icon: Zap, color: "text-primary", bg: "bg-primary/[0.03]", animate: true },
  delivering: { label: "Delivering outputs", icon: Loader2, color: "text-success", bg: "bg-success/[0.03]", animate: true },
  storing: { label: "Storing to memory", icon: Loader2, color: "text-primary", bg: "bg-primary/[0.03]", animate: true },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-success", bg: "bg-success/[0.03]" },
  failed: { label: "Failed", icon: XCircle, color: "text-destructive", bg: "bg-destructive/[0.03]" },
};

export function ExecutionStatusBar({
  phase, intent, totalCredits, stepsCompleted, totalSteps, startedAt, errorMessage,
}: ExecutionStatusBarProps) {
  if (phase === "idle") return null;

  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  const elapsed = startedAt ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : 0;
  const progress = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={cn("border-b border-border/30 overflow-hidden backdrop-blur-sm", config.bg)}
      >
        <div className="px-4 sm:px-6 py-2 flex items-center gap-3">
          {/* Phase indicator */}
          <div className="flex items-center gap-2">
            <Icon className={cn("h-3.5 w-3.5", config.color, config.animate && "animate-spin")} />
            <span className={cn("text-xs font-medium", config.color)}>
              {config.label}
            </span>
          </div>

          {/* Intent */}
          {intent && (
            <span className="text-micro font-medium text-muted-foreground/70 px-2 py-0.5 rounded-full bg-muted/50 border border-border/30">
              {intent.replace(/_/g, " ")}
            </span>
          )}

          {/* Progress bar */}
          {totalSteps > 0 && (phase === "executing" || phase === "delivering") && (
            <div className="flex items-center gap-2 flex-1 max-w-[140px]">
              <div className="h-1.5 flex-1 bg-border/40 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-micro tabular-nums text-muted-foreground shrink-0">
                {stepsCompleted}/{totalSteps}
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Credits */}
          {totalCredits > 0 && (
            <div className="flex items-center gap-1 text-micro text-muted-foreground tabular-nums">
              <Coins className="h-3 w-3" />
              <span>{totalCredits} N</span>
            </div>
          )}

          {/* Elapsed time */}
          {elapsed > 0 && phase === "executing" && (
            <div className="flex items-center gap-1 text-micro text-muted-foreground tabular-nums">
              <Clock className="h-3 w-3" />
              <span>{elapsed}s</span>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <span className="text-micro text-destructive truncate max-w-[200px]">{errorMessage}</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
