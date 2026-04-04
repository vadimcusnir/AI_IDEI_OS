import { SEOHead } from "@/components/SEOHead";
import { useCapacityDashboard } from "@/hooks/useCapitalization";
import {
  Gauge, Zap, TrendingUp, Layers, Activity, AlertTriangle, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

function StatCard({ icon: Icon, label, value, sub, alert }: {
  icon: typeof Gauge; label: string; value: string; sub?: string; alert?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-4",
      alert && "border-destructive/30 bg-destructive/5"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", alert ? "text-destructive" : "text-primary")} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="text-micro text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function CapitalizationEngine() {
  const { data, isLoading } = useCapacityDashboard();

  const utilPct = data ? Math.round(Number(data.utilization) * 100) : 0;
  const isHighUtil = utilPct > 80;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SEOHead title="Capitalization Engine — AI-IDEI" description="Motor 2 & 3: Knowledge capitalization and economic engine" />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Capitalization Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Motor 2 (Knowledge Capital) + Motor 3 (Economic Pressure)
        </p>
      </div>

      {isLoading || !data ? (
        <div className="text-muted-foreground text-sm">Loading capacity data...</div>
      ) : (
        <>
          {/* Capacity overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard
              icon={Gauge}
              label="Utilization"
              value={`${utilPct}%`}
              sub={`${Number(data.consumed).toLocaleString()} / ${Number(data.monthly_capacity).toLocaleString()}`}
              alert={isHighUtil}
            />
            <StatCard
              icon={TrendingUp}
              label="Price Multiplier"
              value={`${Number(data.multiplier).toFixed(2)}×`}
              sub={data.premium_only ? "PREMIUM ONLY MODE" : "Normal"}
              alert={data.premium_only}
            />
            <StatCard
              icon={Activity}
              label="Queue Depth"
              value={String(data.queue_depth)}
              sub={`Avg latency: ${data.avg_latency_ms}ms`}
            />
            <StatCard
              icon={Layers}
              label="Dedup Clusters"
              value={String(data.dedup_clusters)}
              sub={`Avg MPI: ${Number(data.avg_mpi).toFixed(1)}`}
            />
          </div>

          {/* Utilization bar */}
          <div className="rounded-xl border border-border bg-card p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Monthly Capacity</span>
              <span className={cn(
                "text-xs font-mono px-2 py-0.5 rounded",
                isHighUtil ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}>
                {utilPct}%
              </span>
            </div>
            <Progress value={utilPct} className="h-3" />
            <div className="flex justify-between text-micro text-muted-foreground mt-2">
              <span>0%</span>
              <span className="text-muted-foreground/50">60% — Surge Start</span>
              <span className="text-muted-foreground/50">90% — Premium Only</span>
              <span>100%</span>
            </div>

            {isHighUtil && (
              <div className="mt-4 flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong>High utilization.</strong> Dynamic pricing multiplier active.
                  Consider upgrading staking tier for priority access and discounts.
                </div>
              </div>
            )}
          </div>

          {/* Top MPI */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Top Monetization Potential (MPI)</h3>
            </div>
            {data.top_mpi.length === 0 ? (
              <p className="text-xs text-muted-foreground">No MPI scores computed yet. Run extraction pipelines to generate scores.</p>
            ) : (
              <div className="space-y-2">
                {data.top_mpi.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{item.title || "Untitled"}</div>
                      <div className="text-micro text-muted-foreground">
                        App: {Number(item.applicability_score).toFixed(0)} · Clarity: {Number(item.clarity_score).toFixed(0)} · Rarity: {Number(item.rarity_score).toFixed(0)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-primary">{Number(item.mpi_score).toFixed(0)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
