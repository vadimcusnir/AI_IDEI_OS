import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Circle, Loader2, XCircle, SkipForward,
  Clock, Coins, ChevronDown, ChevronUp, Zap,
  Brain, Globe, FileText, Search, Target,
  BookOpen, Layers, AlertTriangle, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { ExecutionState, TaskStep, CommandPhase } from "@/stores/executionStore";

const TOOL_ICONS: Record<string, typeof Brain> = {
  transcribe_source: Globe,
  chunk_transcript: FileText,
  extract_neurons: Brain,
  deep_extract: Brain,
  extract_guests: Search,
  embed_neurons: Zap,
  dedup_neurons: Zap,
  create_job: Zap,
  search_neurons: Search,
  analyze_psychology: Brain,
  conversation: FileText,
  list_recent_neurons: BookOpen,
  list_episodes: Layers,
  get_credit_balance: Coins,
  list_services: Target,
  search_guests: Search,
  get_user_memory: Brain,
};

const STATUS_CONFIG: Record<TaskStep["status"], { icon: typeof Circle; color: string; label: string }> = {
  pending: { icon: Circle, color: "text-muted-foreground", label: "Pending" },
  running: { icon: Loader2, color: "text-primary", label: "Running" },
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Done" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  skipped: { icon: SkipForward, color: "text-muted-foreground/50", label: "Skipped" },
};

const PHASE_CONFIG: Record<CommandPhase, { label: string; color: string }> = {
  idle: { label: "Ready", color: "bg-muted text-muted-foreground" },
  planning: { label: "Planning...", color: "bg-blue-500/10 text-blue-500" },
  confirming: { label: "Awaiting Confirmation", color: "bg-yellow-500/10 text-yellow-500" },
  executing: { label: "Executing", color: "bg-primary/10 text-primary" },
  delivering: { label: "Delivering", color: "bg-green-500/10 text-green-500" },
  storing: { label: "Saving to Memory", color: "bg-purple-500/10 text-purple-500" },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-500" },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive" },
};

interface TaskTreeProps {
  execution: ExecutionState;
  onSaveTemplate?: () => void;
}

export function TaskTree({ execution, onSaveTemplate }: TaskTreeProps) {
  const [expanded, setExpanded] = useState(true);

  if (execution.phase === "idle") return null;

  const completedSteps = execution.steps.filter(s => s.status === "completed").length;
  const totalSteps = execution.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const creditsUsed = execution.steps
    .filter(s => s.status === "completed")
    .reduce((sum, s) => sum + s.credits, 0);

  const phaseConfig = PHASE_CONFIG[execution.phase];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold">Task Tree</span>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground p-0.5">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Phase badge */}
        <Badge className={cn("text-nano h-5 mb-2", phaseConfig.color)}>
          {execution.phase === "executing" && <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />}
          {phaseConfig.label}
        </Badge>

        {/* Progress bar */}
        {totalSteps > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-nano text-muted-foreground">
              <span>{completedSteps}/{totalSteps} steps</span>
              <span className="flex items-center gap-0.5">
                <Coins className="h-2.5 w-2.5" />
                {creditsUsed}/{execution.totalCredits} N
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Plan info */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Objective */}
            <div className="px-3 py-2 border-b border-border">
              <p className="text-nano font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                Objective
              </p>
              <p className="text-dense">{execution.objective}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-nano h-4">
                  {execution.intent.replace(/_/g, " ")}
                </Badge>
                <span className="text-nano text-muted-foreground">
                  {(execution.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>

            {/* Step tree */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
              <p className="text-nano font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Execution Steps
              </p>
              {execution.steps.map((step, i) => {
                const ToolIcon = TOOL_ICONS[step.tool] || Zap;
                const statusCfg = STATUS_CONFIG[step.status];
                const StatusIcon = statusCfg.icon;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors",
                      step.status === "running" && "bg-primary/5 border border-primary/20",
                      step.status === "completed" && "bg-green-500/5",
                      step.status === "failed" && "bg-destructive/5",
                    )}
                  >
                    {/* Connector line */}
                    <div className="flex flex-col items-center w-4 shrink-0">
                      <StatusIcon className={cn(
                        "h-3.5 w-3.5",
                        statusCfg.color,
                        step.status === "running" && "animate-spin",
                      )} />
                      {i < execution.steps.length - 1 && (
                        <div className={cn(
                          "w-px h-3 mt-0.5",
                          step.status === "completed" ? "bg-green-500/30" : "bg-border",
                        )} />
                      )}
                    </div>

                    <ToolIcon className="h-3 w-3 text-muted-foreground shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-micro truncate",
                        step.status === "completed" && "text-muted-foreground",
                        step.status === "skipped" && "text-muted-foreground/50 line-through",
                      )}>
                        {step.label}
                      </p>
                      {step.error && (
                        <p className="text-nano text-destructive truncate">{step.error}</p>
                      )}
                    </div>

                    {step.credits > 0 && (
                      <span className="text-nano text-muted-foreground shrink-0">{step.credits}N</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Expected outputs */}
            {execution.outputPreview.length > 0 && (
              <div className="px-3 py-2 border-t border-border">
                <p className="text-nano font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Expected Outputs
                </p>
                <div className="flex flex-wrap gap-1">
                  {execution.outputPreview.map((o, i) => (
                    <Badge key={i} variant="secondary" className="text-nano h-4">{o}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Error state */}
            {execution.phase === "failed" && execution.errorMessage && (
              <div className="px-3 py-2 border-t border-destructive/20 bg-destructive/5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                  <p className="text-micro text-destructive">{execution.errorMessage}</p>
                </div>
              </div>
            )}

            {/* Save template action */}
            {execution.phase === "completed" && onSaveTemplate && (
              <div className="px-3 py-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-micro gap-1"
                  onClick={onSaveTemplate}
                >
                  <Save className="h-3 w-3" />
                  Save as Workflow Template
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
