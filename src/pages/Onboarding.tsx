import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Brain, Sparkles, TrendingUp, BookOpen,
  Check, ArrowRight, Loader2, Play,
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
    title: "Upload Your First Content",
    desc: "Go to the Extractor and upload an audio file, paste text, or enter a YouTube URL. The system will transcribe and prepare your content.",
    icon: Upload,
    action: "/extractor",
    actionLabel: "Open Extractor",
    checkField: "episodes" as keyof StepStatus,
    example: "Drag an MP3 file, paste a YouTube link, or type/paste text directly.",
  },
  {
    key: "extract",
    title: "Extract Knowledge Neurons",
    desc: "The AI analyzes your content and pulls out atomic knowledge units — insights, patterns, formulas, and frameworks. Each one is reusable forever.",
    icon: Brain,
    action: "/neurons",
    actionLabel: "View Neurons",
    checkField: "neurons" as keyof StepStatus,
    example: "From one episode, you might get: 5 insights + 3 patterns + 2 formulas + 1 framework.",
  },
  {
    key: "execute",
    title: "Run Your First AI Service",
    desc: "Pick a service from the catalog — article writer, strategy generator, copywriting engine — and let AI transform your neurons into professional deliverables.",
    icon: Sparkles,
    action: "/services",
    actionLabel: "Explore Services",
    checkField: "jobs" as keyof StepStatus,
    example: "Select 'Article Writer' → pick 3 neurons → get a 1500-word article in 2 minutes.",
  },
  {
    key: "capitalize",
    title: "Review & Reuse Your Artifacts",
    desc: "Every generated output is saved in your Library. Edit, export, or use them as building blocks for more complex deliverables.",
    icon: TrendingUp,
    action: "/library",
    actionLabel: "Open Library",
    checkField: "artifacts" as keyof StepStatus,
    example: "Your library grows with every service run. 10 runs = 50+ professional deliverables.",
  },
];

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StepStatus>({ episodes: 0, neurons: 0, jobs: 0, artifacts: 0 });
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !currentWorkspace) { setLoading(false); return; }
    loadStatus();
  }, [user, authLoading, currentWorkspace]);

  const loadStatus = async () => {
    const wsId = currentWorkspace!.id;
    const [ep, ne, jo, ar] = await Promise.all([
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
    ]);

    const s = {
      episodes: ep.count ?? 0,
      neurons: ne.count ?? 0,
      jobs: jo.count ?? 0,
      artifacts: ar.count ?? 0,
    };
    setStatus(s);

    // Auto-select first incomplete step (skip step 0 "learn" which has no checkField)
    const firstIncomplete = STEPS.findIndex(step => step.checkField && s[step.checkField] === 0);
    setActiveStep(firstIncomplete >= 0 ? firstIncomplete : STEPS.length - 1);
    setLoading(false);
  };

  const completedCount = STEPS.filter(s => s.checkField && status[s.checkField!] > 0).length;
  const totalCheckable = STEPS.filter(s => s.checkField).length;
  const progressPercent = Math.round((completedCount / totalCheckable) * 100);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <SEOHead title="Onboarding — AI-IDEI" description="Get started with AI-IDEI: upload content, extract neurons, run AI services." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">Get Started with AI-IDEI</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Follow these 4 steps to turn your content into structured knowledge assets.
            Each step builds on the previous one.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Progress</span>
            <span className="text-xs font-mono font-bold text-primary">{completedCount}/{totalCheckable} completed</span>
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
            const isCompleted = step.checkField ? status[step.checkField] > 0 : false;
            const isActive = idx === activeStep;

            return (
              <div
                key={step.key}
                onClick={() => setActiveStep(idx)}
                className={cn(
                  "rounded-xl border transition-all duration-200 cursor-pointer",
                  isActive
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : isCompleted
                    ? "border-border bg-card"
                    : "border-border bg-card hover:border-primary/20"
                )}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    isCompleted ? "bg-primary/10" : isActive ? "bg-primary/10" : "bg-muted"
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
                          ✓ Done
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold mt-0.5">{step.title}</h3>
                  </div>

                  <ArrowRight className={cn(
                    "h-4 w-4 text-muted-foreground/40 transition-transform",
                    isActive && "rotate-90"
                  )} />
                </div>

                {isActive && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="pl-14 space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>

                      {/* Example callout */}
                      <div className="rounded-lg bg-muted/50 border border-border/50 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Play className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Example</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic">{step.example}</p>
                      </div>

                      {isCompleted && step.checkField && (
                        <p className="text-xs text-primary font-medium">
                          {status[step.checkField]} {step.checkField} created
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
        {completedCount === totalCheckable && (
          <div className="mt-8 p-6 rounded-2xl border-2 border-primary/30 bg-primary/5 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-serif font-bold mb-1.5">Your pipeline is active! 🎉</h2>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              You've completed all steps. Keep uploading content and running services to grow your knowledge library.
            </p>
            <Button onClick={() => navigate("/home")} className="gap-2">
              Back to Cockpit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
