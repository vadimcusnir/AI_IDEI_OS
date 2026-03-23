/**
 * ExecutionStatusBar — Persistent status strip showing live execution phase,
 * route info, and credit consumption.
 * Sits between the header and the message area.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, CheckCircle2, XCircle, Shield,
  Coins, Clock, Zap, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandPhase } from "@/hooks/useCommandState";

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
  idle: { label: "Ready", icon: Shield, color: "text-muted-foreground", bg: "bg-muted/50" },
  planning: { label: "Planning execution...", icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/5", animate: true },
  confirming: { label: "Awaiting confirmation", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/5" },
  executing: { label: "Executing", icon: Zap, color: "text-primary", bg: "bg-primary/5", animate: true },
  delivering: { label: "Delivering outputs", icon: Loader2, color: "text-green-500", bg: "bg-green-500/5", animate: true },
  storing: { label: "Storing to memory", icon: Loader2, color: "text-purple-500", bg: "bg-purple-500/5", animate: true },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/5" },
  failed: { label: "Failed", icon: XCircle, color: "text-destructive", bg: "bg-destructive/5" },
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
        className={cn("border-b border-border overflow-hidden", config.bg)}
      >
        <div className="px-4 py-1.5 flex items-center gap-3">
          {/* Phase indicator */}
          <div className="flex items-center gap-1.5">
            <Icon className={cn("h-3 w-3", config.color, config.animate && "animate-spin")} />
            <span className={cn("text-[10px] font-medium", config.color)}>
              {config.label}
            </span>
          </div>

          {/* Intent badge */}
          {intent && (
            <Badge variant="outline" className="text-[8px] h-4 px-1.5">
              {intent.replace(/_/g, " ")}
            </Badge>
          )}

          {/* Progress */}
          {totalSteps > 0 && (phase === "executing" || phase === "delivering") && (
            <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
              <div className="h-1 flex-1 bg-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[8px] text-muted-foreground shrink-0">
                {stepsCompleted}/{totalSteps}
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Credits */}
          {totalCredits > 0 && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Coins className="h-2.5 w-2.5" />
              <span>{totalCredits} N</span>
            </div>
          )}

          {/* Elapsed time */}
          {elapsed > 0 && phase === "executing" && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              <span>{elapsed}s</span>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <span className="text-[9px] text-destructive truncate max-w-[200px]">{errorMessage}</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
