import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { supabase } from "@/integrations/supabase/client";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Coins, Sparkles, Gift, Users,
  CheckCircle2, Circle, ArrowRight, X, Loader2, Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { fireFinalConfetti } from "@/components/onboarding/useConfetti";

interface TutorialModule {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  slides: { headingKey: string; bodyKey: string }[];
}

const MODULES: TutorialModule[] = [
  {
    id: "credits",
    icon: Coins,
    titleKey: "tutorial.credits_title",
    slides: [
      { headingKey: "tutorial.credits_s1_h", bodyKey: "tutorial.credits_s1_b" },
      { headingKey: "tutorial.credits_s2_h", bodyKey: "tutorial.credits_s2_b" },
    ],
  },
  {
    id: "first_service",
    icon: Sparkles,
    titleKey: "tutorial.service_title",
    slides: [
      { headingKey: "tutorial.service_s1_h", bodyKey: "tutorial.service_s1_b" },
      { headingKey: "tutorial.service_s2_h", bodyKey: "tutorial.service_s2_b" },
    ],
  },
  {
    id: "bonuses",
    icon: Gift,
    titleKey: "tutorial.bonuses_title",
    slides: [
      { headingKey: "tutorial.bonuses_s1_h", bodyKey: "tutorial.bonuses_s1_b" },
      { headingKey: "tutorial.bonuses_s2_h", bodyKey: "tutorial.bonuses_s2_b" },
    ],
  },
  {
    id: "community",
    icon: Users,
    titleKey: "tutorial.community_title",
    slides: [
      { headingKey: "tutorial.community_s1_h", bodyKey: "tutorial.community_s1_b" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function OnboardingTutorial({ open, onClose }: Props) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { updateFlag } = useOnboardingState();
  const [moduleIdx, setModuleIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    trackInternalEvent({ event: AnalyticsEvents.TUTORIAL_STARTED });
    supabase
      .from("onboarding_progress")
      .select("tutorial_modules_completed")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.tutorial_modules_completed) {
          setCompleted(new Set(data.tutorial_modules_completed as string[]));
        }
      });
  }, [user, open]);

  if (!open) return null;

  const currentModule = MODULES[moduleIdx];
  const currentSlide = currentModule.slides[slideIdx];
  const Icon = currentModule.icon;
  const isLastSlide = slideIdx === currentModule.slides.length - 1;
  const isLastModule = moduleIdx === MODULES.length - 1;
  const allDone = completed.size === MODULES.length;

  const markModuleComplete = async () => {
    if (!user) return;
    const newCompleted = new Set(completed);
    newCompleted.add(currentModule.id);
    setCompleted(newCompleted);

    trackInternalEvent({
      event: AnalyticsEvents.TUTORIAL_MODULE_COMPLETED,
      params: { module: currentModule.id },
    });

    const arr = Array.from(newCompleted);
    await supabase
      .from("onboarding_progress")
      .upsert({
        user_id: user.id,
        tutorial_started: true,
        tutorial_modules_completed: arr,
        tutorial_completed: arr.length === MODULES.length,
      }, { onConflict: "user_id" });

    if (arr.length === MODULES.length) {
      setAwarding(true);
      trackInternalEvent({ event: AnalyticsEvents.TUTORIAL_COMPLETED });
      const { data } = await supabase.rpc("complete_onboarding_tutorial", {
        _user_id: user.id,
      });
      setAwarding(false);
      if (data && !(data as any).error && !(data as any).already_awarded) {
        fireFinalConfetti();
        toast.success(t("tutorial.completion_bonus"));
      }
    }
  };

  const handleNext = async () => {
    if (!isLastSlide) {
      setSlideIdx(s => s + 1);
      return;
    }
    await markModuleComplete();
    if (!isLastModule) {
      setModuleIdx(m => m + 1);
      setSlideIdx(0);
    }
  };

  const handleSkip = () => {
    updateFlag("tutorial_skipped", true);
    trackInternalEvent({ event: AnalyticsEvents.TUTORIAL_SKIPPED });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={t("tutorial.title", "Tutorial")}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close */}
        <button onClick={handleSkip} className="absolute top-3 right-3 z-10 h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors" aria-label={t("tutorial.skip_tutorial")}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Module progress */}
        <div className="flex items-center gap-1 px-4 pt-4" role="progressbar" aria-valuenow={moduleIdx + 1} aria-valuemin={1} aria-valuemax={MODULES.length}>
          {MODULES.map((m, i) => (
            <div key={m.id} className="flex-1 flex items-center gap-1">
              <div className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                completed.has(m.id) || i < moduleIdx ? "bg-primary" :
                i === moduleIdx ? "bg-primary/50" : "bg-muted-foreground/15"
              )} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4">
          {allDone && isLastModule && isLastSlide ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t("tutorial.all_done_title")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("tutorial.all_done_desc")}</p>
              {awarding && <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-primary" aria-label="Loading" />}
              <Button onClick={onClose} className="gap-2" aria-label={t("tutorial.start_exploring")}>
                {t("tutorial.start_exploring")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${moduleIdx}-${slideIdx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Module header */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">
                      {t("tutorial.module")} {moduleIdx + 1}/{MODULES.length}
                    </span>
                    <h3 className="text-sm font-semibold leading-tight">{t(currentModule.titleKey)}</h3>
                  </div>
                </div>

                {/* Slide content */}
                <div className="mt-4 mb-6 min-h-[100px]">
                  <h4 className="text-base font-bold mb-2">{t(currentSlide.headingKey)}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(currentSlide.bodyKey)}</p>
                </div>

                {/* Slide dots */}
                {currentModule.slides.length > 1 && (
                  <div className="flex items-center justify-center gap-1 mb-4" aria-hidden="true">
                    {currentModule.slides.map((_, i) => (
                      <div key={i} className={cn(
                        "h-1.5 w-1.5 rounded-full transition-colors",
                        i === slideIdx ? "bg-primary" : "bg-muted-foreground/20"
                      )} />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button onClick={handleSkip} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    {t("tutorial.skip_tutorial")}
                  </button>
                  <Button size="sm" onClick={handleNext} className="gap-1.5 text-xs">
                    {isLastSlide && isLastModule ? t("tutorial.finish") : isLastSlide ? t("tutorial.next_module") : t("tutorial.next")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
