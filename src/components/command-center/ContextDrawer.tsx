/**
 * ContextDrawer — USER OPERATING SYSTEM (Right Sidebar).
 * 5 tabs: Overview · Wallet · Runs · Assets · Account
 * Auto-switches based on execution state + credit level.
 */
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X, ChevronRight, Save, Package, CheckCircle2, XCircle, Zap,
  Clock, Coins, Loader2, History, Crown, TrendingDown, TrendingUp,
  FileText, Lock, Wallet, BarChart3, User, Settings, Key,
  Plug, CreditCard, Rocket, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier } from "@/hooks/useUserTier";
import { Button } from "@/components/ui/button";
import type { ExecutionState, TaskStep, OutputItem } from "@/stores/executionStore";

type RightTab = "overview" | "wallet" | "runs" | "assets" | "account";

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
  const [activeTab, setActiveTab] = useState<RightTab>("overview");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useUserTier();
  const { phase, steps, totalCredits, startedAt, completedAt, planName, intent, objective } = execution;

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
      setActiveTab("wallet");
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
    { id: "overview", label: "Overview", icon: Eye },
    { id: "wallet", label: "Wallet", icon: Wallet, badge: balance < 200 },
    { id: "runs", label: "Runs", icon: Zap, badge: isActive },
    { id: "assets", label: "Assets", icon: Package },
    { id: "account", label: "Account", icon: User },
  ];

  // Toggle button when closed
  if (!isOpen) {
    return (
      <div className="hidden lg:flex flex-col items-center py-3 px-1 border-l border-border/20 bg-card/30 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setIsOpen(true); setActiveTab(tab.id); }}
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center mb-1 transition-colors relative",
              "text-muted-foreground/40 hover:text-foreground hover:bg-muted/40"
            )}
            title={tab.label}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.badge && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
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
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="hidden lg:flex flex-col h-full border-l border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden shrink-0"
          >
            {/* Tab bar */}
            <div className="flex items-center border-b border-border/20 px-1 py-1 gap-0.5">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-colors relative",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30"
                  )}
                  title={tab.label}
                >
                  <tab.icon className="h-3 w-3" />
                  <span className="hidden xl:inline">{tab.label}</span>
                  {tab.badge && (
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full animate-pulse",
                      tab.id === "wallet" ? "bg-destructive" : "bg-primary"
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
              {activeTab === "overview" && (
                <OverviewTab tier={tier} balance={balance} phase={phase} completedSteps={completedSteps} totalSteps={steps.length} outputs={outputs} navigate={navigate} />
              )}
              {activeTab === "wallet" && (
                <WalletTab balance={balance} consumedCredits={consumedCredits} totalCredits={totalCredits} tier={tier} navigate={navigate} />
              )}
              {activeTab === "runs" && (
                <RunsTab steps={steps} phase={phase} planName={planName} intent={intent} objective={objective} elapsed={elapsed} progress={progress} isDone={isDone} isFailed={isFailed} isActive={isActive} totalCredits={totalCredits} onRerun={onRerun} onSaveTemplate={onSaveTemplate} />
              )}
              {activeTab === "assets" && (
                <AssetsTab outputs={outputs} onViewOutputs={onViewOutputs} />
              )}
              {activeTab === "account" && (
                <AccountTab navigate={navigate} />
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
              className="lg:hidden fixed inset-y-0 right-0 w-[300px] z-50 border-l border-border bg-card shadow-xl overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <span className="text-xs font-bold">User OS</span>
                <button onClick={() => setIsOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Mobile just shows runs for now */}
              <RunsTab steps={steps} phase={phase} planName={planName} intent={intent} objective={objective} elapsed={elapsed} progress={progress} isDone={isDone} isFailed={isFailed} isActive={isActive} totalCredits={totalCredits} onRerun={onRerun} onSaveTemplate={onSaveTemplate} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══ TAB: OVERVIEW ═══
function OverviewTab({ tier, balance, phase, completedSteps, totalSteps, outputs, navigate }: {
  tier: string; balance: number; phase: string; completedSteps: number; totalSteps: number; outputs: OutputItem[]; navigate: (path: string) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          tier === "vip" ? "bg-yellow-500/10" : tier === "pro" ? "bg-primary/10" : "bg-muted/50"
        )}>
          <Crown className={cn("h-5 w-5", tier === "vip" ? "text-yellow-500" : tier === "pro" ? "text-primary" : "text-muted-foreground/40")} />
        </div>
        <div>
          <p className={cn("text-sm font-bold", tier === "vip" ? "text-yellow-500" : tier === "pro" ? "text-primary" : "text-foreground")}>
            {tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "FREE"}
          </p>
          <p className="text-[10px] text-muted-foreground">Plan activ</p>
        </div>
      </div>

      {/* Economy summary */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat icon={Coins} label="Balanță" value={`${balance.toLocaleString()} N`} color={balance < 200 ? "text-destructive" : "text-primary"} />
        <MiniStat icon={TrendingDown} label="Burn rate" value="~32 N/task" color="text-muted-foreground" />
        <MiniStat icon={Zap} label="Active" value={phase !== "idle" ? "1 task" : "0"} color={phase !== "idle" ? "text-primary" : "text-muted-foreground"} />
        <MiniStat icon={Package} label="Assets" value={`${outputs.length}`} color="text-green-500" />
      </div>

      {/* Upgrade CTA */}
      {tier !== "vip" && tier !== "pro" && (
        <button
          onClick={() => navigate("/credits")}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 hover:border-primary/30 transition-all group"
        >
          <Rocket className="h-4 w-4 text-primary" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-primary">Upgrade to PRO</p>
            <p className="text-[9px] text-muted-foreground">25% discount + batch processing</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-primary/40 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Buy credits */}
      <button
        onClick={() => navigate("/credits")}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
      >
        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">Cumpără NEURONS</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30 ml-auto" />
      </button>
    </div>
  );
}

// ═══ TAB: WALLET ═══
function WalletTab({ balance, consumedCredits, totalCredits, tier, navigate }: {
  balance: number; consumedCredits: number; totalCredits: number; tier: string; navigate: (path: string) => void;
}) {
  const burnRate = 32; // avg per task — will be dynamic
  const runway = burnRate > 0 ? Math.floor(balance / burnRate) : 999;

  return (
    <div className="p-4 space-y-4">
      {/* Balance hero */}
      <div className="text-center py-3">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Balanță disponibilă</p>
        <p className={cn("text-2xl font-bold tabular-nums", balance < 200 ? "text-destructive" : "text-foreground")}>
          {balance.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground">NEURONS</p>
      </div>

      {/* Usage bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Sesiune curentă</span>
          <span className="tabular-nums">{consumedCredits}/{totalCredits} N</span>
        </div>
        <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", totalCredits > 0 ? "bg-primary" : "bg-border/50")}
            style={{ width: totalCredits > 0 ? `${Math.min(100, (consumedCredits / totalCredits) * 100)}%` : "0%" }}
          />
        </div>
      </div>

      {/* Projections */}
      <div className="rounded-xl border border-border/20 bg-muted/10 p-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Proiecții</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Runway estimat</span>
          <span className={cn("text-[11px] font-bold tabular-nums", runway < 5 ? "text-destructive" : "text-foreground")}>
            ~{runway} task-uri
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Burn rate mediu</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">~{burnRate} N/task</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Discount tier</span>
          <span className="text-[11px] font-medium text-primary">
            {tier === "vip" ? "40%" : tier === "pro" ? "25%" : "0%"}
          </span>
        </div>
      </div>

      {/* Low balance warning */}
      {balance < 500 && (
        <div className={cn(
          "rounded-lg px-3 py-2",
          balance < 200 ? "bg-destructive/5 border border-destructive/15" : "bg-yellow-500/5 border border-yellow-500/15"
        )}>
          <p className={cn("text-[11px] font-medium", balance < 200 ? "text-destructive" : "text-yellow-600")}>
            {balance < 200 ? "⚠ Sold critic — reîncarcă acum" : "⚡ Sold scăzut — planifică reîncărcarea"}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-1.5 pt-2">
        <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={() => navigate("/credits")}>
          <Coins className="h-3 w-3" /> Cumpără NEURONS
        </Button>
        {tier !== "vip" && tier !== "pro" && (
          <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5" onClick={() => navigate("/credits")}>
            <Rocket className="h-3 w-3" /> Upgrade plan
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══ TAB: RUNS ═══
function RunsTab({ steps, phase, planName, intent, objective, elapsed, progress, isDone, isFailed, isActive, totalCredits, onRerun, onSaveTemplate }: {
  steps: TaskStep[]; phase: string; planName: string; intent: string; objective: string;
  elapsed: number; progress: number; isDone: boolean; isFailed: boolean; isActive: boolean;
  totalCredits: number; onRerun: () => void; onSaveTemplate: () => void;
}) {
  if (phase === "idle") {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-12 text-center">
        <Zap className="h-6 w-6 text-muted-foreground/20 mb-2" />
        <p className="text-xs text-muted-foreground/40">Nicio execuție activă</p>
        <p className="text-[10px] text-muted-foreground/30 mt-1">Scrie o comandă pentru a începe</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Current task header */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
          isDone ? "bg-green-500/10" : isFailed ? "bg-destructive/10" : "bg-primary/10"
        )}>
          {isActive ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" /> :
           isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> :
           <XCircle className="h-3.5 w-3.5 text-destructive" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold truncate">{planName || "Execution"}</p>
          <p className="text-[10px] text-muted-foreground truncate">{intent?.replace(/_/g, " ")}</p>
        </div>
      </div>

      {objective && <p className="text-[11px] text-muted-foreground/60 line-clamp-2">{objective}</p>}

      {/* Live metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat icon={Clock} label="Timp" value={`${elapsed}s`} color="text-muted-foreground" />
        <MiniStat icon={Coins} label="Cost" value={`${totalCredits}N`} color="text-primary" />
        <MiniStat icon={BarChart3} label="Progres" value={`${Math.round(progress)}%`} color={isDone ? "text-green-500" : "text-primary"} />
      </div>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", isDone ? "bg-green-500" : isFailed ? "bg-destructive" : "bg-primary")}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="space-y-0.5">
          {steps.map(step => <StepRow key={step.id} step={step} />)}
        </div>
      )}

      {/* Actions */}
      {(isDone || isFailed) && (
        <div className="space-y-1.5 pt-2 border-t border-border/20">
          <button onClick={onSaveTemplate} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground text-xs font-medium transition-colors">
            <Save className="h-3.5 w-3.5" /> Salvează ca template
          </button>
          <button onClick={onRerun} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground text-xs font-medium transition-colors">
            <History className="h-3.5 w-3.5" /> {isDone ? "Rulează din nou" : "Reîncearcă"}
          </button>
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
        <Package className="h-6 w-6 text-muted-foreground/20 mb-2" />
        <p className="text-xs text-muted-foreground/40">Niciun asset generat</p>
        <p className="text-[10px] text-muted-foreground/30 mt-1">Assets-urile vor apărea aici după execuție</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          {outputs.length} asset{outputs.length !== 1 ? "s" : ""} generat{outputs.length !== 1 ? "e" : ""}
        </p>
        <button onClick={onViewOutputs} className="text-[10px] text-primary font-medium hover:underline">
          Vezi toate →
        </button>
      </div>

      <div className="space-y-1">
        {outputs.slice(0, 8).map((out, i) => (
          <div key={out.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer" onClick={onViewOutputs}>
            <FileText className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-foreground truncate group-hover:text-primary transition-colors">{out.title}</p>
              <p className="text-[9px] text-muted-foreground/40 uppercase">{out.type}</p>
            </div>
            {i >= 3 && (
              <Lock className="h-3 w-3 text-muted-foreground/20 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {outputs.length > 3 && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
          <p className="text-[10px] text-primary font-medium">
            🔒 {outputs.length - 3} assets locked — deblocheaza cu NEURONS
          </p>
        </div>
      )}
    </div>
  );
}

// ═══ TAB: ACCOUNT ═══
function AccountTab({ navigate }: { navigate: (path: string) => void }) {
  const links = [
    { label: "Profil", icon: User, path: "/profile" },
    { label: "Facturare & Credite", icon: CreditCard, path: "/credits" },
    { label: "API Keys", icon: Key, path: "/profile" },
    { label: "Integrări", icon: Plug, path: "/profile" },
    { label: "Setări", icon: Settings, path: "/profile" },
  ];

  return (
    <div className="p-4 space-y-1">
      {links.map(link => (
        <button
          key={link.label}
          onClick={() => navigate(link.path)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
        >
          <link.icon className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
          <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors flex-1 text-left">{link.label}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
        </button>
      ))}
    </div>
  );
}

// ═══ SHARED COMPONENTS ═══
function MiniStat({ icon: Icon, label, value, color }: {
  icon: typeof Coins; label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-lg border border-border/20 bg-muted/10 p-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={cn("h-3 w-3", color)} />
        <span className="text-[9px] text-muted-foreground/50">{label}</span>
      </div>
      <p className={cn("text-xs font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}

function StepRow({ step }: { step: TaskStep }) {
  const statusIcon = {
    pending: <div className="h-2 w-2 rounded-full bg-border/60" />,
    running: <Loader2 className="h-3 w-3 text-primary animate-spin" />,
    completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
    failed: <XCircle className="h-3 w-3 text-destructive" />,
    skipped: <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />,
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors",
      step.status === "running" && "bg-primary/[0.04]",
    )}>
      <div className="shrink-0">{statusIcon[step.status]}</div>
      <span className={cn(
        "truncate flex-1",
        step.status === "completed" ? "text-foreground" :
        step.status === "running" ? "text-primary font-medium" :
        step.status === "failed" ? "text-destructive" :
        "text-muted-foreground/60"
      )}>
        {step.label}
      </span>
      {step.credits > 0 && (
        <span className="text-[9px] tabular-nums text-muted-foreground/40 shrink-0">{step.credits}N</span>
      )}
    </div>
  );
}
