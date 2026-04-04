import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  created_at: string;
}

interface EconomicProjectionsProps {
  transactions: Transaction[];
  currentBalance: number;
}

export function EconomicProjections({ transactions, currentBalance }: EconomicProjectionsProps) {
  const projections = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTx = transactions.filter(t => new Date(t.created_at) >= thirtyDaysAgo);
    const spends = recentTx.filter(t => t.type === "spend");
    const earnings = recentTx.filter(t => t.amount > 0);

    const totalSpent30d = spends.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalEarned30d = earnings.reduce((s, t) => s + t.amount, 0);
    const dailyBurnRate = totalSpent30d / 30;
    const dailyEarnRate = totalEarned30d / 30;
    const netDailyRate = dailyEarnRate - dailyBurnRate;

    const daysUntilZero = dailyBurnRate > dailyEarnRate && currentBalance > 0
      ? Math.ceil(currentBalance / (dailyBurnRate - dailyEarnRate))
      : null;

    const projectedBalance30d = Math.max(0, currentBalance + (netDailyRate * 30));
    const projectedBalance90d = Math.max(0, currentBalance + (netDailyRate * 90));

    const avgCostPerExecution = spends.length > 0
      ? totalSpent30d / spends.length
      : 0;

    const executionsRemaining = avgCostPerExecution > 0
      ? Math.floor(currentBalance / avgCostPerExecution)
      : 0;

    return {
      dailyBurnRate: Math.round(dailyBurnRate),
      dailyEarnRate: Math.round(dailyEarnRate),
      netDailyRate: Math.round(netDailyRate),
      daysUntilZero,
      projectedBalance30d: Math.round(projectedBalance30d),
      projectedBalance90d: Math.round(projectedBalance90d),
      avgCostPerExecution: Math.round(avgCostPerExecution),
      executionsRemaining,
      monthlySpendUSD: (totalSpent30d * 0.01).toFixed(2),
    };
  }, [transactions, currentBalance]);

  const health = projections.netDailyRate >= 0 ? "positive" : projections.daysUntilZero && projections.daysUntilZero < 7 ? "critical" : "warning";

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3 w-3" /> Economic Projections
        </h2>
        <span className={cn(
          "text-nano font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
          health === "positive" ? "bg-status-validated/15 text-status-validated" :
          health === "critical" ? "bg-destructive/15 text-destructive" :
          "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        )}>
          {health === "positive" ? "Sustainable" : health === "critical" ? "Critical" : "Monitor"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <ProjectionCell
          label="Daily Burn"
          value={`${projections.dailyBurnRate}`}
          unit="N/day"
          icon={<TrendingDown className="h-3 w-3 text-destructive" />}
        />
        <ProjectionCell
          label="Daily Earn"
          value={`${projections.dailyEarnRate}`}
          unit="N/day"
          icon={<TrendingUp className="h-3 w-3 text-status-validated" />}
        />
        <ProjectionCell
          label="Executions Left"
          value={`${projections.executionsRemaining}`}
          unit="services"
          icon={<Calendar className="h-3 w-3 text-primary" />}
        />
        <ProjectionCell
          label="Monthly Spend"
          value={`$${projections.monthlySpendUSD}`}
          unit="USD"
          icon={<TrendingDown className="h-3 w-3 text-muted-foreground" />}
        />
      </div>

      {/* Runway warning */}
      {projections.daysUntilZero !== null && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs",
          projections.daysUntilZero < 7
            ? "bg-destructive/5 border border-destructive/20 text-destructive"
            : "bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400"
        )}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            At current rate, balance reaches zero in <span className="font-bold font-mono">{projections.daysUntilZero}</span> days.
            {projections.daysUntilZero < 7 && " Consider topping up."}
          </span>
        </div>
      )}

      {/* 30/90 day projections */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5">
          <p className="text-nano uppercase tracking-wider text-muted-foreground mb-0.5">30-Day Forecast</p>
          <p className="text-lg font-bold font-mono">{projections.projectedBalance30d.toLocaleString()}</p>
          <p className="text-nano text-muted-foreground">NEURONS</p>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5">
          <p className="text-nano uppercase tracking-wider text-muted-foreground mb-0.5">90-Day Forecast</p>
          <p className="text-lg font-bold font-mono">{projections.projectedBalance90d.toLocaleString()}</p>
          <p className="text-nano text-muted-foreground">NEURONS</p>
        </div>
      </div>
    </div>
  );
}

function ProjectionCell({ label, value, unit, icon }: {
  label: string; value: string; unit: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-nano uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold font-mono">{value}</span>
          <span className="text-nano text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
}
