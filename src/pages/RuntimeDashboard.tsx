import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useRuntimeHealth } from "@/hooks/useRuntimeHealth";
import {
  Loader2, Activity, Shield, ShieldAlert, ShieldOff,
  Zap, Clock, AlertTriangle, ToggleLeft, ToggleRight,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RuntimeDashboard() {
  const { stats, services, flags, loading, reload } = useRuntimeHealth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const overallStatus = stats
    ? stats.services_down > 0 ? "critical"
    : stats.services_degraded > 0 ? "degraded"
    : "healthy"
    : "unknown";

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="System Runtime — AI-IDEI" description="Real-time system health, circuit breakers and feature flags." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                overallStatus === "healthy" ? "bg-status-validated/10" :
                overallStatus === "degraded" ? "bg-primary/10" : "bg-destructive/10"
              )}>
                <Activity className={cn(
                  "h-5 w-5",
                  overallStatus === "healthy" ? "text-status-validated" :
                  overallStatus === "degraded" ? "text-primary" : "text-destructive"
                )} />
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold tracking-tight">System Runtime</h1>
                <p className="text-[10px] text-muted-foreground">Health monitoring, circuit breakers & feature flags</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={reload}>
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={Shield}
              label="Healthy"
              value={stats?.services_healthy ?? 0}
              accent="text-status-validated"
            />
            <StatCard
              icon={ShieldAlert}
              label="Degraded"
              value={stats?.services_degraded ?? 0}
              accent="text-primary"
            />
            <StatCard
              icon={ShieldOff}
              label="Down"
              value={stats?.services_down ?? 0}
              accent={stats && stats.services_down > 0 ? "text-destructive" : "text-muted-foreground"}
            />
            <StatCard
              icon={Clock}
              label="Avg Latency"
              value={`${Math.round(stats?.avg_latency_ms ?? 0)}ms`}
            />
          </div>

          {/* Second stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Zap} label="Validations/1h" value={stats?.validations_1h ?? 0} />
            <StatCard
              icon={AlertTriangle}
              label="Denials/1h"
              value={stats?.denials_1h ?? 0}
              accent={stats && stats.denials_1h > 10 ? "text-destructive" : undefined}
            />
            <StatCard icon={ToggleRight} label="Active Flags" value={stats?.feature_flags_active ?? 0} accent="text-primary" />
            <StatCard icon={Activity} label="Active Jobs" value={stats?.active_jobs ?? 0} />
          </div>

          {/* Service Health */}
          {services.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Circuit Breaker Status
              </h2>
              <div className="space-y-1">
                {services.map(svc => (
                  <div key={svc.service_key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors">
                    <div className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      svc.circuit_state === "closed" ? "bg-status-validated" :
                      svc.circuit_state === "half_open" ? "bg-primary" : "bg-destructive"
                    )} />
                    <span className="text-xs font-mono flex-1 truncate">{svc.service_key}</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px]",
                      svc.circuit_state === "closed" ? "text-status-validated border-status-validated/30" :
                      svc.circuit_state === "half_open" ? "text-primary border-primary/30" :
                      "text-destructive border-destructive/30"
                    )}>
                      {svc.circuit_state}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{svc.avg_latency_ms}ms</span>
                    {svc.consecutive_failures > 0 && (
                      <span className="text-[10px] font-mono text-destructive">{svc.consecutive_failures} fails</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Flags */}
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Feature Flags
            </h2>
            {flags.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No feature flags configured</p>
            ) : (
              <div className="space-y-1">
                {flags.map(flag => (
                  <div key={flag.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors">
                    {flag.enabled ? (
                      <ToggleRight className="h-4 w-4 text-status-validated shrink-0" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-medium">{flag.key}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{flag.description}</p>
                    </div>
                    <Badge variant={flag.enabled ? "secondary" : "outline"} className="text-[9px] shrink-0">
                      {flag.enabled ? `${flag.rollout_percentage}%` : "OFF"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn("h-3.5 w-3.5", accent || "text-muted-foreground")} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-xl font-bold font-mono", accent)}>{value}</span>
    </div>
  );
}
