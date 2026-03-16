import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Brain, Sparkles, TrendingUp,
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, Rocket,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fireStepConfetti, fireFinalConfetti } from "@/components/onboarding/useConfetti";

interface StepDef {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  route: string;
}

const STEPS: StepDef[] = [
  {
    id: "upload",
    icon: Upload,
    label: "Upload Content",
    description: "Add your first episode — audio, video, or text",
    route: "/extractor",
  },
  {
    id: "neuron",
    icon: Brain,
    label: "Create a Neuron",
    description: "Extract an atomic knowledge unit",
    route: "/neurons",
  },
  {
    id: "service",
    icon: Sparkles,
    label: "Run an AI Service",
    description: "Generate deliverables from your neurons",
    route: "/services",
  },
  {
    id: "library",
    icon: TrendingUp,
    label: "Review Library",
    description: "View your generated artifacts",
    route: "/library",
  },
];

export function OnboardingChecklist() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const prevCompletedRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !currentWorkspace) { setLoading(false); return; }

    const isDismissed = localStorage.getItem(`onboarding_dismissed_${user.id}`);
    if (isDismissed === "true") {
      setDismissed(true);
      setLoading(false);
      return;
    }

    checkSteps();
  }, [user, currentWorkspace]);

  const checkSteps = async () => {
    if (!currentWorkspace || !user) return;
    const wsId = currentWorkspace.id;
    const completed = new Set<string>();

    const [epRes, neRes, joRes, arRes] = await Promise.all([
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
    ]);

    const counts = [epRes.count ?? 0, neRes.count ?? 0, joRes.count ?? 0, arRes.count ?? 0];
    STEPS.forEach((step, i) => {
      if (counts[i] > 0) completed.add(step.id);
    });

    setCompletedSteps(completed);
    setLoading(false);
  };

  const progress = completedSteps.size / STEPS.length;
  const allDone = completedSteps.size === STEPS.length;

  if (!user || loading || dismissed || allDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden mb-6"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Getting Started</h3>
            <p className="text-[10px] text-muted-foreground">
              {completedSteps.size}/{STEPS.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress segments */}
          <div className="flex items-center gap-0.5">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "h-1.5 w-5 rounded-full transition-colors",
                  completedSteps.has(step.id) ? "bg-primary" : "bg-muted-foreground/15"
                )}
              />
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem(`onboarding_dismissed_${user!.id}`, "true");
              setDismissed(true);
            }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1">
              {STEPS.map((step, idx) => {
                const done = completedSteps.has(step.id);
                const isNext = !done && !STEPS.slice(0, idx).some(s => !completedSteps.has(s.id));

                return (
                  <button
                    key={step.id}
                    onClick={() => navigate(step.route)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group",
                      done
                        ? "bg-primary/5 text-muted-foreground"
                        : isNext
                        ? "bg-primary/5 hover:bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Circle className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isNext ? "text-primary/50" : "text-muted-foreground/30 group-hover:text-primary/50"
                      )} />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-xs font-medium",
                        done && "line-through text-muted-foreground/60"
                      )}>
                        {step.label}
                      </span>
                      <p className="text-[10px] text-muted-foreground/60 truncate">{step.description}</p>
                    </div>
                    {!done && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-[10px] font-medium transition-opacity",
                        isNext ? "text-primary opacity-100" : "text-primary opacity-0 group-hover:opacity-100"
                      )}>
                        Start <ArrowRight className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
