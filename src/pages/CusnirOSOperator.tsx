import { useOSOperator } from "@/hooks/useOSOperator";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigate } from "react-router-dom";
import {
  ShieldAlert, Activity, Server, Cpu, Clock, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Terminal, Zap, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const HEALTH_COLORS: Record<string, string> = {
  healthy: "text-status-validated bg-status-validated/10",
  warning: "text-warning bg-warning/10",
  critical: "text-destructive bg-destructive/10",
};

const HEALTH_ICONS: Record<string, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-status-validated/10 text-status-validated",
  locked: "bg-muted text-muted-foreground",
  deprecated: "bg-destructive/10 text-destructive",
  experimental: "bg-warning/10 text-warning",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-status-validated",
  medium: "text-warning",
  high: "text-semantic-amber",
  critical: "text-destructive",
};

export default function CusnirOSOperator() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { modules, stats, ledger, loading } = useOSOperator();

  if (authLoading || adminLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
        <ShieldAlert className="h-12 w-12 text-destructive/40" />
        <h1 className="text-lg font-semibold">Acces Restricționat</h1>
        <p className="text-sm text-muted-foreground">CusnirOS Operator Layer — doar pentru administratori.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 overflow-auto">
        <SEOHead title="CusnirOS — Operator Layer" description="System control surface for OS modules, health monitoring, and decision audit." />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* System Indicators Bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <IndicatorCard icon={Terminal} label="OS Version" value={stats.os_version} />
              <IndicatorCard icon={Cpu} label="Prompt System" value={stats.prompt_system_version} />
              <IndicatorCard icon={Activity} label="Avg Latency" value={`${Math.round(stats.avg_latency_ms)}ms`} />
              <IndicatorCard icon={Server} label="Queue Depth" value={String(stats.queue_depth)} />
              <IndicatorCard icon={Zap} label="Active Jobs" value={String(stats.active_jobs)} />
              <IndicatorCard icon={ScrollText} label="Ledger 24h" value={String(stats.decision_ledger_24h)} />
            </div>
          )}

          {/* Module Health Summary */}
          {stats && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Modules:</span>
              <Badge variant="outline" className="gap-1 text-status-validated"><CheckCircle2 className="h-3 w-3" /> {stats.healthy_modules} healthy</Badge>
              {stats.warning_modules > 0 && <Badge variant="outline" className="gap-1 text-amber-500"><AlertTriangle className="h-3 w-3" /> {stats.warning_modules} warning</Badge>}
              {stats.critical_modules > 0 && <Badge variant="outline" className="gap-1 text-destructive"><XCircle className="h-3 w-3" /> {stats.critical_modules} critical</Badge>}
            </div>
          )}

          {/* Module Registry Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" /> Module Registry ({modules.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium">Module</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Version</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Health</th>
                      <th className="text-left p-3 font-medium">Risk</th>
                      <th className="text-right p-3 font-medium">Latency</th>
                      <th className="text-right p-3 font-medium">Error %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => {
                      const HealthIcon = HEALTH_ICONS[m.health_status] || Activity;
                      return (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-3">
                            <div className="font-medium">{m.module_name}</div>
                            <div className="text-muted-foreground text-[10px] mt-0.5 max-w-[200px] truncate">{m.description}</div>
                          </td>
                          <td className="p-3 capitalize">{m.module_type}</td>
                          <td className="p-3 font-mono">{m.version}</td>
                          <td className="p-3">
                            <Badge className={cn("text-[10px]", STATUS_COLORS[m.status] || "")}>{m.status}</Badge>
                          </td>
                          <td className="p-3">
                            <span className={cn("inline-flex items-center gap-1", HEALTH_COLORS[m.health_status] || "")}>
                              <HealthIcon className="h-3 w-3" /> {m.health_status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={cn("font-medium", RISK_COLORS[m.risk_level] || "")}>{m.risk_level}</span>
                          </td>
                          <td className="p-3 text-right tabular-nums">{m.avg_latency_ms}ms</td>
                          <td className="p-3 text-right tabular-nums">{(m.error_rate * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Decision Ledger Monitor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-primary" /> Decision Ledger (recent)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ledger.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Nicio intrare în ledger.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 font-medium">Timestamp</th>
                        <th className="text-left p-3 font-medium">Event</th>
                        <th className="text-left p-3 font-medium">Resource</th>
                        <th className="text-left p-3 font-medium">Verdict</th>
                        <th className="text-left p-3 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((e) => (
                        <tr key={e.id} className="border-b border-border/50">
                          <td className="p-3 tabular-nums text-muted-foreground">{format(new Date(e.created_at), "dd MMM HH:mm")}</td>
                          <td className="p-3 font-medium">{e.event_type}</td>
                          <td className="p-3">{e.target_resource || "—"}</td>
                          <td className="p-3">
                            {e.verdict && (
                              <Badge variant="outline" className={cn("text-[10px]",
                                e.verdict === "ALLOW" ? "text-status-validated" :
                                e.verdict === "DENY" ? "text-destructive" : ""
                              )}>{e.verdict}</Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground max-w-[200px] truncate">{e.reason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

function IndicatorCard({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
