/**
 * ExecutionSummary — Premium completion card.
 * Inline in chat stream, visually distinct.
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, Clock, Coins, Layers,
  FileText, Save, RotateCcw, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandPhase } from "@/stores/executionStore";

interface ExecutionSummaryProps {
  phase: CommandPhase;
  intent: string;
  planName: string;
  totalCredits: number;
  stepsCompleted: number;
  totalSteps: number;
  outputCount: number;
  durationSeconds: number;
  errorMessage: string | null;
  onSaveTemplate: () => void;
  onSaveAllOutputs: () => void;
  onRerun: () => void;
  onViewOutputs: () => void;
}

export function ExecutionSummary({
  phase, intent, planName, totalCredits, stepsCompleted, totalSteps,
  outputCount, durationSeconds, errorMessage,
  onSaveTemplate, onSaveAllOutputs, onRerun, onViewOutputs,
}: ExecutionSummaryProps) {
  if (phase !== "completed" && phase !== "failed") return null;

  const isSuccess = phase === "completed";
  const successRate = totalSteps > 0 ? Math.round((stepsCompleted / totalSteps) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "rounded-2xl border overflow-hidden",
        isSuccess
          ? "border-green-500/15 bg-gradient-to-b from-green-500/[0.03] to-transparent"
          : "border-destructive/15 bg-gradient-to-b from-destructive/[0.03] to-transparent"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        {isSuccess ? (
          <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {isSuccess ? "Execution Complete" : "Execution Failed"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {planName || intent.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-4 py-2.5 border-t border-border/30 flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          <span className="tabular-nums">{stepsCompleted}/{totalSteps} steps</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Coins className="h-3.5 w-3.5" />
          <span className="tabular-nums">{totalCredits} N</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums">{durationSeconds}s</span>
        </div>
        {outputCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <FileText className="h-3.5 w-3.5" />
            <span className="tabular-nums">{outputCount} outputs</span>
          </div>
        )}
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="px-4 py-2 border-t border-destructive/10">
          <p className="text-xs text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-border/30 flex items-center gap-2 flex-wrap">
        {isSuccess && outputCount > 0 && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onViewOutputs}>
            <FileText className="h-3 w-3" /> View Outputs
          </Button>
        )}
        {isSuccess && outputCount > 1 && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onSaveAllOutputs}>
            <Save className="h-3 w-3" /> Save All
          </Button>
        )}
        {isSuccess && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onSaveTemplate}>
            <TrendingUp className="h-3 w-3" /> Save Workflow
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onRerun}>
          <RotateCcw className="h-3 w-3" /> {isSuccess ? "Re-run" : "Retry"}
        </Button>
      </div>
    </motion.div>
  );
}
