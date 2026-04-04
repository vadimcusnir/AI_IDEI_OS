import { useFinOps } from "@/hooks/useFinOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell, BellOff, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: typeof AlertTriangle }> = {
  critical: { color: "text-destructive", bg: "bg-destructive/5 border-destructive/20", icon: AlertCircle },
  high: { color: "text-semantic-amber", bg: "bg-semantic-amber/5 border-semantic-amber/20", icon: AlertTriangle },
  medium: { color: "text-primary", bg: "bg-primary/5 border-primary/20", icon: Info },
  low: { color: "text-muted-foreground", bg: "bg-muted border-border", icon: Info },
};

export function AlertCenterTab() {
  const { alerts, loading, reload, acknowledgeAlert, resolveAlert } = useFinOps();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Bell className="h-3 w-3" /> Alert Center — {alerts.length} active
        </h3>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reload} disabled={loading}>
          <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className={cn("border rounded-xl p-4", cfg.bg)}>
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn("text-nano", cfg.color)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-nano">{alert.alert_type}</Badge>
                      {alert.provider_key && (
                        <Badge variant="secondary" className="text-nano">{alert.provider_key}</Badge>
                      )}
                      {alert.occurrences > 1 && (
                        <span className="text-nano font-mono text-muted-foreground">×{alert.occurrences}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium mb-0.5">{alert.title}</p>
                    {alert.description && (
                      <p className="text-micro text-muted-foreground mb-1">{alert.description}</p>
                    )}
                    {alert.error_signal && (
                      <p className="text-nano font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded mb-1">
                        Signal: {alert.error_signal}
                      </p>
                    )}
                    {alert.recommended_action && (
                      <p className="text-micro text-primary">→ {alert.recommended_action}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-nano text-muted-foreground">
                        First: {formatDistanceToNow(new Date(alert.first_seen), { addSuffix: true })}
                      </span>
                      <span className="text-nano text-muted-foreground">
                        Last: {formatDistanceToNow(new Date(alert.last_seen), { addSuffix: true })}
                      </span>
                      {alert.impact_scope && (
                        <span className="text-nano text-muted-foreground">Impact: {alert.impact_scope}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!alert.acknowledged_at && (
                      <Button variant="outline" size="sm" className="h-6 text-micro px-2" onClick={() => acknowledgeAlert(alert.id)}>
                        ACK
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-6 text-micro px-2" onClick={() => resolveAlert(alert.id)}>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
