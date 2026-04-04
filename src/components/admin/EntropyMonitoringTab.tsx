import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PeriodMetrics {
  period: string;
  credits_spent: number;
  credits_earned: number;
  jobs_completed: number;
  jobs_failed: number;
  new_neurons: number;
  new_users: number;
}

interface EntropySignal {
  label: string;
  value: number;
  trend: "up" | "down" | "flat";
  healthy: boolean;
  description: string;
}

export function EntropyMonitoringTab() {
  const [periods, setPeriods] = useState<PeriodMetrics[]>([]);
  const [signals, setSignals] = useState<EntropySignal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    // Get data for last 4 weeks
    const now = new Date();
    const weeklyData: PeriodMetrics[] = [];

    for (let w = 0; w < 4; w++) {
      const end = new Date(now.getTime() - w * 7 * 86400000);
      const start = new Date(end.getTime() - 7 * 86400000);
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const label = `W-${w}`;

      const [spentRes, earnedRes, jobsDoneRes, jobsFailRes, neuronsRes, usersRes] = await Promise.all([
        supabase.from("credit_transactions").select("amount").eq("type", "spend").gte("created_at", startISO).lte("created_at", endISO),
        supabase.from("credit_transactions").select("amount").in("type", ["topup", "bonus", "admin_grant"]).gte("created_at", startISO).lte("created_at", endISO),
        supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", startISO).lte("created_at", endISO),
        supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", startISO).lte("created_at", endISO),
        supabase.from("neurons").select("id", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
        supabase.from("user_credits").select("user_id", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
      ]);

      const spent = Math.abs((spentRes.data || []).reduce((s, r: any) => s + (r.amount || 0), 0));
      const earned = (earnedRes.data || []).reduce((s, r: any) => s + Math.abs(r.amount || 0), 0);

      weeklyData.push({
        period: label,
        credits_spent: spent,
        credits_earned: earned,
        jobs_completed: jobsDoneRes.count ?? 0,
        jobs_failed: jobsFailRes.count ?? 0,
        new_neurons: neuronsRes.count ?? 0,
        new_users: usersRes.count ?? 0,
      });
    }

    setPeriods(weeklyData);

    // Compute entropy signals
    const current = weeklyData[0];
    const previous = weeklyData[1];
    const computedSignals: EntropySignal[] = [];

    if (previous) {
      // Cost growth rate
      const costGrowth = previous.credits_spent > 0
        ? ((current.credits_spent - previous.credits_spent) / previous.credits_spent) * 100
        : 0;
      computedSignals.push({
        label: "Cost Growth",
        value: Math.round(costGrowth),
        trend: costGrowth > 0 ? "up" : costGrowth < 0 ? "down" : "flat",
        healthy: costGrowth < 50, // >50% weekly growth is concerning
        description: "Week-over-week credit consumption change",
      });

      // Revenue growth rate
      const revGrowth = previous.credits_earned > 0
        ? ((current.credits_earned - previous.credits_earned) / previous.credits_earned) * 100
        : 0;
      computedSignals.push({
        label: "Revenue Growth",
        value: Math.round(revGrowth),
        trend: revGrowth > 0 ? "up" : revGrowth < 0 ? "down" : "flat",
        healthy: revGrowth >= -10,
        description: "Week-over-week revenue (top-ups) change",
      });

      // Entropy ratio = cost growth / revenue growth
      const entropy = revGrowth !== 0 ? costGrowth / revGrowth : costGrowth > 0 ? 999 : 0;
      computedSignals.push({
        label: "Entropy Ratio",
        value: parseFloat(entropy.toFixed(2)),
        trend: entropy > 1.5 ? "up" : entropy < 0.8 ? "down" : "flat",
        healthy: entropy <= 1.5 && entropy >= 0,
        description: "Cost growth ÷ Revenue growth. <1.5 = healthy",
      });

      // Failure rate
      const totalJobs = current.jobs_completed + current.jobs_failed;
      const failRate = totalJobs > 0 ? (current.jobs_failed / totalJobs) * 100 : 0;
      computedSignals.push({
        label: "Failure Rate",
        value: Math.round(failRate),
        trend: failRate > 10 ? "up" : "flat",
        healthy: failRate < 15,
        description: "Percentage of jobs failing this week",
      });

      // User growth
      const userGrowth = previous.new_users > 0
        ? ((current.new_users - previous.new_users) / previous.new_users) * 100
        : current.new_users > 0 ? 100 : 0;
      computedSignals.push({
        label: "User Growth",
        value: Math.round(userGrowth),
        trend: userGrowth > 0 ? "up" : userGrowth < 0 ? "down" : "flat",
        healthy: userGrowth >= 0,
        description: "Week-over-week new user registrations",
      });

      // Neuron velocity
      const neuronGrowth = previous.new_neurons > 0
        ? ((current.new_neurons - previous.new_neurons) / previous.new_neurons) * 100
        : current.new_neurons > 0 ? 100 : 0;
      computedSignals.push({
        label: "Neuron Velocity",
        value: Math.round(neuronGrowth),
        trend: neuronGrowth > 0 ? "up" : neuronGrowth < 0 ? "down" : "flat",
        healthy: neuronGrowth >= -20,
        description: "Week-over-week neuron creation rate",
      });
    }

    setSignals(computedSignals);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const unhealthyCount = signals.filter(s => !s.healthy).length;

  return (
    <div className="space-y-4">
      {/* Health banner */}
      {unhealthyCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">{unhealthyCount} entropy signal(s) outside healthy range</p>
            <p className="text-xs text-muted-foreground">Review the signals below to identify potential issues.</p>
          </div>
        </div>
      )}

      {/* Signals grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {signals.map(s => (
          <div key={s.label} className={cn(
            "bg-card border rounded-xl p-4",
            s.healthy ? "border-border" : "border-destructive/40"
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
              {s.trend === "up" ? (
                <TrendingUp className={cn("h-3.5 w-3.5", s.healthy ? "text-primary" : "text-destructive")} />
              ) : s.trend === "down" ? (
                <TrendingDown className={cn("h-3.5 w-3.5", s.healthy ? "text-primary" : "text-destructive")} />
              ) : (
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <p className={cn("text-2xl font-bold font-mono", s.healthy ? "text-foreground" : "text-destructive")}>
              {s.value}{s.label !== "Entropy Ratio" ? "%" : ""}
            </p>
            <p className="text-nano text-muted-foreground mt-1">{s.description}</p>
          </div>
        ))}
      </div>

      {/* Weekly breakdown */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> Weekly Breakdown (Last 4 Weeks)
          </h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {periods.map((p, i) => (
            <div key={p.period} className={cn("rounded-lg p-3 text-center space-y-2", i === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/30")}>
              <p className="text-micro font-semibold uppercase text-muted-foreground">
                {i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i} weeks ago`}
              </p>
              <div>
                <p className="text-nano text-muted-foreground">Spent</p>
                <p className="text-sm font-mono font-bold">{p.credits_spent}</p>
              </div>
              <div>
                <p className="text-nano text-muted-foreground">Earned</p>
                <p className="text-sm font-mono font-bold text-primary">{p.credits_earned}</p>
              </div>
              <div>
                <p className="text-nano text-muted-foreground">Jobs ✓/✗</p>
                <p className="text-sm font-mono">
                  <span className="text-primary">{p.jobs_completed}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-destructive">{p.jobs_failed}</span>
                </p>
              </div>
              <div>
                <p className="text-nano text-muted-foreground">Neurons</p>
                <p className="text-sm font-mono font-bold">{p.new_neurons}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
