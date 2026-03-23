/**
 * ExecutionSummary — Rich completion card injected into the chat stream
 * after a run completes. Shows metrics, outputs, and actionable next steps.
 * Replaces the generic "completed" toast with a structured in-flow summary.
 */

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, Clock, Coins, Layers,
  FileText, Brain, Sparkles, ArrowRight, Save,
  RotateCcw, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandPhase } from "@/hooks/useCommandState";

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
        "rounded-xl border overflow-hidden mx-2",
        isSuccess
          ? "border-green-500/20 bg-green-500/[0.02]"
          : "border-destructive/20 bg-destructive/[0.02]"
      )}
    >
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center gap-2.5">
        {isSuccess ? (
          <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0" />
        ) : (
          <XCircle className="h-4.5 w-4.5 text-destructive shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold truncate">
            {isSuccess ? "Execution Complete" : "Execution Failed"}
          </p>
          <p className="text-[9px] text-muted-foreground truncate">
            {planName || intent.replace(/_/g, " ")}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[8px] h-4 shrink-0",
            isSuccess ? "border-green-500/30 text-green-500" : "border-destructive/30 text-destructive"
          )}
        >
          {isSuccess ? `${successRate}% success` : "FAILED"}
        </Badge>
      </div>

      {/* Metrics strip */}
      <div className="px-4 py-2 border-t border-border/50 flex items-center gap-4">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Layers className="h-3 w-3" />
          <span>{stepsCompleted}/{totalSteps} steps</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Coins className="h-3 w-3" />
          <span>{totalCredits} N</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{durationSeconds}s</span>
        </div>
        {outputCount > 0 && (
          <div className="flex items-center gap-1 text-[9px] text-primary font-medium">
            <FileText className="h-3 w-3" />
            <span>{outputCount} outputs</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="px-4 py-2 border-t border-destructive/10 bg-destructive/5">
          <p className="text-[10px] text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Quick actions */}
      {isSuccess && (
        <div className="px-4 py-2.5 border-t border-border/50 flex items-center gap-2 flex-wrap">
          {outputCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[9px] gap-1"
              onClick={onViewOutputs}
            >
              <FileText className="h-2.5 w-2.5" />
              View Outputs
            </Button>
          )}
          {outputCount > 1 && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[9px] gap-1"
              onClick={onSaveAllOutputs}
            >
              <Save className="h-2.5 w-2.5" />
              Save All
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[9px] gap-1"
            onClick={onSaveTemplate}
          >
            <TrendingUp className="h-2.5 w-2.5" />
            Save Workflow
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[9px] gap-1"
            onClick={onRerun}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Re-run
          </Button>
        </div>
      )}

      {/* Failed: retry action */}
      {!isSuccess && (
        <div className="px-4 py-2.5 border-t border-border/50 flex items-center gap-2">
          <Button
            size="sm"
            className="h-6 text-[9px] gap-1"
            onClick={onRerun}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Retry
          </Button>
        </div>
      )}
    </motion.div>
  );
}
