import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { consumeRedirect } from "@/lib/authRedirect";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Upload, Brain, Sparkles,
  Check, ArrowRight, Loader2, Play, Zap, Gift, Crown, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { fireFinalConfetti } from "@/components/onboarding/useConfetti";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { InstantAnalysisFlow } from "@/components/onboarding/InstantAnalysisFlow";

interface StepStatus {
  episodes: number;
  neurons: number;
  artifacts: number;
}

const STEPS = [
  {
    key: "source",
    title: "Add Your Source",
    subtitle: "Upload or paste content",
    desc: "Drop an MP3, paste a YouTube link, or type text directly. AI transcribes and structures everything automatically.",
    icon: Upload,
    action: "/extractor",
    actionLabel: "Open Extractor",
    checkField: "episodes" as keyof StepStatus,
    reward: "+25 XP",
    gradient: "from-primary/20 to-primary/5",
    tip: "Tip: YouTube links get auto-transcribed with speaker detection.",
  },
  {
    key: "extract",
    title: "Extract Knowledge",
    subtitle: "AI finds patterns & insights",
    desc: "Our AI analyzes your content and extracts frameworks, insights, patterns, and reusable neurons — all automatically.",
    icon: Brain,
    action: "/neurons",
    actionLabel: "View Neurons",
    checkField: "neurons" as keyof StepStatus,
    reward: "+25 XP per neuron",
    gradient: "from-ai-accent/20 to-ai-accent/5",
    tip: "One episode typically yields 5-15 unique neurons.",
  },
  {
    key: "produce",
    title: "Generate Assets",
    subtitle: "Transform into deliverables",
    desc: "Run AI services to transform neurons into articles, strategies, reports, and professional assets — saved in your Library.",
    icon: Sparkles,
    action: "/services",
    actionLabel: "Explore Services",
    checkField: "artifacts" as keyof StepStatus,
    reward: "+15 XP per asset",
    gradient: "from-status-validated/20 to-status-validated/5",
    tip: "Start with 'Quick Extract' — it's the fastest way to see results.",
  },
];

