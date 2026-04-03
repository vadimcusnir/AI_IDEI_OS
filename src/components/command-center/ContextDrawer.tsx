/**
 * ContextDrawer — Economic Control Panel (Right Sidebar).
 * 4 tabs: State · Runs · Assets · Progress
 * 
 * PURPOSE: Context + economic pressure + output access + behavioral retention
 * RULE: Does NOT duplicate chat content. Shows ONLY support data.
 * 
 * VISUAL: Obsidian Sigil icons, premium spacing, gold-oxide accents.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandCenterKPIs } from "./CommandCenterKPIs";
import { useNavigate } from "react-router-dom";
import { Loader2, X, ChevronRight } from "lucide-react";
import {
  SigilEye, SigilBolt, SigilCrystal, SigilSpiral,
  SigilCrown, SigilLock, SigilFlame, SigilNeuron,
  SigilCheck, SigilFail, SigilDocument, SigilTrend,
  SigilRocket, SigilClock, SigilTarget, SigilStar,
} from "@/components/icons/SigilIcons";
import { cn } from "@/lib/utils";
import { useUserTier } from "@/hooks/useUserTier";
import { useGamification } from "@/hooks/useGamification";
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

  const TABS: Array<{ id: RightTab; label: string; icon: React.FC<{ className?: string; size?: number }>; badge?: boolean }> = [
    { id: "state", label: "State", icon: SigilEye, badge: balance < 200 },
    { id: "runs", label: "Runs", icon: SigilBolt, badge: isActive },
    { id: "assets", label: "Assets", icon: SigilCrystal },
    { id: "progress", label: "Progress", icon: SigilSpiral },
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
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold tracking-wide transition-colors relative",
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-sm shadow-black/5 border border-border/30"
                      : "text-muted-foreground/35 hover:text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  <Icon size={13} className={activeTab === tab.id ? "text-primary" : ""} />
                  <span className="hidden xl:inline uppercase tracking-widest">{tab.label}</span>
                  {tab.badge && (
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      tab.id === "state" ? "bg-destructive animate-pulse" : "bg-primary animate-pulse"
                    )} />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/25 hover:text-foreground hover:bg-muted/30 transition-colors ml-0.5 shrink-0"
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
                />
              )}
              {activeTab === "assets" && (
                <AssetsTab outputs={outputs} onViewOutputs={onViewOutputs} />
              )}
              {activeTab === "progress" && (
                <ProgressTab navigate={navigate} />
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
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Control Panel</span>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-muted-foreground/40 hover:text-foreground rounded-lg hover:bg-muted/30 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Mobile tab bar */}
            <div className="flex items-center border-b border-border/15 px-2 py-1.5 gap-0.5 bg-muted/20 shrink-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold tracking-wide transition-colors relative",
                      activeTab === tab.id
                        ? "bg-card text-foreground shadow-sm shadow-black/5 border border-border/30"
                        : "text-muted-foreground/35 hover:text-muted-foreground hover:bg-muted/20"
                    )}
                  >
                    <Icon size={13} className={activeTab === tab.id ? "text-primary" : ""} />
                    <span className="uppercase tracking-widest">{tab.label}</span>
                    {tab.badge && (
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        tab.id === "state" ? "bg-destructive animate-pulse" : "bg-primary animate-pulse"
                      )} />
                    )}
                  </button>
                );
              })}
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
                />
              )}
              {activeTab === "assets" && (
                <AssetsTab outputs={outputs} onViewOutputs={onViewOutputs} />
              )}
              {activeTab === "progress" && (
                <ProgressTab navigate={navigate} />
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
  const burnRate = 32;
  const runway = burnRate > 0 ? Math.floor(balance / burnRate) : 999;

  return (
    <div className="p-4 space-y-4">
      {/* Balance card — hero element */}
      <div className="rounded-xl border border-border/20 p-4 bg-card/50 relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-bl-full" />
        
        <div className="flex items-center justify-between mb-3 relative">
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-semibold">Balance</span>
          <div className="flex items-center gap-1.5">
            <SigilCrown
              size={14}
              className={cn(
                tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/25"
              )}
            />
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-[0.15em]",
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
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground/50 flex items-center gap-2">
            <SigilTrend size={13} className="text-muted-foreground/30" />
            Burn rate
          </span>
          <span className="text-muted-foreground font-mono tabular-nums text-[10px]">~{burnRate} N/task</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground/50 flex items-center gap-2">
            <SigilTarget size={13} className="text-muted-foreground/30" />
            Runway
          </span>
          <span className={cn(
            "font-mono tabular-nums text-[10px] font-semibold",
            runway < 10 ? "text-destructive" : "text-foreground"
          )}>
            ~{runway} tasks
          </span>
        </div>
        {tier !== "vip" && tier !== "pro" && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground/50">Discount</span>
            <span className="text-muted-foreground/30 text-[10px]">0% — upgrade for 25%</span>
          </div>
        )}
      </div>

      {/* Warning */}
      {balance < 500 && (
        <div className={cn(
          "rounded-xl px-3.5 py-2.5 text-[11px] leading-relaxed border",
          balance < 200
            ? "bg-destructive/[0.04] border-destructive/10 text-destructive"
            : "bg-muted/20 border-border/15 text-muted-foreground/60"
        )}>
          {balance < 200 ? "⚠ Sold critic — reîncarcă" : "Sold scăzut — planifică reîncărcarea"}
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-2 pt-1">
        <Button
          size="sm"
          className="w-full h-9 text-xs gap-2 font-semibold rounded-xl shadow-sm shadow-primary/10"
          onClick={() => navigate("/credits")}
        >
          <SigilNeuron size={14} /> Cumpără NEURONS
        </Button>
        {tier !== "vip" && tier !== "pro" && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-8 text-[11px] gap-2 text-muted-foreground/60 hover:text-foreground rounded-xl"
            onClick={() => navigate("/credits")}
          >
            <SigilRocket size={13} /> Upgrade plan
          </Button>
        )}
      </div>

      {/* Cusnir_OS teaser */}
      <div className="rounded-xl border border-border/10 p-4 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent" />
        <div className="flex items-center gap-2.5 mb-2 relative">
          <SigilLock size={14} className="text-muted-foreground/25" />
          <span className="text-[11px] font-bold text-muted-foreground/50 tracking-wide">Cusnir_OS</span>
        </div>
        <p className="text-[10px] text-muted-foreground/30 leading-[1.6] relative">
          Advanced cognitive infrastructure. Requires 11 months consecutive VIP.
        </p>
        <button
          onClick={() => navigate("/cusnir-os")}
          className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/30 hover:text-foreground transition-colors relative"
        >
          Learn more <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ═══ TAB: RUNS ═══
function RunsTab({ steps, phase, elapsed, progress, isDone, isFailed, isActive, consumedCredits, totalCredits }: {
  steps: TaskStep[]; phase: string; elapsed: number; progress: number;
  isDone: boolean; isFailed: boolean; isActive: boolean;
  consumedCredits: number; totalCredits: number;
}) {
  if (phase === "idle") {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-16 text-center">
        <SigilBolt size={24} className="text-muted-foreground/10 mb-3" />
        <p className="text-[11px] text-muted-foreground/25 font-medium">No active execution</p>
        <p className="text-[9px] text-muted-foreground/15 mt-1">Run a command to see progress here</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Metrics strip */}
      <div className="flex items-center gap-5 text-[11px] text-muted-foreground/60">
        <span className="flex items-center gap-1.5 tabular-nums font-mono text-[10px]">
          <SigilClock size={13} className="text-muted-foreground/30" /> {elapsed}s
        </span>
        <span className="flex items-center gap-1.5 tabular-nums font-mono text-[10px]">
          <SigilNeuron size={13} className="text-muted-foreground/30" /> {consumedCredits}/{totalCredits}N
        </span>
        <span className="tabular-nums font-mono text-[10px]">
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
          {steps.map(step => (
            <div key={step.id} className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition-colors",
              step.status === "running" && "bg-primary/[0.03] border border-primary/10",
            )}>
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
              )}>
                {step.label}
              </span>
              <span className="text-[9px] tabular-nums text-muted-foreground/20 shrink-0 font-mono">{step.credits}N</span>
            </div>
          ))}
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
        <p className="text-[11px] text-muted-foreground/25 font-medium">No assets yet</p>
        <p className="text-[9px] text-muted-foreground/15 mt-1">Execute a service to generate outputs</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-semibold">
          {outputs.length} asset{outputs.length !== 1 ? "s" : ""}
        </span>
        <button onClick={onViewOutputs} className="text-[10px] text-primary/60 hover:text-primary font-medium transition-colors">
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
            <span className="text-[11px] text-foreground truncate flex-1">{out.title}</span>
            {i >= 3 && <SigilLock size={12} className="text-muted-foreground/12 shrink-0" />}
          </motion.div>
        ))}
      </div>

      {outputs.length > 3 && (
        <p className="text-[10px] text-muted-foreground/30 px-3 flex items-center gap-1.5">
          <SigilLock size={11} className="text-muted-foreground/15" />
          {outputs.length - 3} locked — unlock with NEURONS
        </p>
      )}
    </div>
  );
}

