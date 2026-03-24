/**
 * ContextDrawer — Economic Control Panel (Right Sidebar).
 * 4 tabs: State · Runs · Assets · Progress
 * 
 * PURPOSE: Context + economic pressure + output access + behavioral retention
 * RULE: Does NOT duplicate chat content. Shows ONLY support data.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X, ChevronRight, CheckCircle2, XCircle, Zap,
  Clock, Coins, Loader2, Crown, TrendingDown,
  FileText, Lock, Package, Rocket, Eye, Trophy,
  Flame, Star, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserTier } from "@/hooks/useUserTier";
import { useGamification } from "@/hooks/useGamification";
import { Button } from "@/components/ui/button";
import type { ExecutionState, TaskStep, OutputItem } from "@/stores/executionStore";

type RightTab = "state" | "runs" | "assets" | "progress";

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

  const TABS: Array<{ id: RightTab; label: string; icon: React.ElementType; badge?: boolean }> = [
    { id: "state", label: "State", icon: Eye, badge: balance < 200 },
    { id: "runs", label: "Runs", icon: Zap, badge: isActive },
    { id: "assets", label: "Assets", icon: Package },
    { id: "progress", label: "Progress", icon: Trophy },
  ];

  // Collapsed icon strip
  if (!isOpen) {
    return (
      <div className="hidden lg:flex flex-col items-center py-3 px-1 border-l border-border/20 bg-card/30 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setIsOpen(true); setActiveTab(tab.id); }}
            className="h-8 w-8 rounded-lg flex items-center justify-center mb-1 transition-colors relative text-muted-foreground/40 hover:text-foreground hover:bg-muted/40"
            title={tab.label}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.badge && (
              <span className={cn(
                "absolute top-1 right-1 h-1.5 w-1.5 rounded-full animate-pulse",
                tab.id === "state" ? "bg-destructive" : "bg-primary"
              )} />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Desktop drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="hidden lg:flex flex-col h-full border-l border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden shrink-0"
          >
            {/* Tab bar */}
            <div className="flex items-center border-b border-border/20 px-1.5 py-1 gap-0.5">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-colors relative",
                    activeTab === tab.id
                      ? "bg-muted/50 text-foreground"
                      : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/20"
                  )}
                >
                  <tab.icon className="h-3 w-3" />
                  <span className="hidden xl:inline">{tab.label}</span>
                  {tab.badge && (
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full animate-pulse",
                      tab.id === "state" ? "bg-destructive" : "bg-primary"
                    )} />
                  )}
                </button>
              ))}
              <button
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-muted/50 transition-colors ml-0.5 shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Tab content */}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 right-0 w-[280px] z-50 border-l border-border bg-card shadow-xl overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <span className="text-xs font-semibold text-muted-foreground">Control Panel</span>
                <button onClick={() => setIsOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <StateTab tier={tier} balance={balance} phase={phase} navigate={navigate} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
    <div className="p-3 space-y-3">
      <div className="rounded-lg border border-border/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Balance</span>
          <div className="flex items-center gap-1">
            <Crown className={cn("h-3 w-3", tier === "vip" ? "text-yellow-500" : tier === "pro" ? "text-primary" : "text-muted-foreground/30")} />
            <span className={cn("text-[10px] font-semibold", tier === "vip" ? "text-yellow-500" : tier === "pro" ? "text-primary" : "text-muted-foreground/50")}>
              {(tier || "free").toUpperCase()}
            </span>
          </div>
        </div>
        <p className={cn("text-xl font-bold tabular-nums", balance < 200 ? "text-destructive" : "text-foreground")}>
          {balance.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">N</span>
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground/60 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Burn rate
          </span>
          <span className="text-muted-foreground tabular-nums">~{burnRate} N/task</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground/60">Runway</span>
          <span className={cn("tabular-nums font-medium", runway < 10 ? "text-destructive" : "text-foreground")}>
            ~{runway} tasks
          </span>
        </div>
        {tier !== "vip" && tier !== "pro" && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground/60">Discount</span>
            <span className="text-muted-foreground/40">0% — upgrade for 25%</span>
          </div>
        )}
      </div>

      {balance < 500 && (
        <div className={cn(
          "rounded-lg px-3 py-2 text-[11px]",
          balance < 200
            ? "bg-destructive/5 border border-destructive/10 text-destructive"
            : "bg-muted/30 border border-border/20 text-muted-foreground"
        )}>
          {balance < 200 ? "⚠ Sold critic — reîncarcă" : "Sold scăzut — planifică reîncărcarea"}
        </div>
      )}

      <div className="space-y-1.5 pt-1">
        <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={() => navigate("/credits")}>
          <Coins className="h-3 w-3" /> Cumpără NEURONS
        </Button>
        {tier !== "vip" && tier !== "pro" && (
          <Button size="sm" variant="ghost" className="w-full h-7 text-[11px] gap-1.5 text-muted-foreground" onClick={() => navigate("/credits")}>
            <Rocket className="h-3 w-3" /> Upgrade plan
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border/15 p-3 mt-2">
        <div className="flex items-center gap-2 mb-1.5">
          <Lock className="h-3 w-3 text-muted-foreground/30" />
          <span className="text-[11px] font-semibold text-muted-foreground/60">Cusnir_OS</span>
        </div>
        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
          Advanced cognitive infrastructure. Requires 11 months consecutive VIP.
        </p>
        <button
          onClick={() => navigate("/cusnir-os")}
          className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
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
      <div className="p-4 flex flex-col items-center justify-center py-12 text-center">
        <Zap className="h-5 w-5 text-muted-foreground/15 mb-2" />
        <p className="text-[11px] text-muted-foreground/30">No active execution</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 tabular-nums">
          <Clock className="h-3 w-3" /> {elapsed}s
        </span>
        <span className="flex items-center gap-1 tabular-nums">
          <Coins className="h-3 w-3" /> {consumedCredits}/{totalCredits}N
        </span>
        <span className="tabular-nums">
          {steps.filter(s => s.status === "completed").length}/{steps.length}
        </span>
      </div>

      {steps.length > 0 && (
        <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", isDone ? "bg-green-500" : isFailed ? "bg-destructive" : "bg-muted-foreground/30")}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {steps.length > 0 && (
        <div className="space-y-0.5">
          {steps.map(step => (
            <div key={step.id} className={cn(
              "flex items-center gap-2 px-2 py-1 rounded text-[11px]",
              step.status === "running" && "bg-muted/20",
            )}>
              <div className="shrink-0 w-3 flex items-center justify-center">
                {step.status === "pending" && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/15" />}
                {step.status === "running" && <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />}
                {step.status === "completed" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                {step.status === "failed" && <XCircle className="h-3 w-3 text-destructive" />}
                {step.status === "skipped" && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/10" />}
              </div>
              <span className={cn(
                "truncate flex-1",
                step.status === "completed" ? "text-foreground" :
                step.status === "running" ? "text-foreground" :
                step.status === "failed" ? "text-destructive" :
                "text-muted-foreground/30",
              )}>
                {step.label}
              </span>
              <span className="text-[9px] tabular-nums text-muted-foreground/25 shrink-0">{step.credits}N</span>
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
      <div className="p-4 flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-5 w-5 text-muted-foreground/15 mb-2" />
        <p className="text-[11px] text-muted-foreground/30">No assets yet</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/50">
          {outputs.length} asset{outputs.length !== 1 ? "s" : ""}
        </span>
        <button onClick={onViewOutputs} className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors">
          View all →
        </button>
      </div>

      <div className="space-y-0.5">
        {outputs.slice(0, 5).map((out, i) => (
          <div
            key={out.id}
            onClick={onViewOutputs}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer"
          >
            <FileText className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            <span className="text-[11px] text-foreground truncate flex-1">{out.title}</span>
            {i >= 3 && <Lock className="h-3 w-3 text-muted-foreground/15 shrink-0" />}
          </div>
        ))}
      </div>

      {outputs.length > 3 && (
        <p className="text-[10px] text-muted-foreground/40 px-2">
          🔒 {outputs.length - 3} locked — unlock with NEURONS
        </p>
      )}
    </div>
  );
}

// ═══ TAB: PROGRESS — Behavioral Retention Engine ═══

const RANK_LABELS: Record<string, { icon: React.ElementType; next: string }> = {
  "Novice": { icon: Star, next: "Operator" },
  "Operator": { icon: Zap, next: "Architect" },
  "Architect": { icon: Target, next: "Strategist" },
  "Strategist": { icon: Trophy, next: "Master" },
  "Master": { icon: Crown, next: "Legend" },
  "Legend": { icon: Flame, next: "—" },
};

const MISSIONS = [
  { id: "run_1", label: "Run 1 service today", xp: 50, metric: "tasks" },
  { id: "gen_5", label: "Generate 5 outputs", xp: 80, metric: "outputs" },
  { id: "spend_500", label: "Spend 500 neurons this week", xp: 200, metric: "neurons" },
];

const BADGES = [
  { id: "first_exec", label: "First Execution", icon: "⚡", unlockXp: 0 },
  { id: "100_outputs", label: "100 Outputs", icon: "📦", unlockXp: 500 },
  { id: "1k_neurons", label: "1K Neurons Used", icon: "🧠", unlockXp: 1000 },
  { id: "content_machine", label: "Content Machine", icon: "🏭", unlockXp: 5000 },
  { id: "knowledge_architect", label: "Knowledge Architect", icon: "🏛️", unlockXp: 10000 },
  { id: "system_master", label: "System Master", icon: "👑", unlockXp: 25000 },
];

function ProgressTab({ navigate }: { navigate: (path: string) => void }) {
  const { xp, streak, loading, levelProgress, xpForNextLevel, tierMultiplier } = useGamification();

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center py-12">
        <Loader2 className="h-4 w-4 text-muted-foreground/30 animate-spin" />
      </div>
    );
  }

  const rankInfo = RANK_LABELS[xp.rank_name] || RANK_LABELS["Novice"];
  const RankIcon = rankInfo.icon;

  return (
    <div className="p-3 space-y-3">
      {/* Section 1: Identity — Level + Rank */}
      <div className="rounded-lg border border-border/20 p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center">
            <RankIcon className="h-4 w-4 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground">
              Level {xp.level} — <span className="font-semibold">{xp.rank_name}</span>
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              Next: Level {xp.level + 1} — {rankInfo.next}
            </p>
          </div>
        </div>
        {/* XP Progress bar */}
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-muted-foreground/40 tabular-nums">{xp.total_xp} XP</span>
          <span className="text-[9px] text-muted-foreground/40 tabular-nums">{xpForNextLevel} XP</span>
        </div>
      </div>

      {/* Section 2: Streak */}
      <div className="flex items-center gap-2.5 px-1">
        <Flame className={cn("h-4 w-4", streak.current_streak > 0 ? "text-orange-500" : "text-muted-foreground/20")} />
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-foreground tabular-nums">
            {streak.current_streak} day{streak.current_streak !== 1 ? "s" : ""} streak
          </p>
          <p className="text-[9px] text-muted-foreground/40">
            {streak.current_streak > 0 ? "Keep going — don't break it!" : "Start a streak today"}
          </p>
        </div>
        {tierMultiplier > 1 && (
          <span className="text-[9px] font-semibold text-primary tabular-nums">
            {tierMultiplier}× XP
          </span>
        )}
      </div>

      {/* Section 3: Daily Missions */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-semibold px-1">Missions</p>
        {MISSIONS.map(mission => (
          <div key={mission.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/15 transition-colors">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20 shrink-0" />
            <span className="text-[11px] text-muted-foreground flex-1">{mission.label}</span>
            <span className="text-[9px] text-primary/60 font-medium tabular-nums">+{mission.xp} XP</span>
          </div>
        ))}
      </div>

      {/* Section 4: Badges */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-semibold px-1">Badges</p>
        <div className="grid grid-cols-3 gap-1.5">
          {BADGES.map(badge => {
            const unlocked = xp.total_xp >= badge.unlockXp;
            return (
              <div
                key={badge.id}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-center",
                  unlocked
                    ? "border-border/20 bg-muted/10"
                    : "border-border/10 opacity-30"
                )}
              >
                <span className="text-sm">{badge.icon}</span>
                <span className="text-[8px] text-muted-foreground leading-tight">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Cusnir_OS Unlock Progress */}
      <div className="rounded-lg border border-border/15 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-3 w-3 text-muted-foreground/30" />
          <span className="text-[11px] font-semibold text-muted-foreground/60">Cusnir_OS</span>
        </div>
        {/* Progress bar — months */}
        <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full bg-muted-foreground/15" style={{ width: "0%" }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/30 tabular-nums">0/11 months</span>
          <button
            onClick={() => navigate("/cusnir-os")}
            className="text-[9px] text-muted-foreground/30 hover:text-foreground transition-colors"
          >
            Details →
          </button>
        </div>
      </div>

      {/* Level perks hint */}
      <div className="px-1">
        <p className="text-[9px] text-muted-foreground/30 leading-relaxed">
          Level 3 unlocks -10% neuron cost. Level 5 unlocks advanced services.
        </p>
      </div>
    </div>
  );
}
