import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Brain, Sparkles, TrendingUp,
  Check, ArrowRight, Loader2, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepStatus {
  episodes: number;
  neurons: number;
  jobs: number;
  artifacts: number;
}

const STEPS = [
  {
    key: "upload",
    title: "Upload Content",
    desc: "Add a podcast, text, or video. The platform will transcribe and prepare the content for extraction.",
    icon: Upload,
    action: "/extractor",
    actionLabel: "Open Extractor",
    checkField: "episodes" as keyof StepStatus,
  },
  {
    key: "extract",
    title: "Extract Neurons",
    desc: "The system analyzes the content and extracts atomic knowledge units: frameworks, patterns, formulas.",
    icon: Brain,
    action: "/neurons",
    actionLabel: "View Neurons",
    checkField: "neurons" as keyof StepStatus,
  },
  {
    key: "execute",
    title: "Run AI Services",
    desc: "Combine neurons with AI services to generate articles, strategies, copywriting, and other deliverables.",
    icon: Sparkles,
    action: "/services",
    actionLabel: "Explore Services",
    checkField: "jobs" as keyof StepStatus,
  },
  {
    key: "capitalize",
    title: "Capitalize Expertise",
    desc: "Access your library of generated artifacts. Reuse, publish, and monetize your knowledge.",
    icon: TrendingUp,
    action: "/library",
    actionLabel: "Library",
    checkField: "artifacts" as keyof StepStatus,
  },
];

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StepStatus>({ episodes: 0, neurons: 0, jobs: 0, artifacts: 0 });
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;
    loadStatus();
  }, [user, authLoading]);

  const loadStatus = async () => {
    const [ep, ne, jo, ar] = await Promise.all([
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
      supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
    ]);

    const s = {
      episodes: ep.count ?? 0,
      neurons: ne.count ?? 0,
      jobs: jo.count ?? 0,
      artifacts: ar.count ?? 0,
    };
    setStatus(s);

    // Auto-select first incomplete step
    const firstIncomplete = STEPS.findIndex(step => s[step.checkField] === 0);
    setActiveStep(firstIncomplete >= 0 ? firstIncomplete : STEPS.length - 1);
    setLoading(false);
  };

  const completedCount = STEPS.filter(s => status[s.checkField] > 0).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">Your Knowledge Pipeline</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Transform expertise into reusable digital assets. Follow the 4 steps to unlock the full potential.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Progress</span>
            <span className="text-xs font-mono font-bold text-primary">{completedCount}/{STEPS.length} completed</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = status[step.checkField] > 0;
            const isActive = idx === activeStep;
            const isLocked = idx > 0 && status[STEPS[idx - 1].checkField] === 0 && !isCompleted;

            return (
              <div
                key={step.key}
                onClick={() => !isLocked && setActiveStep(idx)}
                className={cn(
                  "rounded-xl border transition-all duration-200 cursor-pointer",
                  isActive
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : isCompleted
                    ? "border-border bg-card"
                    : isLocked
                    ? "border-border/50 bg-muted/30 opacity-60 cursor-not-allowed"
                    : "border-border bg-card hover:border-primary/20"
                )}
              >
                {/* Step header */}
                <div className="flex items-center gap-4 p-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    isCompleted
                      ? "bg-primary/10"
                      : isActive
                      ? "bg-primary/10"
                      : "bg-muted"
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50">
                        Step {idx + 1}
                      </span>
                      {isCompleted && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold mt-0.5">{step.title}</h3>
                  </div>

                  <ChevronRight className={cn(
                    "h-4 w-4 text-muted-foreground/40 transition-transform",
                    isActive && "rotate-90"
                  )} />
                </div>

                {/* Expanded content */}
                {isActive && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="pl-14">
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{step.desc}</p>

                      {isCompleted && (
                        <p className="text-xs text-primary font-medium mb-3">
                          {status[step.checkField]} {step.checkField === "episodes" ? "episodes" : step.checkField === "neurons" ? "neurons" : step.checkField === "jobs" ? "jobs" : "artifacts"} created
                        </p>
                      )}

                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        className="gap-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(step.action);
                        }}
                      >
                        {step.actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion CTA */}
        {completedCount === STEPS.length && (
          <div className="mt-8 p-6 rounded-2xl border-2 border-primary/30 bg-primary/5 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-serif font-bold mb-1.5">Pipeline-ul tău este activ! 🎉</h2>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Ai completat toți pașii. Continuă să încarci conținut și să rulezi servicii pentru a-ți maximiza capitalul intelectual.
            </p>
            <Button onClick={() => navigate("/home")} className="gap-2">
              Înapoi la Cockpit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
