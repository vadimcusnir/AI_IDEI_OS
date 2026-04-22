/**
 * ContextDrawer — Economic Control Panel (Right Sidebar).
 * 3 tabs: State · Runs · Assets
 * 
 * PURPOSE: Context + economic pressure + output access
 * RULE: Does NOT duplicate chat content. Shows ONLY support data.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, X, ExternalLink } from "lucide-react";
import {
  SigilEye, SigilBolt, SigilCrystal,
  SigilCrown, SigilLock, SigilNeuron,
  SigilCheck, SigilFail, SigilDocument, SigilTrend,
  SigilRocket, SigilClock, SigilTarget,
} from "@/components/icons/SigilIcons";
import { cn } from "@/lib/utils";
import { useUserTier } from "@/hooks/useUserTier";
import { Button } from "@/components/ui/button";
import type { ExecutionState, TaskStep, OutputItem } from "@/stores/executionStore";

type RightTab = "state" | "runs" | "assets";

interface ContextDrawerProps {
  execution: ExecutionState;
  outputs: OutputItem[];
  balance: number;
  onSaveTemplate: () => void;
  onViewOutputs: () => void;
  onRerun: () => void;
}

export function ContextDrawer({
  execution, outputs, balance, onSaveTemplate, onViewOutputs, onRerun,
}: ContextDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RightTab>("state");
  const navigate = useNavigate();
  const { t } = useTranslation(["pages", "common"]);
  const { tier } = useUserTier();
  const { phase, steps, totalCredits, startedAt, completedAt } = execution;

  // Auto-open + auto-switch
  useEffect(() => {
    if (phase === "planning" || phase === "executing" || phase === "confirming") {
      setIsOpen(true);
      setActiveTab("runs");
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "completed" && outputs.length > 0) {
      setActiveTab("assets");
    }
  }, [phase, outputs.length]);

  useEffect(() => {
    if (balance < 200 && phase === "idle") {
      setActiveTab("state");
    }
  }, [balance, phase]);

  const elapsed = startedAt
    ? Math.round(((completedAt ? new Date(completedAt).getTime() : Date.now()) - new Date(startedAt).getTime()) / 1000)
    : 0;
  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const isDone = phase === "completed";
  const isFailed = phase === "failed";
  const isActive = phase === "executing" || phase === "delivering" || phase === "planning";
  const consumedCredits = steps.filter(s => s.status === "completed" || s.status === "running").reduce((sum, s) => sum + s.credits, 0);

  const TABS: Array<{
    id: RightTab;
    label: string;
    icon: React.FC<{ className?: string; size?: number }>;
    badge?: boolean;
    count?: number;
  }> = [
    { id: "state", label: t("pages:home.context.tab_state", { defaultValue: "State" }), icon: SigilEye, badge: balance < 200 },
    { id: "runs", label: t("pages:home.context.tab_runs", { defaultValue: "Runs" }), icon: SigilBolt, badge: isActive, count: steps.length || undefined },
    { id: "assets", label: t("pages:home.context.tab_assets", { defaultValue: "Assets" }), icon: SigilCrystal, count: outputs.length || undefined },
  ];

  // Collapsed icon strip
  if (!isOpen) {
    return (
      <div className="hidden lg:flex flex-col items-center py-4 px-1.5 border-l border-border/15 bg-background/50 backdrop-blur-sm shrink-0 gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setIsOpen(true); setActiveTab(tab.id); }}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all relative group",
                "text-primary/70 hover:text-primary hover:bg-primary/10",
                "hover:shadow-sm hover:shadow-primary/10"
              )}
              title={tab.label}
            >
              <Icon size={15} />
              {tab.badge && (
                <span className={cn(
                  "absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-background",
                  tab.id === "state" ? "bg-destructive animate-pulse" : "bg-primary animate-pulse"
                )} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* Desktop drawer — NO width animation, deterministic layout */}
      {isOpen && (
        <div
          className="hidden lg:flex flex-col h-full w-[300px] border-l border-border/20 bg-background/60 backdrop-blur-md overflow-hidden shrink-0"
        >
          {/* Tab bar — premium treatment */}
          <div className="flex items-center border-b border-border/15 px-2 py-1.5 gap-0.5 bg-muted/20">
            {TABS.map(tab => (
              <TabPill key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/25 hover:text-foreground hover:bg-muted/30 transition-colors ml-0.5 shrink-0"
              aria-label={t("common:close", { defaultValue: "Close" })}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Tab content — no x-translate animation, just opacity */}
          <div className="flex-1 overflow-y-auto">
            <div key={activeTab}>
              {activeTab === "state" && (
                <StateTab tier={tier} balance={balance} phase={phase} navigate={navigate} />
              )}
              {activeTab === "runs" && (
                <RunsTab
                  steps={steps} phase={phase} elapsed={elapsed} progress={progress}
                  isDone={isDone} isFailed={isFailed} isActive={isActive}
                  consumedCredits={consumedCredits} totalCredits={totalCredits}
                  navigate={navigate}
                />
              )}
              {activeTab === "assets" && (
                <AssetsTab outputs={outputs} onViewOutputs={onViewOutputs} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay — all tabs accessible */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="lg:hidden fixed inset-y-0 right-0 w-[300px] z-50 border-l border-border/20 bg-background shadow-2xl shadow-black/20 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/15 bg-muted/20 shrink-0">
              <span className="text-micro font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{t("pages:home.context.control_panel", { defaultValue: "Control Panel" })}</span>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-muted-foreground/40 hover:text-foreground rounded-lg hover:bg-muted/30 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Mobile tab bar */}
            <div className="flex items-center border-b border-border/15 px-2 py-1.5 gap-0.5 bg-muted/20 shrink-0">
              {TABS.map(tab => (
                <TabPill key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
              ))}
            </div>
            {/* Mobile tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "state" && (
                <StateTab tier={tier} balance={balance} phase={phase} navigate={navigate} />
              )}
              {activeTab === "runs" && (
                <RunsTab
                  steps={steps} phase={phase} elapsed={elapsed} progress={progress}
                  isDone={isDone} isFailed={isFailed} isActive={isActive}
                  consumedCredits={consumedCredits} totalCredits={totalCredits}
                  navigate={navigate}
                />
              )}
              {activeTab === "assets" && (
                <AssetsTab outputs={outputs} onViewOutputs={onViewOutputs} />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ═══ TAB: STATE — Economic Control ═══
function StateTab({ tier, balance, phase, navigate }: {
  tier: string; balance: number; phase: string; navigate: (path: string) => void;
}) {
  const { t } = useTranslation(["pages", "common"]);
  // Average daily neuron spend — static fallback, computed from typical usage pattern
  const burnRate = 32;
  const runway = burnRate > 0 ? Math.floor(balance / burnRate) : 999;

  return (
    <div className="p-4 space-y-4">
      {/* Balance card — hero element */}
      <div className="rounded-xl border border-border/20 p-4 bg-card/50 relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-bl-full" />
        
        <div className="flex items-center justify-between mb-3 relative">
          <span className="text-nano text-muted-foreground/40 uppercase tracking-[0.2em] font-semibold">{t("pages:home.context.balance", { defaultValue: "Balance" })}</span>
          <div className="flex items-center gap-1.5">
            <SigilCrown
              size={14}
              className={cn(
                tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/25"
              )}
            />
            <span className={cn(
              "text-nano font-bold uppercase tracking-[0.15em]",
              tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/40"
            )}>
              {(tier || "free").toUpperCase()}
            </span>
          </div>
        </div>

        <p className={cn(
          "text-2xl font-bold tabular-nums tracking-tight relative",
          balance < 200 ? "text-destructive" : "text-foreground"
        )}>
          {balance.toLocaleString()}
          <span className="text-xs font-medium text-muted-foreground/40 ml-1.5">N</span>
        </p>

        {/* Usage bar */}
        <div className="mt-3 h-1 w-full bg-border/20 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors",
              balance < 200 ? "bg-destructive" : balance < 1000 ? "bg-warning" : "bg-primary/60"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (balance / 5000) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Metrics — clean grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-dense">
          <span className="text-muted-foreground/50 flex items-center gap-2">
            <SigilTrend size={13} className="text-muted-foreground/30" />
            {t("pages:home.context.burn_rate", { defaultValue: "Burn rate" })}
          </span>
          <span className="text-muted-foreground font-mono tabular-nums text-micro">~{burnRate} {t("pages:home.context.per_task", { defaultValue: "N/task" })}</span>
        </div>
        <div className="flex items-center justify-between text-dense">
          <span className="text-muted-foreground/50 flex items-center gap-2">
            <SigilTarget size={13} className="text-muted-foreground/30" />
            {t("pages:home.context.runway", { defaultValue: "Runway" })}
          </span>
          <span className={cn(
            "font-mono tabular-nums text-micro font-semibold",
            runway < 10 ? "text-destructive" : "text-foreground"
          )}>
            ~{runway} {t("pages:home.context.tasks", { defaultValue: "tasks" })}
          </span>
        </div>
        {tier !== "vip" && tier !== "pro" && (
          <div className="flex items-center justify-between text-dense">
            <span className="text-muted-foreground/50">{t("pages:home.context.discount", { defaultValue: "Discount" })}</span>
            <span className="text-muted-foreground/30 text-micro">{t("pages:home.context.discount_upgrade", { defaultValue: "0% — upgrade for 25%" })}</span>
          </div>
        )}
      </div>

      {/* Warning */}
      {balance < 500 && (
        <div className={cn(
          "rounded-xl px-3.5 py-2.5 text-dense leading-relaxed border",
          balance < 200
            ? "bg-destructive/[0.04] border-destructive/10 text-destructive"
            : "bg-muted/20 border-border/15 text-muted-foreground/60"
        )}>
          {balance < 200
            ? t("pages:home.context.warn_critical", { defaultValue: "⚠ Critical balance — top up" })
            : t("pages:home.context.warn_low", { defaultValue: "Low balance — plan a top-up" })}
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-2 pt-1">
        <Button
          size="sm"
          className="w-full h-9 text-xs gap-2 font-semibold rounded-xl shadow-sm shadow-primary/10"
          onClick={() => navigate("/credits")}
        >
          <SigilNeuron size={14} /> {t("pages:home.context.buy_neurons", { defaultValue: "Buy NEURONS" })}
        </Button>
        {tier !== "vip" && tier !== "pro" && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-8 text-dense gap-2 text-muted-foreground/60 hover:text-foreground rounded-xl"
            onClick={() => navigate("/credits")}
          >
            <SigilRocket size={13} /> {t("pages:home.context.upgrade_plan", { defaultValue: "Upgrade plan" })}
          </Button>
        )}
      </div>

    </div>
  );
}

// ═══ TAB: RUNS ═══
function RunsTab({ steps, phase, elapsed, progress, isDone, isFailed, isActive, consumedCredits, totalCredits, navigate }: {
  steps: TaskStep[]; phase: string; elapsed: number; progress: number;
  isDone: boolean; isFailed: boolean; isActive: boolean;
  consumedCredits: number; totalCredits: number;
  navigate: (path: string) => void;
}) {
  if (phase === "idle") {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-16 text-center">
        <SigilBolt size={24} className="text-muted-foreground/10 mb-3" />
        <p className="text-dense text-muted-foreground/25 font-medium">No active execution</p>
        <p className="text-nano text-muted-foreground/15 mt-1">Run a command to see progress here</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Metrics strip */}
      <div className="flex items-center gap-5 text-dense text-muted-foreground/60">
        <span className="flex items-center gap-1.5 tabular-nums font-mono text-micro">
          <SigilClock size={13} className="text-muted-foreground/30" /> {elapsed}s
        </span>
        <span className="flex items-center gap-1.5 tabular-nums font-mono text-micro">
          <SigilNeuron size={13} className="text-muted-foreground/30" /> {consumedCredits}/{totalCredits}N
        </span>
        <span className="tabular-nums font-mono text-micro">
          {steps.filter(s => s.status === "completed").length}/{steps.length}
        </span>
      </div>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isDone ? "bg-success" : isFailed ? "bg-destructive" : "bg-primary/50"
            )}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="space-y-0.5">
          {steps.map(step => {
            const isClickable = step.status === "completed" && step.resultUrl;
            const StepWrapper = isClickable ? "button" : "div";
            return (
              <StepWrapper
                key={step.id}
                {...(isClickable ? { onClick: () => navigate(step.resultUrl!) } : {})}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-dense transition-colors w-full text-left",
                  step.status === "running" && "bg-primary/[0.03] border border-primary/10",
                  isClickable && "hover:bg-primary/[0.06] cursor-pointer group",
                )}
              >
                <div className="shrink-0 w-4 flex items-center justify-center">
                  {step.status === "pending" && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/12" />}
                  {step.status === "running" && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
                  {step.status === "completed" && <SigilCheck size={14} className="text-success" />}
                  {step.status === "failed" && <SigilFail size={14} className="text-destructive" />}
                  {step.status === "skipped" && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/8" />}
                </div>
                <span className={cn(
                  "truncate flex-1",
                  step.status === "completed" ? "text-foreground" :
                  step.status === "running" ? "text-foreground font-medium" :
                  step.status === "failed" ? "text-destructive" :
                  "text-muted-foreground/25",
                  isClickable && "group-hover:text-primary",
                )}>
                  {step.label}
                </span>
                {isClickable && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary shrink-0" />
                )}
                <span className="text-nano tabular-nums text-muted-foreground/20 shrink-0 font-mono">{step.credits}N</span>
              </StepWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══ TAB: ASSETS ═══
function AssetsTab({ outputs, onViewOutputs }: { outputs: OutputItem[]; onViewOutputs: () => void }) {
  if (outputs.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-16 text-center">
        <SigilCrystal size={24} className="text-muted-foreground/10 mb-3" />
        <p className="text-dense text-muted-foreground/25 font-medium">No assets yet</p>
        <p className="text-nano text-muted-foreground/15 mt-1">Execute a service to generate outputs</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-nano text-muted-foreground/40 uppercase tracking-[0.2em] font-semibold">
          {outputs.length} asset{outputs.length !== 1 ? "s" : ""}
        </span>
        <button onClick={onViewOutputs} className="text-micro text-primary/60 hover:text-primary font-medium transition-colors">
          View all →
        </button>
      </div>

      <div className="space-y-1">
        {outputs.slice(0, 5).map((out, i) => (
          <motion.div
            key={out.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={onViewOutputs}
            className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-muted/15 transition-all cursor-pointer group"
          >
            <SigilDocument size={14} className="text-muted-foreground/25 group-hover:text-foreground/50 transition-colors shrink-0" />
            <span className="text-dense text-foreground truncate flex-1">{out.title}</span>
            {i >= 3 && <SigilLock size={12} className="text-muted-foreground/12 shrink-0" />}
          </motion.div>
        ))}
      </div>

      {outputs.length > 3 && (
        <p className="text-micro text-muted-foreground/30 px-3 flex items-center gap-1.5">
          <SigilLock size={11} className="text-muted-foreground/15" />
          {outputs.length - 3} locked — unlock with NEURONS
        </p>
      )}
    </div>
  );
}