// ═══ TAB: PROGRESS — Behavioral Retention Engine ═══

const RANK_LABELS: Record<string, { icon: React.FC<{ className?: string; size?: number }>; next: string }> = {
  "Novice": { icon: SigilStar, next: "Operator" },
  "Operator": { icon: SigilBolt, next: "Architect" },
  "Architect": { icon: SigilTarget, next: "Strategist" },
  "Strategist": { icon: SigilSpiral, next: "Master" },
  "Master": { icon: SigilCrown, next: "Legend" },
  "Legend": { icon: SigilFlame, next: "—" },
};

const MISSIONS = [
  { id: "run_1", label: "Run 1 service today", xp: 50, metric: "tasks" },
  { id: "gen_5", label: "Generate 5 outputs", xp: 80, metric: "outputs" },
  { id: "spend_500", label: "Spend 500 neurons this week", xp: 200, metric: "neurons" },
];

const BADGES = [
  { id: "first_exec", label: "First Execution", icon: SigilBolt, unlockXp: 0 },
  { id: "100_outputs", label: "100 Outputs", icon: SigilCrystal, unlockXp: 500 },
  { id: "1k_neurons", label: "1K Neurons", icon: SigilNeuron, unlockXp: 1000 },
  { id: "content_machine", label: "Content Machine", icon: SigilTarget, unlockXp: 5000 },
  { id: "knowledge_architect", label: "Knowledge Architect", icon: SigilSpiral, unlockXp: 10000 },
  { id: "system_master", label: "System Master", icon: SigilCrown, unlockXp: 25000 },
];

