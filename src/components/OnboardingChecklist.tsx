import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { supabase } from "@/integrations/supabase/client";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import {
  Upload, Brain, Sparkles, TrendingUp,
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, Rocket,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fireStepConfetti, fireFinalConfetti } from "@/components/onboarding/useConfetti";
import { useTranslation } from "react-i18next";

interface StepDef {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  descKey: string;
  route: string;
}

const STEPS: StepDef[] = [
  { id: "upload", icon: Upload, labelKey: "onboarding_upload_label", descKey: "onboarding_upload_desc", route: "/extractor" },
  { id: "neuron", icon: Brain, labelKey: "onboarding_neuron_label", descKey: "onboarding_neuron_desc", route: "/neurons" },
  { id: "service", icon: Sparkles, labelKey: "onboarding_service_label", descKey: "onboarding_service_desc", route: "/services" },
  { id: "library", icon: TrendingUp, labelKey: "onboarding_library_label", descKey: "onboarding_library_desc", route: "/library" },
];

export function OnboardingChecklist() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { flags, loading: flagsLoading, updateFlag } = useOnboardingState();
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const prevCompletedRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !currentWorkspace || flagsLoading) { setLoading(false); return; }
    if (flags.checklist_dismissed) { setLoading(false); return; }
    checkSteps();
  }, [user, currentWorkspace, flagsLoading, flags.checklist_dismissed]);

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

    if (prevCompletedRef.current > 0 && completed.size > prevCompletedRef.current) {
      if (completed.size === STEPS.length) {
        fireFinalConfetti();
        updateFlag("checklist_completed", true);
        trackInternalEvent({ event: AnalyticsEvents.ONBOARDING_COMPLETED });
      } else {
        fireStepConfetti();
        trackInternalEvent({
          event: AnalyticsEvents.ONBOARDING_STEP_COMPLETED,
          params: { step: completed.size },
        });
      }
    }
    prevCompletedRef.current = completed.size;

    setCompletedSteps(completed);
    setLoading(false);
  };

  const allDone = completedSteps.size === STEPS.length;

  if (!user || loading || flags.checklist_dismissed || allDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden mb-6"
      role="region"
      aria-label={t("getting_started")}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
        role="button"
        aria-expanded={!collapsed}
        aria-label={collapsed ? t("expand_checklist", "Expand checklist") : t("collapse_checklist", "Collapse checklist")}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("getting_started")}</h3>
            <p className="text-[10px] text-muted-foreground">
              {t("completed_count", { done: completedSteps.size, total: STEPS.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5" aria-hidden="true">
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
              updateFlag("checklist_dismissed", true);
            }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors"
            aria-label={t("dismiss_checklist", "Dismiss checklist")}
          >
            <X className="h-3 w-3" />
          </button>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
            <div className="px-4 pb-4 space-y-1" role="list" aria-label={t("onboarding_steps", "Onboarding steps")}>
              {STEPS.map((step, idx) => {
                const done = completedSteps.has(step.id);
                const isNext = !done && !STEPS.slice(0, idx).some(s => !completedSteps.has(s.id));

                return (
                  <button
                    key={step.id}
                    role="listitem"
                    onClick={() => navigate(step.route)}
                    aria-label={`${t(step.labelKey)}${done ? ` — ${t("completed", "completed")}` : ""}`}
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
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    ) : (
                      <Circle className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isNext ? "text-primary/50" : "text-muted-foreground/30 group-hover:text-primary/50"
                      )} aria-hidden="true" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-xs font-medium",
                        done && "line-through text-muted-foreground/60"
                      )}>
                        {t(step.labelKey)}
                      </span>
                      <p className="text-[10px] text-muted-foreground/60 truncate">{t(step.descKey)}</p>
                    </div>
                    {!done && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-[10px] font-medium transition-opacity",
                        isNext ? "text-primary opacity-100" : "text-primary opacity-0 group-hover:opacity-100"
                      )} aria-hidden="true">
                        {t("start")} <ArrowRight className="h-2.5 w-2.5" />
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
