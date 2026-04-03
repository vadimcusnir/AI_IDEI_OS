/**
 * CC-V05: Command Center KPI Dashboard
 * Shows key metrics for Command Center usage and effectiveness.
 * Displayed in the ContextDrawer's "Stats" or "Progress" tab.
 */
import { useEffect, useState, useCallback } from "react";
import { Activity, CheckCircle2, Save, ArrowUpRight, Clock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface KPIData {
  totalSubmissions: number;
  completionRate: number;
  outputSaveRate: number;
  avgLatencySeconds: number;
  sessionReturnRate: number;
  mobileCompletionRate: number;
}

const EMPTY_KPIS: KPIData = {
  totalSubmissions: 0,
  completionRate: 0,
  outputSaveRate: 0,
  avgLatencySeconds: 0,
  sessionReturnRate: 0,
  mobileCompletionRate: 0,
};

export function CommandCenterKPIs({ className }: { className?: string }) {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPIData>(EMPTY_KPIS);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch CC telemetry events
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_name, event_params, created_at")
        .eq("user_id", user.id)
        .like("event_name", "cc_%")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!events || events.length === 0) {
        setLoading(false);
        return;
      }

      const submissions = events.filter((e: any) => e.event_name === "cc_command_submitted").length;
      const completions = events.filter((e: any) => e.event_name === "cc_execution_completed").length;
      const failures = events.filter((e: any) => e.event_name === "cc_execution_failed").length;
      const outputSaves = events.filter((e: any) =>
        e.event_name === "cc_output_saved" || e.event_name === "cc_output_save_all"
      ).length;
      const outputOpens = events.filter((e: any) => e.event_name === "cc_output_panel_opened").length;
      const sessionReturns = events.filter((e: any) => e.event_name === "cc_session_return").length;
      const sessionStarts = events.filter((e: any) => e.event_name === "cc_session_started").length;

      // Avg latency from completed executions
      const completionEvents = events.filter((e: any) => e.event_name === "cc_execution_completed");
      const totalLatency = completionEvents.reduce((sum: number, e: any) => {
        const params = e.event_params as any;
        return sum + (params?.duration_ms || 0);
      }, 0);
      const avgLatencyMs = completionEvents.length > 0 ? totalLatency / completionEvents.length : 0;

      // Mobile completion rate
      const mobileCompletions = completionEvents.filter((e: any) =>
        (e.event_params as any)?.viewport === "mobile"
      ).length;
      const mobileSubmissions = events.filter((e: any) =>
        e.event_name === "cc_command_submitted" && (e.event_params as any)?.viewport === "mobile"
      ).length;

      setKpis({
        totalSubmissions: submissions,
        completionRate: submissions > 0 ? Math.round((completions / (completions + failures || 1)) * 100) : 0,
        outputSaveRate: outputOpens > 0 ? Math.round((outputSaves / outputOpens) * 100) : 0,
        avgLatencySeconds: Math.round(avgLatencyMs / 1000),
        sessionReturnRate: sessionStarts > 0 ? Math.round((sessionReturns / sessionStarts) * 100) : 0,
        mobileCompletionRate: mobileSubmissions > 0 ? Math.round((mobileCompletions / mobileSubmissions) * 100) : 0,
      });
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  if (loading) {
    return (
      <div className={cn("space-y-3 p-3", className)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "Submissions",
      value: kpis.totalSubmissions,
      icon: Activity,
      color: "text-blue-400",
    },
    {
      label: "Success Rate",
      value: `${kpis.completionRate}%`,
      icon: CheckCircle2,
      color: kpis.completionRate >= 80 ? "text-emerald-400" : kpis.completionRate >= 50 ? "text-amber-400" : "text-destructive",
    },
    {
      label: "Output Save Rate",
      value: `${kpis.outputSaveRate}%`,
      icon: Save,
      color: "text-purple-400",
    },
    {
      label: "Avg Latency",
      value: kpis.avgLatencySeconds > 0 ? `${kpis.avgLatencySeconds}s` : "—",
      icon: Clock,
      color: "text-amber-400",
    },
    {
      label: "Session Returns",
      value: `${kpis.sessionReturnRate}%`,
      icon: ArrowUpRight,
      color: "text-cyan-400",
    },
    {
      label: "Mobile Success",
      value: `${kpis.mobileCompletionRate}%`,
      icon: Zap,
      color: "text-pink-400",
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Command Center KPIs
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-border/30"
          >
            <m.icon className={cn("h-3.5 w-3.5 shrink-0", m.color)} />
            <div className="min-w-0">
              <div className="text-sm font-mono font-semibold text-foreground truncate">
                {m.value}
              </div>
              <div className="text-[9px] text-muted-foreground truncate">{m.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
