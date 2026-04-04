/**
 * ConsumptionAnalytics — Shows spending breakdown by service,
 * velocity trends, and anomaly detection indicators.
 */
import { useMemo } from "react";
import { BarChart3, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface ConsumptionAnalyticsProps {
  transactions: Transaction[];
}

export function ConsumptionAnalytics({ transactions }: ConsumptionAnalyticsProps) {
  const analytics = useMemo(() => {
    const spends = transactions.filter(t => t.type === "spend");
    if (spends.length === 0) return null;

    // Service breakdown
    const byService: Record<string, { count: number; total: number }> = {};
    spends.forEach(t => {
      const name = t.description
        .replace(/^(SPEND|EXTRACTION|Service|Storage fee): ?/, "")
        .split(" — ")[0]
        .trim() || "Other";
      if (!byService[name]) byService[name] = { count: 0, total: 0 };
      byService[name].count++;
      byService[name].total += Math.abs(t.amount);
    });
    const topServices = Object.entries(byService)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 6);
    const maxTotal = topServices[0]?.[1].total || 1;

    // Daily velocity (last 7 days)
    const now = Date.now();
    const dayMs = 86400000;
    const dailySpend: number[] = Array(7).fill(0);
    spends.forEach(t => {
      const age = now - new Date(t.created_at).getTime();
      const dayIdx = Math.floor(age / dayMs);
      if (dayIdx >= 0 && dayIdx < 7) dailySpend[6 - dayIdx] += Math.abs(t.amount);
    });

    // Anomaly: today's spend > 2x average of last 6 days
    const avgPrev = dailySpend.slice(0, 6).reduce((s, v) => s + v, 0) / 6;
    const todaySpend = dailySpend[6];
    const isAnomaly = avgPrev > 0 && todaySpend > avgPrev * 2;

    // Total this week
    const weekTotal = dailySpend.reduce((s, v) => s + v, 0);
    const dailyAvg = Math.round(weekTotal / 7);

    return { topServices, maxTotal, dailySpend, isAnomaly, todaySpend, avgPrev, weekTotal, dailyAvg };
  }, [transactions]);

  if (!analytics || analytics.topServices.length === 0) return null;

  const dayLabels = ["6d", "5d", "4d", "3d", "2d", "1d", "Today"];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Consumption Analytics</h3>
        </div>
        <div className="flex items-center gap-3 text-micro text-muted-foreground">
          <span>Week: <strong className="text-foreground font-mono">{analytics.weekTotal.toLocaleString()}N</strong></span>
          <span>Avg: <strong className="text-foreground font-mono">{analytics.dailyAvg}N/day</strong></span>
        </div>
      </div>

      {/* Anomaly alert */}
      {analytics.isAnomaly && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs mb-4">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Unusual spending detected: {analytics.todaySpend.toLocaleString()}N today vs {Math.round(analytics.avgPrev).toLocaleString()}N average.
          </span>
        </div>
      )}

      {/* Daily velocity chart */}
      <div className="mb-5">
        <p className="text-micro uppercase tracking-wider text-muted-foreground mb-2">7-Day Velocity</p>
        <div className="flex items-end gap-1 h-16">
          {analytics.dailySpend.map((v, i) => {
            const maxDay = Math.max(...analytics.dailySpend, 1);
            const h = Math.max(4, (v / maxDay) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className={cn(
                    "w-full rounded-sm transition-all",
                    i === 6 ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                  style={{ height: `${h}%` }}
                  title={`${dayLabels[i]}: ${v}N`}
                />
                <span className="text-nano text-muted-foreground/60">{dayLabels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top services */}
      <p className="text-micro uppercase tracking-wider text-muted-foreground mb-2">Top Services</p>
      <div className="space-y-2">
        {analytics.topServices.map(([name, stats]) => (
          <div key={name} className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            <span className="text-xs truncate flex-1 min-w-0">{name}</span>
            <span className="text-micro text-muted-foreground shrink-0">{stats.count}×</span>
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(stats.total / analytics.maxTotal) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold w-12 text-right shrink-0">{stats.total}N</span>
          </div>
        ))}
      </div>
    </div>
  );
}
