/**
 * AdminCommandTab — Strategic decision panel with suggested actions, priority scores, warnings.
 * Phase 7 / T7.4
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, Loader2, Compass, ArrowRight, AlertTriangle,
  TrendingUp, Zap, Target, Shield, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestedAction {
  title: string;
  type: "generate_revenue" | "improve_conversion" | "build_authority" | "optimize_system" | "reduce_risk";
  priority: number;
  impact: string;
  effort: "low" | "medium" | "high";
  reason: string;
}

interface Warning {
  message: string;
  severity: "info" | "warn" | "critical";
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  generate_revenue: { icon: DollarSign, color: "text-status-validated" },
  improve_conversion: { icon: TrendingUp, color: "text-primary" },
  build_authority: { icon: Shield, color: "text-blue-500" },
  optimize_system: { icon: Zap, color: "text-amber-500" },
  reduce_risk: { icon: AlertTriangle, color: "text-destructive" },
};

export function AdminCommandTab() {
  const [actions, setActions] = useState<SuggestedAction[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  const analyze = useCallback(async () => {
    setLoading(true);
    const suggestedActions: SuggestedAction[] = [];
    const systemWarnings: Warning[] = [];

    // Gather system state
    const [jobsRes, unitsRes, artifactsRes, capRes] = await Promise.all([
      supabase.from("neuron_jobs").select("status").order("created_at", { ascending: false }).limit(200),
      supabase.from("service_units").select("id, status, neurons_cost"),
      supabase.from("artifacts").select("id, status").limit(100),
      supabase.from("capacity_state").select("*").limit(1),
    ]);

    const jobs = (jobsRes.data as any[]) || [];
    const units = (unitsRes.data as any[]) || [];
    const artifacts = (artifactsRes.data as any[]) || [];
    const cap = ((capRes.data as any[]) || [])[0];

    const failedJobs = jobs.filter(j => j.status === "failed").length;
    const failRate = jobs.length > 0 ? failedJobs / jobs.length : 0;
    const activeUnits = units.filter(u => u.status === "active").length;
    const draftUnits = units.filter(u => u.status === "draft").length;

    // Generate suggestions based on system state
    if (draftUnits > 0) {
      suggestedActions.push({
        title: `Activate ${draftUnits} draft service units`,
        type: "generate_revenue",
        priority: 85,
        impact: `${draftUnits} new services available for monetization`,
        effort: "low",
        reason: "Draft units represent unrealized revenue potential",
      });
    }

    if (failRate > 0.1) {
      suggestedActions.push({
        title: "Investigate high job failure rate",
        type: "reduce_risk",
        priority: 95,
        impact: `${(failRate * 100).toFixed(0)}% failure rate affecting user experience`,
        effort: "medium",
        reason: `${failedJobs} failed jobs in recent batch`,
      });
      systemWarnings.push({
        message: `Job failure rate at ${(failRate * 100).toFixed(0)}% — exceeds 10% threshold`,
        severity: "critical",
      });
    }

    if (cap?.utilization > 70) {
      suggestedActions.push({
        title: "Scale capacity before saturation",
        type: "optimize_system",
        priority: 80,
        impact: `Current utilization at ${cap.utilization}%`,
        effort: "medium",
        reason: "System approaching capacity limits",
      });
      systemWarnings.push({
        message: `System utilization at ${cap.utilization}% — consider scaling`,
        severity: "warn",
      });
    }

    if (artifacts.length < 50) {
      suggestedActions.push({
        title: "Drive artifact generation campaigns",
        type: "improve_conversion",
        priority: 70,
        impact: "Increase library value and user retention",
        effort: "medium",
        reason: "Low artifact count indicates underutilization",
      });
    }

    suggestedActions.push({
      title: "Launch i18n RU translations",
      type: "build_authority",
      priority: 60,
      impact: "Access Russian-speaking market segment",
      effort: "high",
      reason: "RU translations required by SSOT (Phase 9)",
    });

    suggestedActions.push({
      title: "Implement AIAS Level 1 certification",
      type: "build_authority",
      priority: 55,
      impact: "Establish standard credibility for agent marketplace",
      effort: "high",
      reason: "AIAS infiltration planned in Phase 10",
    });

    // Sort by priority
    suggestedActions.sort((a, b) => b.priority - a.priority);

    setActions(suggestedActions);
    setWarnings(systemWarnings);
    setLoading(false);
  }, []);

  useEffect(() => { analyze(); }, [analyze]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Compass className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Command Panel</h2>
            <p className="text-[10px] text-muted-foreground">Strategic suggestions ranked by priority × impact</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={analyze} className="gap-1 text-xs h-8">
          <RefreshCw className="h-3 w-3" /> Re-analyze
        </Button>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className={cn(
              "rounded-lg border px-4 py-3 flex items-center gap-3",
              w.severity === "critical" ? "border-destructive/30 bg-destructive/5" :
              w.severity === "warn" ? "border-primary/30 bg-primary/5" :
              "border-border bg-card"
            )}>
              <AlertTriangle className={cn(
                "h-4 w-4 shrink-0",
                w.severity === "critical" ? "text-destructive" : "text-primary"
              )} />
              <span className="text-xs">{w.message}</span>
              <Badge variant={w.severity === "critical" ? "destructive" : "secondary"} className="text-[9px] ml-auto shrink-0">
                {w.severity}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Actions */}
      <div className="space-y-2">
        {actions.map((action, i) => {
          const config = TYPE_CONFIG[action.type] || TYPE_CONFIG.optimize_system;
          const Icon = config.icon;

          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", `bg-card border border-border`)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{action.title}</span>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      P{action.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] shrink-0">
                      {action.effort} effort
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{action.reason}</p>
                  <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                    <Target className="h-3 w-3" /> {action.impact}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