function ProgressTab({ navigate }: { navigate: (path: string) => void }) {
  const { xp, streak, loading, levelProgress, xpForNextLevel, tierMultiplier } = useGamification();

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center py-16">
        <Loader2 className="h-4 w-4 text-muted-foreground/20 animate-spin" />
      </div>
    );
  }

  const rankInfo = RANK_LABELS[xp.rank_name] || RANK_LABELS["Novice"];
  const RankIcon = rankInfo.icon;

  return (
    <div className="p-4 space-y-4">
      {/* CC-V05: KPI Dashboard */}
      <CommandCenterKPIs />
      {/* Section 1: Identity — Level + Rank */}
      <div className="rounded-xl border border-border/15 p-4 bg-card/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/[0.02] flex items-center justify-center border border-primary/10">
            <RankIcon size={20} className="text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground tracking-tight">
              Level {xp.level}
            </p>
            <p className="text-[10px] text-muted-foreground/40 font-medium">
              {xp.rank_name} → {rankInfo.next}
            </p>
          </div>
        </div>
        {/* XP Progress bar */}
        <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground/30 tabular-nums font-mono">{xp.total_xp} XP</span>
          <span className="text-[9px] text-muted-foreground/30 tabular-nums font-mono">{xpForNextLevel} XP</span>
        </div>
      </div>

      {/* Section 2: Streak */}
      <div className="flex items-center gap-3 px-1">
        <SigilFlame
          size={18}
          className={cn(streak.current_streak > 0 ? "text-warning" : "text-muted-foreground/15")}
        />
        <div className="flex-1">
          <p className="text-[12px] font-bold text-foreground tabular-nums">
            {streak.current_streak} day{streak.current_streak !== 1 ? "s" : ""} streak
          </p>
          <p className="text-[9px] text-muted-foreground/35">
            {streak.current_streak > 0 ? "Keep going — don't break it!" : "Start a streak today"}
          </p>
        </div>
        {tierMultiplier > 1 && (
          <span className="text-[10px] font-bold text-primary tabular-nums font-mono">
            {tierMultiplier}× XP
          </span>
        )}
      </div>

      {/* Section 3: Daily Missions */}
      <div className="space-y-1.5">
        <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em] font-bold px-1">Missions</p>
        {MISSIONS.map(mission => (
          <div key={mission.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/10 transition-colors">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/20 shrink-0" />
            <span className="text-[11px] text-muted-foreground/60 flex-1">{mission.label}</span>
            <span className="text-[9px] text-primary/50 font-bold tabular-nums font-mono">+{mission.xp}</span>
          </div>
        ))}
      </div>

      {/* Section 4: Badges */}
      <div className="space-y-2">
        <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em] font-bold px-1">Badges</p>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map(badge => {
            const unlocked = xp.total_xp >= badge.unlockXp;
            const BadgeIcon = badge.icon;
            return (
              <div
                key={badge.id}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-xl border text-center transition-all",
                  unlocked
                    ? "border-primary/15 bg-primary/[0.03] shadow-sm shadow-primary/5"
                    : "border-border/8 opacity-25"
                )}
              >
                <BadgeIcon size={18} className={unlocked ? "text-primary/70" : "text-muted-foreground/30"} />
                <span className="text-[8px] text-muted-foreground/60 leading-tight font-medium">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Cusnir_OS Unlock Progress */}
      <div className="rounded-xl border border-border/10 p-4 bg-card/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-transparent" />
        <div className="flex items-center gap-2.5 mb-2.5 relative">
          <SigilLock size={14} className="text-muted-foreground/20" />
          <span className="text-[11px] font-bold text-muted-foreground/40 tracking-wide">Cusnir_OS</span>
        </div>
        <div className="h-1.5 bg-muted/15 rounded-full overflow-hidden mb-2 relative">
          <div className="h-full rounded-full bg-muted-foreground/8" style={{ width: "0%" }} />
        </div>
        <div className="flex items-center justify-between relative">
          <span className="text-[9px] text-muted-foreground/20 tabular-nums font-mono">0/11 months</span>
          <button
            onClick={() => navigate("/cusnir-os")}
            className="text-[9px] text-muted-foreground/25 hover:text-foreground transition-colors font-medium"
          >
            Details →
          </button>
        </div>
      </div>

      {/* Level perks */}
      <div className="space-y-1.5">
        <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em] font-bold px-1">Perks</p>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
          xp.level >= 3 ? "border-primary/15 bg-primary/[0.03]" : "border-border/8 opacity-35"
        )}>
          <div className={cn(
            "h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 font-mono",
            xp.level >= 3 ? "bg-primary/10 text-primary" : "bg-muted/15 text-muted-foreground/25"
          )}>3</div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground">-10% neuron cost</p>
            <p className="text-[9px] text-muted-foreground/30">All service executions</p>
          </div>
          {xp.level >= 3 && <SigilCheck size={14} className="text-primary shrink-0" />}
        </div>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
          xp.level >= 5 ? "border-primary/15 bg-primary/[0.03]" : "border-border/8 opacity-35"
        )}>
          <div className={cn(
            "h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 font-mono",
            xp.level >= 5 ? "bg-primary/10 text-primary" : "bg-muted/15 text-muted-foreground/25"
          )}>5</div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground">Advanced services</p>
            <p className="text-[9px] text-muted-foreground/30">Deep analysis & multi-agent</p>
          </div>
          {xp.level >= 5 && <SigilCheck size={14} className="text-primary shrink-0" />}
        </div>
      </div>
    </div>
  );
}