export default function Onboarding() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StepStatus>({ episodes: 0, neurons: 0, artifacts: 0 });
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const prevAllDoneRef = useRef(false);

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) { setLoading(false); return; }
    loadStatus();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  const loadStatus = async () => {
    const wsId = currentWorkspace!.id;
    const [ep, ne, ar] = await Promise.all([
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
    ]);

    const s = {
      episodes: ep.count ?? 0,
      neurons: ne.count ?? 0,
      artifacts: ar.count ?? 0,
    };
    setStatus(s);

    const firstIncomplete = STEPS.findIndex(step => s[step.checkField] === 0);
    setActiveStep(firstIncomplete >= 0 ? firstIncomplete : STEPS.length - 1);
    setLoading(false);
  };

  const completedCount = STEPS.filter(s => status[s.checkField] > 0).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);
  const allDone = completedCount === STEPS.length;

  // Fire confetti when all steps complete
  const { updateFlag } = useOnboardingState();
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      fireFinalConfetti();
      updateFlag("checklist_completed", true);
      trackInternalEvent({ event: AnalyticsEvents.ONBOARDING_COMPLETED });
    }
    prevAllDoneRef.current = allDone;
  }, [allDone]);

  if (authLoading || wsLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
    <OnboardingTutorial open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    <div className="flex-1 overflow-y-auto">
       <SEOHead title="Get Started — AI-IDEI" description="Transform your content into structured knowledge assets in 3 steps." />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--gold-oxide)/0.08)] text-[hsl(var(--gold-oxide))] text-micro font-semibold uppercase tracking-[0.15em] mb-5">
            <Zap className="h-3 w-3" />
            4 Steps to Knowledge Assets
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] mb-2.5">
            {t("onboarding.title")}
          </h1>
          <p className="text-sm text-muted-foreground/70 max-w-md mx-auto mb-4 leading-relaxed">
            {t("onboarding.subtitle")}
          </p>
          <Button variant="outline" size="sm" onClick={() => setTutorialOpen(true)} className="gap-1.5 text-xs border-border/50 hover:border-[hsl(var(--gold-oxide)/0.3)]">
            <BookOpen className="h-3.5 w-3.5" />
            Interactive Tutorial (+50 NEURONS)
          </Button>
        </motion.div>

        {/* Visual Progress Pipeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center gap-1 sm:gap-2">
            {STEPS.map((step, idx) => {
              const isCompleted = status[step.checkField] > 0;
              const isActive = idx === activeStep;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <button
                    onClick={() => setActiveStep(idx)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all",
                      isActive ? "bg-primary/10" : "hover:bg-muted/50",
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all border-2",
                      isCompleted
                        ? "bg-[hsl(var(--gold-oxide))] border-[hsl(var(--gold-oxide))] text-[hsl(var(--obsidian))]"
                        : isActive
                        ? "border-[hsl(var(--gold-oxide))] bg-[hsl(var(--gold-oxide)/0.08)] text-[hsl(var(--gold-oxide))]"
                        : "border-muted-foreground/15 bg-muted/50 text-muted-foreground/50"
                    )}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-nano sm:text-micro font-semibold tracking-wide",
                      isActive ? "text-[hsl(var(--gold-oxide))]" : isCompleted ? "text-foreground" : "text-muted-foreground/50"
                    )}>
                      {step.key.charAt(0).toUpperCase() + step.key.slice(1)}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      "h-0.5 w-3 sm:w-6 rounded-full transition-colors shrink-0",
                      status[STEPS[idx].checkField] > 0 ? "bg-[hsl(var(--gold-oxide))]" : "bg-muted-foreground/10"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Text progress */}
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-micro text-muted-foreground">{completedCount}/{STEPS.length} {t("onboarding.completed")}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[hsl(var(--gold-oxide))]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-micro font-mono font-bold text-[hsl(var(--gold-oxide))]">{progressPercent}%</span>
            </div>
          </div>
        </motion.div>

        {/* Instant Analysis — try it now */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <div className="rounded-2xl border border-[hsl(var(--gold-oxide)/0.15)] bg-[hsl(var(--gold-oxide)/0.02)] p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4 w-4 text-[hsl(var(--gold-oxide))]" />
              <h2 className="text-sm font-bold">Try It Now — Instant Analysis</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Paste any text or URL and get structured intelligence in under 60 seconds. No setup needed.
            </p>
            <InstantAnalysisFlow />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {(() => {
              const step = STEPS[activeStep];
              const Icon = step.icon;
              const isCompleted = status[step.checkField] > 0;

              return (
                <div className={cn(
                  "rounded-2xl border p-6 sm:p-7 transition-all",
                  isCompleted
                    ? "border-[hsl(var(--gold-oxide)/0.2)] bg-[hsl(var(--gold-oxide)/0.03)]"
                    : "border-border/50 bg-card/80"
                )}>
                  {/* Step number + reward */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-nano font-mono font-bold uppercase tracking-widest text-muted-foreground/50">
                        {t("onboarding.step", { number: activeStep + 1 })} of {STEPS.length}
                      </span>
                      {isCompleted && (
                        <span className="text-nano font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[hsl(var(--gold-oxide)/0.08)] text-[hsl(var(--gold-oxide))]">
                          {t("onboarding.step_completed")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-nano font-semibold text-[hsl(var(--gold-oxide)/0.7)]">
                      <Gift className="h-3 w-3" />
                      {step.reward}
                    </div>
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br",
                      step.gradient
                    )}>
                      <Icon className={cn("h-6 w-6", isCompleted ? "text-[hsl(var(--gold-oxide))]" : "text-foreground")} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-[-0.01em]">{step.title}</h2>
                      <p className="text-micro text-muted-foreground font-medium">{step.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.desc}</p>

                  {/* Tip */}
                  <div className="rounded-xl bg-muted/30 border border-border/30 p-3.5 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Play className="h-3 w-3 text-[hsl(var(--gold-oxide))] shrink-0" />
                      <p className="text-micro text-muted-foreground/70 italic">{step.tip}</p>
                    </div>
                  </div>

                  {/* Status + Action */}
                  <div className="flex items-center justify-between">
                    {isCompleted && (
                      <p className="text-xs text-[hsl(var(--gold-oxide))] font-medium">
                        {status[step.checkField]} {step.checkField} {t("onboarding.created_suffix")}
                      </p>
                    )}
                    {!isCompleted && <div />}

                    <Button
                      size="sm"
                      variant={isCompleted ? "outline" : "default"}
                      className="gap-2 text-xs"
                      onClick={() => navigate(step.action)}
                    >
                      {step.actionLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={activeStep === 0}
            onClick={() => setActiveStep(s => s - 1)}
          >
            ← Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={activeStep === STEPS.length - 1}
            onClick={() => setActiveStep(s => s + 1)}
          >
            Next →
          </Button>
        </div>

        {/* Completion CTA */}
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-10 p-7 rounded-2xl border-2 border-[hsl(var(--gold-oxide)/0.25)] bg-[hsl(var(--gold-oxide)/0.03)] text-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center mx-auto mb-4">
              <Crown className="h-7 w-7 text-[hsl(var(--gold-oxide))]" />
            </div>
            <h2 className="text-lg font-bold mb-1.5">{t("onboarding.pipeline_active_title")}</h2>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              {t("onboarding.pipeline_active_desc")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => {
                const pending = consumeRedirect();
                navigate(pending || "/home", { replace: true });
              }} className="gap-2">
                {t("onboarding.back_to_cockpit")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/extractor")} className="gap-2 text-xs">
                Upload More
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
