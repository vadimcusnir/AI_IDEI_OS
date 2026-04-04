import { useFinOps, ProviderHealth } from "@/hooks/useFinOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, ShieldCheck, ShieldAlert, ShieldOff, Clock, AlertTriangle, Zap, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Activity }> = {
  healthy: { color: "text-status-validated", icon: ShieldCheck },
  warning: { color: "text-semantic-amber", icon: ShieldAlert },
  degraded: { color: "text-primary", icon: ShieldAlert },
  failed: { color: "text-destructive", icon: ShieldOff },
  unknown: { color: "text-muted-foreground", icon: Activity },
};

const KNOWN_PROVIDERS = [
  { key: "openai", label: "OpenAI" },
  { key: "elevenlabs", label: "ElevenLabs" },
  { key: "stripe", label: "Stripe" },
  { key: "heygen", label: "HeyGen" },
  { key: "youtube", label: "YouTube Data API" },
  { key: "supabase", label: "Supabase" },
  { key: "sentry", label: "Sentry" },
];

function ProviderRow({ provider, label, providerKey }: { provider: ProviderHealth | null; label: string; providerKey: string }) {
  const p = provider;
  const status = p?.status || "unknown";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const Icon = cfg.icon;

  return (
    <TableRow>
      <TableCell className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        <div>
          <p className="text-xs font-medium">{label}</p>
          <p className="text-[9px] font-mono text-muted-foreground">{providerKey}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-[9px]", cfg.color)}>
          {status.toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell className="text-[10px] font-mono text-right">
        {p?.auth_status === "ok" ? "✓" : p?.auth_status || "—"}
      </TableCell>
      <TableCell className="text-[10px] font-mono text-right">
        {p?.quota_remaining != null && p?.quota_limit != null
          ? `${Math.round((p.quota_remaining / p.quota_limit) * 100)}%`
          : "—"}
      </TableCell>
      <TableCell className="text-[10px] font-mono text-right">
        {p?.balance_remaining != null ? `$${p.balance_remaining.toFixed(2)}` : "—"}
      </TableCell>
      <TableCell className="text-[10px] font-mono text-right">
        {p?.monthly_spend != null ? `$${p.monthly_spend.toFixed(2)}` : "—"}
      </TableCell>
      <TableCell className="text-[10px] font-mono text-right">
        {p ? `${p.failure_rate_1h.toFixed(1)}%` : "—"}
      </TableCell>
      <TableCell className="text-[10px] font-mono text-right">
        {p ? `${Math.round(p.avg_latency_1h)}ms` : "—"}
      </TableCell>
      <TableCell className="text-[10px] font-mono text-right">
        {p ? `${p.retry_rate.toFixed(1)}%` : "—"}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-[9px]",
          p?.alert_level === "critical" ? "text-destructive border-destructive/30" :
          p?.alert_level === "high" ? "text-semantic-amber border-semantic-amber/30" :
          p?.alert_level === "none" || !p?.alert_level ? "text-muted-foreground" : ""
        )}>
          {p?.alert_level || "NONE"}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

export function ProviderHealthTab() {
  const { stats, providers, loading, reload } = useFinOps();

  const providerMap = new Map(providers.map(p => [p.provider_key, p]));

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KPI icon={Activity} label="Jobs Running" value={stats?.jobs_running ?? 0} />
        <KPI icon={AlertTriangle} label="Failed (1h)" value={stats?.jobs_failed_1h ?? 0} accent={stats && stats.jobs_failed_1h > 0 ? "text-destructive" : undefined} />
        <KPI icon={AlertTriangle} label="Failed (24h)" value={stats?.jobs_failed_24h ?? 0} />
        <KPI icon={Zap} label="Completed (24h)" value={stats?.jobs_completed_24h ?? 0} accent="text-status-validated" />
        <KPI icon={DollarSign} label="Credits Spent (24h)" value={stats?.total_credits_spent_24h ?? 0} accent="text-primary" />
      </div>

      {/* Provider grid */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> Provider Status Grid
          </h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reload} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Provider</TableHead>
                <TableHead className="text-[10px]">Status</TableHead>
                <TableHead className="text-[10px] text-right">Auth</TableHead>
                <TableHead className="text-[10px] text-right">Quota</TableHead>
                <TableHead className="text-[10px] text-right">Balance</TableHead>
                <TableHead className="text-[10px] text-right">Spend/mo</TableHead>
                <TableHead className="text-[10px] text-right">Fail% 1h</TableHead>
                <TableHead className="text-[10px] text-right">Latency 1h</TableHead>
                <TableHead className="text-[10px] text-right">Retry%</TableHead>
                <TableHead className="text-[10px]">Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {KNOWN_PROVIDERS.map(kp => (
                <ProviderRow
                  key={kp.key}
                  provider={providerMap.get(kp.key) || null}
                  label={kp.label}
                  providerKey={kp.key}
                />
              ))}
              {/* Any additional providers not in KNOWN list */}
              {providers.filter(p => !KNOWN_PROVIDERS.some(kp => kp.key === p.provider_key)).map(p => (
                <ProviderRow key={p.provider_key} provider={p} label={p.provider_key} providerKey={p.provider_key} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Consumption indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon={DollarSign} label="Avg Job Cost" value={`${Math.round(stats?.avg_job_cost ?? 0)}N`} />
        <KPI icon={Zap} label="Refunded (24h)" value={stats?.total_credits_refunded_24h ?? 0} accent="text-semantic-amber" />
        <KPI icon={AlertTriangle} label="Active Alerts" value={stats?.active_alerts ?? 0} accent={stats && stats.active_alerts > 0 ? "text-destructive" : undefined} />
        <KPI icon={ShieldAlert} label="Critical Alerts" value={stats?.critical_alerts ?? 0} accent={stats && stats.critical_alerts > 0 ? "text-destructive" : undefined} />
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number | string; accent?: string }) {
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
