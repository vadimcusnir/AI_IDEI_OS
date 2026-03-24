/**
 * CusnirOSPage — VIP-facing Cusnir_OS overview.
 * Autonomous: uses useCusnirOS + useVIPTier + useGamification.
 * Shows: capabilities preview, progression, unlock status, requirements.
 * No admin dependency.
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useCusnirOS } from "@/hooks/useCusnirOS";
import { useVIPTier } from "@/hooks/useVIPTier";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Loader2, Lock, CheckCircle2, Crown, Sparkles,
  Brain, Network, Cpu, Shield, Zap, ChevronRight,
  AlertTriangle, Rocket,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Multi-Agent Orchestration",
    description: "Deploy coordinated AI agent teams that plan, execute, and validate complex knowledge workflows autonomously.",
    tier: "core",
  },
  {
    icon: Network,
    title: "Private Neuron Layers",
    description: "Isolated knowledge graphs with custom ontologies, access controls, and cross-layer inference.",
    tier: "core",
  },
  {
    icon: Cpu,
    title: "Economic System Control",
    description: "Direct access to pricing engine, capacity management, and dynamic credit allocation.",
    tier: "advanced",
  },
  {
    icon: Shield,
    title: "Governance & Decision Audit",
    description: "Immutable decision ledger, policy enforcement, and real-time system telemetry.",
    tier: "advanced",
  },
  {
    icon: Zap,
    title: "Priority Execution Routes",
    description: "Dedicated compute lanes with guaranteed latency SLAs and batch processing at scale.",
    tier: "core",
  },
  {
    icon: Sparkles,
    title: "Neural Armory & War Rooms",
    description: "Strategic modules for competitive analysis, market positioning, and campaign orchestration.",
    tier: "premium",
  },
];

const REQUIREMENTS = [
  { label: "11 months consecutive VIP subscription", key: "months" },
  { label: "Hold NOTA2 tokens above threshold", key: "tokens" },
  { label: "Active platform usage throughout period", key: "usage" },
];

export default function CusnirOSPage() {
  const { user, loading: authLoading } = useAuth();
  const { eligible, reason, currentMonth, tokenBalance, loading: cusnirLoading } = useCusnirOS();
  const { isVIP, currentMonth: vipMonth, loading: vipLoading } = useVIPTier();
  const { xp } = useGamification();
  const navigate = useNavigate();

  const loading = authLoading || cusnirLoading || vipLoading;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <Lock className="h-8 w-8 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">Autentifică-te pentru a vedea Cusnir_OS.</p>
        <Button size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  const monthProgress = Math.min(currentMonth, 11);
  const monthPercent = (monthProgress / 11) * 100;

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead
          title="Cusnir_OS — Advanced Cognitive Infrastructure"
          description="Unlock the most powerful layer of AI-IDEI. Multi-agent orchestration, economic control, and private neuron layers."
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

          {/* Header */}
          <div className="text-center space-y-3 py-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center mx-auto">
              <Crown className="h-7 w-7 text-foreground/60" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Cusnir_OS</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Advanced Cognitive Infrastructure
              </p>
            </div>
          </div>

          {/* Status Card */}
          <div className={cn(
            "rounded-xl border p-5",
            eligible
              ? "border-green-500/20 bg-green-500/[0.02]"
              : "border-border/20"
          )}>
            {eligible ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Access Active</p>
                  <p className="text-[11px] text-muted-foreground">
                    11 luni completate · {tokenBalance} NOTA2 tokens · Full system access
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Access Locked</p>
                    <p className="text-[11px] text-muted-foreground">
                      {reason === "NO_VIP_SUBSCRIPTION" && "Requires active VIP subscription."}
                      {reason === "INSUFFICIENT_MONTHS" && `${monthProgress}/11 months completed.`}
                      {reason === "NO_TOKENS" && "NOTA2 tokens required for access."}
                      {!reason && "Complete the 11-month VIP progression to unlock."}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
                    <span>Progression</span>
                    <span className="tabular-nums">{monthProgress}/11 months</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${monthPercent}%` }}
                    />
                  </div>
                </div>

                {/* Token status */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground/60">NOTA2 Balance</span>
                  <span className={cn(
                    "tabular-nums font-medium",
                    tokenBalance > 0 ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {tokenBalance} tokens
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 px-1">
              Requirements
            </p>
            <div className="space-y-1">
              {REQUIREMENTS.map(req => {
                const met = req.key === "months" ? monthProgress >= 11
                  : req.key === "tokens" ? tokenBalance > 0
                  : isVIP;
                return (
                  <div key={req.key} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
                    {met ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 shrink-0" />
                    )}
                    <span className={cn(
                      "text-[11px]",
                      met ? "text-foreground" : "text-muted-foreground/50"
                    )}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 px-1">
              Capabilities
            </p>
            <div className="grid gap-2">
              {CAPABILITIES.map(cap => (
                <div
                  key={cap.title}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-all",
                    eligible
                      ? "border-border/20 hover:bg-muted/10"
                      : "border-border/10 opacity-60"
                  )}
                >
                  <div className="h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 mt-0.5">
                    <cap.icon className="h-4 w-4 text-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-semibold text-foreground">{cap.title}</p>
                      {!eligible && <Lock className="h-3 w-3 text-muted-foreground/20" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-0.5">
                      {cap.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative access */}
          {!eligible && (
            <div className="rounded-xl border border-border/15 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-muted-foreground/40" />
                <p className="text-[12px] font-semibold text-foreground">Accelerate Access</p>
              </div>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                Skip the 11-month progression with a one-time unlock at $9,992.
                Includes lifetime access to all Cusnir_OS capabilities.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {!isVIP && (
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate("/credits")}>
                    <Crown className="h-3 w-3" /> Start VIP
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => navigate("/credits")}>
                  Unlock — $9,992
                </Button>
              </div>
            </div>
          )}

          {/* Stats footer */}
          <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground/30 py-4">
            <span>Level {xp.level} · {xp.rank_name}</span>
            <span>·</span>
            <span>{tokenBalance} NOTA2</span>
            <span>·</span>
            <span>{monthProgress}/11 months</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
