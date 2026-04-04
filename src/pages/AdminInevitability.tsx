import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Lock, TrendingUp, Users, Zap, Crown, Shield,
  BarChart3, Activity, Rocket, RefreshCw, Loader2,
  Target, DollarSign, Repeat, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EngineAction = "compute_lock_in" | "update_rankings" | "snapshot_metrics" | "auto_evolve";

export default function AdminInevitability() {
  const qc = useQueryClient();
  const [running, setRunning] = useState<EngineAction | null>(null);

  // Platform metrics (latest)
  const { data: metrics } = useQuery({
    queryKey: ["inevitability-metrics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("platform_metrics" as any)
        .select("*")
        .order("metric_date", { ascending: false })
        .limit(1);
      return (data as any)?.[0] || null;
    },
  });

  // Lock-in distribution
  const { data: lockInStats } = useQuery({
    queryKey: ["inevitability-lockin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_lock_in" as any)
        .select("tier, total_score")
        .order("total_score", { ascending: false });
      const tiers = { explorer: 0, engaged: 0, dependent: 0, locked: 0 };
      for (const u of (data || []) as any[]) {
        if (u.tier in tiers) tiers[u.tier as keyof typeof tiers]++;
      }
      const avgScore = (data || []).length > 0
        ? (data as any[]).reduce((s: number, u: any) => s + Number(u.total_score), 0) / data!.length
        : 0;
      return { tiers, total: (data || []).length, avgScore: Math.round(avgScore * 100) / 100 };
    },
  });

  // Top creators
  const { data: topCreators } = useQuery({
    queryKey: ["inevitability-creators"],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_rankings" as any)
        .select("user_id, creator_rank, creator_tier, total_revenue_neurons, reputation_score, total_assets_sold")
        .order("creator_rank", { ascending: true })
        .limit(10);
      return (data || []) as any[];
    },
  });

  const runAction = useMutation({
    mutationFn: async (action: EngineAction) => {
      setRunning(action);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inevitability-engine`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      return resp.json();
    },
    onSuccess: (data, action) => {
      toast.success(`${action} completed`, { description: JSON.stringify(data) });
      qc.invalidateQueries({ queryKey: ["inevitability-metrics"] });
      qc.invalidateQueries({ queryKey: ["inevitability-lockin"] });
      qc.invalidateQueries({ queryKey: ["inevitability-creators"] });
    },
    onError: (err) => toast.error("Engine error", { description: String(err) }),
    onSettled: () => setRunning(null),
  });

  const actions: { key: EngineAction; label: string; icon: any; desc: string }[] = [
    { key: "snapshot_metrics", label: "Snapshot Metrics", icon: BarChart3, desc: "Platform health snapshot" },
    { key: "compute_lock_in", label: "Compute Lock-In", icon: Lock, desc: "Calculate user dependency scores" },
    { key: "update_rankings", label: "Update Rankings", icon: Crown, desc: "Refresh creator leaderboard" },
    { key: "auto_evolve", label: "Auto-Evolve", icon: Rocket, desc: "Self-improving triggers" },
  ];

  const lockInTiers = [
    { key: "locked", label: "Locked", color: "bg-primary" },
    { key: "dependent", label: "Dependent", color: "bg-semantic-blue" },
    { key: "engaged", label: "Engaged", color: "bg-semantic-amber" },
    { key: "explorer", label: "Explorer", color: "bg-muted-foreground/30" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <SEOHead title="Inevitability Engine" description="Platform lock-in, creator rankings, and real metrics" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Inevitability Engine</h1>
            <p className="text-xs text-muted-foreground">Lock-in · Rankings · Real Metrics · Auto-Evolution</p>
          </div>
        </div>
      </div>

      {/* Real Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Revenue / User", value: metrics ? `${metrics.revenue_per_user}N` : "—", icon: DollarSign, color: "text-semantic-emerald" },
          { label: "Assets / Execution", value: metrics?.assets_per_execution ?? "—", icon: TrendingUp, color: "text-semantic-blue" },
          { label: "Marketplace Velocity", value: metrics ? `${metrics.marketplace_velocity}/day` : "—", icon: Activity, color: "text-semantic-amber" },
          { label: "Reuse Rate", value: metrics ? `${(metrics.reuse_rate * 100).toFixed(1)}%` : "—", icon: Repeat, color: "text-semantic-purple" },
          { label: "Avg Lock-In", value: metrics ? `${metrics.avg_lock_in_score}/10` : "—", icon: Lock, color: "text-primary" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
              <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Platform Health */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <Users className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{metrics.total_users}</p>
            <p className="text-micro text-muted-foreground">Total Users</p>
            <p className="text-micro text-primary">{metrics.active_users_7d} active (7d)</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Brain className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{metrics.total_executions?.toLocaleString()}</p>
            <p className="text-micro text-muted-foreground">Total Executions</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Target className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{metrics.total_assets?.toLocaleString()}</p>
            <p className="text-micro text-muted-foreground">Total Assets</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Zap className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{Number(metrics.total_revenue_neurons).toLocaleString()}N</p>
            <p className="text-micro text-muted-foreground">Total Revenue</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lock-In Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary" /> Lock-In Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lockInStats && lockInTiers.map(({ key, label, color }) => {
              const count = lockInStats.tiers[key as keyof typeof lockInStats.tiers] || 0;
              const pct = lockInStats.total > 0 ? (count / lockInStats.total) * 100 : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground">{count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {lockInStats && (
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Average Score</span>
                <Badge variant="outline" className="font-mono text-micro">{lockInStats.avgScore}/10</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Creators */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-500" /> Top Creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(topCreators || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No creators ranked yet</p>
            ) : (
              <div className="space-y-2">
                {(topCreators || []).map((c: any, i: number) => (
                  <div key={c.user_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-micro font-mono text-muted-foreground">#{c.creator_rank}</span>
                      <Badge variant={c.creator_tier === "legend" ? "default" : "outline"} className="text-nano capitalize">
                        {c.creator_tier}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{c.total_assets_sold} sold</span>
                      <span className="font-mono font-medium text-foreground">{Number(c.total_revenue_neurons).toLocaleString()}N</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitive Moats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" /> Competitive Moats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "DATA MOAT", desc: "Neurons + Executions + Outcomes",
                value: metrics ? `${(metrics.total_executions || 0).toLocaleString()} ops` : "—",
                strength: metrics ? Math.min(100, ((metrics.total_executions || 0) / 1000) * 100) : 0,
              },
              {
                label: "ECONOMIC MOAT", desc: "User Assets + Marketplace Income",
                value: metrics ? `${Number(metrics.total_revenue_neurons || 0).toLocaleString()}N` : "—",
                strength: metrics ? Math.min(100, (Number(metrics.total_revenue_neurons || 0) / 100000) * 100) : 0,
              },
              {
                label: "BEHAVIORAL MOAT", desc: "User Dependency on Outputs",
                value: lockInStats ? `${lockInStats.avgScore}/10 avg` : "—",
                strength: lockInStats ? (lockInStats.avgScore / 10) * 100 : 0,
              },
            ].map(moat => (
              <div key={moat.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{moat.label}</span>
                    <p className="text-nano text-muted-foreground/70">{moat.desc}</p>
                  </div>
                  <span className="text-xs font-mono text-foreground">{moat.value}</span>
                </div>
                <Progress value={moat.strength} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Engine Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map(({ key, label, icon: Icon, desc }) => (
          <button
            key={key}
            onClick={() => runAction.mutate(key)}
            disabled={running !== null}
            className={cn(
              "rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-muted/30",
              running === key && "ring-2 ring-primary/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {running === key ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Icon className="h-4 w-4 text-primary" />}
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </div>
            <p className="text-micro text-muted-foreground">{desc}</p>
          </button>
        ))}
      </div>

      {/* System State */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">System State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {["EXECUTION SYSTEM", "→", "LOCK-IN ENGINE", "→", "CREATOR ECONOMY", "→", "COMPETITIVE MOATS", "→", "ECONOMIC GRAVITY CENTER"].map((step, i) => (
              step === "→" ? (
                <span key={i} className="text-muted-foreground">→</span>
              ) : (
                <Badge key={i} variant={i >= 6 ? "default" : "secondary"} className="text-micro font-mono">
                  {step}
                </Badge>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
