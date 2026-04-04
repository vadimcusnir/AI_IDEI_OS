import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Loader2, XCircle, Clock,
  Zap, Brain, FileText, Search, Globe, Coins,
  ChevronRight, SkipForward,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentStep {
  id: string;
  step_order: number;
  tool_name: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  credits_cost: number;
  duration_ms: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface AgentAction {
  id: string;
  intent_key: string;
  intent_confidence: number;
  status: string;
  total_credits_estimated: number;
  total_credits_spent: number;
  input_summary: string | null;
  created_at: string;
}

interface PlanMeta {
  action_id: string | null;
  intent: string;
  confidence: number;
  plan_name: string;
  total_credits: number;
  steps: Array<{ tool: string; label: string; credits: number }>;
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
  list_services: FileText,
  analyze_psychology: Brain,
  get_credit_balance: Coins,
  conversation: FileText,
};

const STATUS_CONFIG = {
  pending: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
  running: { icon: Loader2, color: "text-primary", bg: "bg-primary/10" },
  completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  failed: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  skipped: { icon: SkipForward, color: "text-muted-foreground", bg: "bg-muted" },
};

export function ExecutionTimeline({ planMeta }: { planMeta: PlanMeta | null }) {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [action, setAction] = useState<AgentAction | null>(null);

  // Load steps from plan meta initially
  useEffect(() => {
    if (!planMeta?.steps) return;
    const initialSteps: AgentStep[] = planMeta.steps.map((s, i) => ({
      id: `preview-${i}`,
      step_order: i,
      tool_name: s.tool,
      label: s.label,
      status: "pending" as const,
      credits_cost: s.credits,
      duration_ms: null,
      error_message: null,
      started_at: null,
      completed_at: null,
    }));
    setSteps(initialSteps);
  }, [planMeta?.steps]);

  // Subscribe to realtime step updates
  useEffect(() => {
    if (!planMeta?.action_id) return;
    const actionId = planMeta.action_id;

    // Load real steps
    supabase.from("agent_steps").select("*")
      .eq("action_id", actionId)
      .order("step_order")
      .then(({ data }) => {
        if (data && data.length > 0) setSteps(data as AgentStep[]);
      });

    // Load action
    supabase.from("agent_actions").select("*")
      .eq("id", actionId)
      .single()
      .then(({ data }) => {
        if (data) setAction(data as AgentAction);
      });

    // Realtime subscriptions
    const stepsChannel = supabase
      .channel(`agent-steps-${actionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_steps", filter: `action_id=eq.${actionId}` },
        (payload) => {
          const updated = payload.new as AgentStep;
          setSteps(prev => prev.map(s => s.tool_name === updated.tool_name ? updated : s));
        }
      ).subscribe();

    const actionChannel = supabase
      .channel(`agent-action-${actionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "agent_actions", filter: `id=eq.${actionId}` },
        (payload) => setAction(payload.new as AgentAction)
      ).subscribe();

    return () => {
      supabase.removeChannel(stepsChannel);
      supabase.removeChannel(actionChannel);
    };
  }, [planMeta?.action_id]);

  if (!planMeta || steps.length === 0) return null;

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const isComplete = action?.status === "completed" || action?.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="text-micro font-bold uppercase tracking-wider">{planMeta.plan_name}</p>
              <p className="text-nano text-muted-foreground">
                {planMeta.intent.replace(/_/g, " ")} · {(planMeta.confidence * 100).toFixed(0)}% confidence
              </p>
            </div>
          </div>
          <Badge variant={isComplete ? "default" : "secondary"} className="text-nano h-5">
            {isComplete ? "Done" : `${completedSteps}/${steps.length}`}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Cost summary */}
        <div className="flex items-center justify-between mt-2 text-nano text-muted-foreground">
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {planMeta.total_credits} NEURONS estimated
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {steps.length} steps
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        <AnimatePresence mode="popLayout">
          {steps.map((step, idx) => {
            const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            const ToolIcon = TOOL_ICONS[step.tool_name] || Zap;
            const isRunning = step.status === "running";

            return (
              <motion.div
                key={step.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "flex items-start gap-3 py-2 px-3 rounded-lg transition-colors",
                  isRunning && "bg-primary/5 border border-primary/20",
                  step.status === "completed" && "opacity-80",
                )}
              >
                {/* Timeline connector */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <div className={cn("h-5 w-5 rounded-full flex items-center justify-center", config.bg)}>
                    <StatusIcon className={cn("h-3 w-3", config.color, isRunning && "animate-spin")} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn(
                      "w-0.5 h-4",
                      step.status === "completed" ? "bg-green-500/30" : "bg-border"
                    )} />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ToolIcon className="h-3 w-3 text-muted-foreground" />
                      <p className="text-dense font-medium">{step.label}</p>
                    </div>
                    {step.credits_cost > 0 && (
                      <span className="text-nano text-muted-foreground">{step.credits_cost} N</span>
                    )}
                  </div>

                  {step.duration_ms && (
                    <p className="text-nano text-muted-foreground mt-0.5">
                      {(step.duration_ms / 1000).toFixed(1)}s
                    </p>
                  )}

                  {step.error_message && (
                    <p className="text-nano text-destructive mt-0.5">{step.error_message}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
