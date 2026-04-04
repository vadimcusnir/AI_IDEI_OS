import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, Edit3, AlertTriangle, CheckCircle2, Coins,
  Clock, Layers, ChevronDown, ChevronUp, Zap,
  Brain, Globe, FileText, Search, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface PlanStep {
  tool: string;
  label: string;
  credits: number;
  agent?: string;
}

export interface ExecutionPlan {
  action_id: string | null;
  intent: string;
  confidence: number;
  plan_name: string;
  total_credits: number;
  steps: PlanStep[];
  objective?: string;
  output_preview?: string[];
  risks?: string[];
}

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
};

interface PlanPreviewProps {
  plan: ExecutionPlan | null;
  balance: number;
  onExecute: () => void;
  onEdit: () => void;
  onDismiss: () => void;
  executing: boolean;
}

export function PlanPreview({ plan, balance, onExecute, onEdit, onDismiss, executing }: PlanPreviewProps) {
  const [expanded, setExpanded] = useState(true);

  if (!plan) return null;

  const canAfford = balance >= plan.total_credits;
  const confidenceColor = plan.confidence >= 0.8 ? "text-success" : plan.confidence >= 0.5 ? "text-warning" : "text-destructive";
  const confidenceLabel = plan.confidence >= 0.8 ? "High" : plan.confidence >= 0.5 ? "Medium" : "Low";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="border border-primary/20 bg-primary/[0.03] rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-tight">{plan.plan_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-micro text-muted-foreground">
                  {plan.intent.replace(/_/g, " ")}
                </span>
                <Badge variant="outline" className={cn("text-nano h-4 px-1.5", confidenceColor)}>
                  {confidenceLabel} ({(plan.confidence * 100).toFixed(0)}%)
                </Badge>
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground p-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Objective */}
              {plan.objective && (
                <div className="px-4 pb-2">
                  <p className="text-micro text-muted-foreground">{plan.objective}</p>
                </div>
              )}

              {/* Steps */}
              <div className="px-4 pb-3 space-y-1">
                <p className="text-nano font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Execution Steps
                </p>
                {plan.steps.map((step, i) => {
                  const Icon = TOOL_ICONS[step.tool] || Zap;
                  return (
                    <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg bg-background/50">
                      <span className="text-nano text-muted-foreground font-mono w-4">{i + 1}</span>
                      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-dense flex-1">{step.label}</span>
                      {step.credits > 0 && (
                        <span className="text-nano text-muted-foreground">{step.credits} N</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Output preview */}
              {plan.output_preview && plan.output_preview.length > 0 && (
                <div className="px-4 pb-3">
                  <p className="text-nano font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Expected Outputs
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {plan.output_preview.map((o, i) => (
                      <Badge key={i} variant="secondary" className="text-nano h-5">
                        {o}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost + Actions */}
              <div className="px-4 py-3 border-t border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold">{plan.total_credits}</span>
                    <span className="text-micro text-muted-foreground">NEURONS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-micro text-muted-foreground">~{plan.steps.length * 5}s</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-micro" onClick={onDismiss}>
                    Dismiss
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-micro gap-1" onClick={onEdit}>
                    <Edit3 className="h-3 w-3" />
                    Refine
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-micro gap-1"
                    onClick={onExecute}
                    disabled={!canAfford || executing}
                  >
                    {executing ? (
                      <>
                        <Zap className="h-3 w-3 animate-pulse" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        Execute
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Insufficient balance warning */}
              {!canAfford && (
                <div className="px-4 pb-3 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-micro">
                    Insufficient balance ({balance} N). Need {plan.total_credits} NEURONS.
                  </span>
                </div>
              )}

              {/* Cancellation clarity (A7) */}
              <div className="px-4 pb-3 flex items-center gap-2">
                <Shield className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                <span className="text-nano text-muted-foreground/60">
                  No credits charged until execution completes successfully. Dismiss to cancel free.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
