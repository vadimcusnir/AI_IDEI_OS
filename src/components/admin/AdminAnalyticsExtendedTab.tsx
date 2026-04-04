/**
 * AdminAnalyticsExtendedTab — Revenue per OTOS/MMS/LCSS, neurons burn, intent funnel, pricing violations.
 * Phase 7 / T7.5
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, Loader2, BarChart3, TrendingUp, Zap,
  DollarSign, ArrowRight, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

export function AdminAnalyticsExtendedTab() {
  const [loading, setLoading] = useState(true);
  const [neuronsBurned, setNeuronsBurned] = useState(0);
  const [revenueByLevel, setRevenueByLevel] = useState<{ level: string; neurons: number; count: number }[]>([]);
  const [topRoles, setTopRoles] = useState<{ role: string; count: number }[]>([]);
  const [topMechanisms, setTopMechanisms] = useState<{ mechanism: string; count: number }[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);

  const load = useCallback(async () => {
    setLoading(true);

    const [unitsRes, jobsRes, artifactsRes, intentsRes] = await Promise.all([
      supabase.from("service_units").select("level, role, mechanism, neurons_cost, status"),
      supabase.from("neuron_jobs").select("status, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("artifacts").select("id, status").limit(500),
      supabase.from("intent_map").select("intent_key, is_active"),
    ]);

    const units = (unitsRes.data as any[]) || [];
    const jobs = (jobsRes.data as any[]) || [];
    const artifacts = (artifactsRes.data as any[]) || [];
    const intents = (intentsRes.data as any[]) || [];

    // Revenue by level
    const levelMap: Record<string, { neurons: number; count: number }> = {};
    for (const u of units) {
      const lv = u.level || "otos";
      if (!levelMap[lv]) levelMap[lv] = { neurons: 0, count: 0 };
      levelMap[lv].neurons += u.neurons_cost || 0;
      levelMap[lv].count++;
    }
    setRevenueByLevel(Object.entries(levelMap).map(([level, v]) => ({ level, ...v })));

    // Total neurons burned
    setNeuronsBurned(units.reduce((s: number, u: any) => s + (u.neurons_cost || 0), 0));

    // Top roles
    const roleMap: Record<string, number> = {};
    for (const u of units) { roleMap[u.role] = (roleMap[u.role] || 0) + 1; }
    setTopRoles(
      Object.entries(roleMap).sort(([, a], [, b]) => b - a).slice(0, 8).map(([role, count]) => ({ role, count }))
    );

    // Top mechanisms
    const mechMap: Record<string, number> = {};
    for (const u of units) { mechMap[u.mechanism] = (mechMap[u.mechanism] || 0) + 1; }
    setTopMechanisms(
      Object.entries(mechMap).sort(([, a], [, b]) => b - a).slice(0, 8).map(([mechanism, count]) => ({ mechanism, count }))
    );

    // Intent → Run → Completed → Artifact → Export funnel
    const completed = jobs.filter(j => j.status === "completed").length;
    const savedArtifacts = artifacts.filter(a => a.status === "final" || a.status === "published").length;
    setFunnel([
      { label: "Intents Active", count: intents.filter((i: any) => i.is_active).length, color: "bg-primary" },
      { label: "Jobs Started", count: jobs.length, color: "bg-primary/80" },
      { label: "Jobs Completed", count: completed, color: "bg-status-validated" },
      { label: "Artifacts Saved", count: savedArtifacts, color: "bg-blue-500" },
    ]);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Extended Analytics</h2>
            <p className="text-micro text-muted-foreground">Revenue, neurons burn, intent funnels & distribution</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1 text-xs h-8">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1"><Zap className="h-3.5 w-3.5 text-amber-500" /><span className="text-micro font-semibold uppercase text-muted-foreground">Total NEURONS Pool</span></div>
          <span className="text-xl font-bold font-mono">{neuronsBurned.toLocaleString()}</span>
        </div>
        {revenueByLevel.map(r => (
          <div key={r.level} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-1"><DollarSign className="h-3.5 w-3.5 text-status-validated" /><span className="text-micro font-semibold uppercase text-muted-foreground">{r.level.toUpperCase()}</span></div>
            <span className="text-xl font-bold font-mono">{r.count}</span>
            <span className="text-micro text-muted-foreground ml-1">units • {r.neurons.toLocaleString()}N</span>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" /> Intent → Artifact Funnel
        </h3>
        <div className="flex items-center gap-2">
          {funnel.map((step, i) => {
            const maxCount = Math.max(...funnel.map(f => f.count), 1);
            return (
              <div key={step.label} className="flex-1 flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-micro text-muted-foreground">{step.label}</span>
                    <span className="text-xs font-mono font-bold">{step.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", step.color)} style={{ width: `${(step.count / maxCount) * 100}%` }} />
                  </div>
                </div>
                {i < funnel.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Roles */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Roles</h3>
          <div className="space-y-2">
            {topRoles.map(r => {
              const maxC = topRoles[0]?.count || 1;
              return (
                <div key={r.role} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-medium truncate">{r.role}</span>
                    <span className="text-micro font-mono text-muted-foreground">{r.count}</span>
                  </div>
                  <Progress value={(r.count / maxC) * 100} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Mechanisms */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Mechanisms</h3>
          <div className="space-y-2">
            {topMechanisms.map(m => {
              const maxC = topMechanisms[0]?.count || 1;
              return (
                <div key={m.mechanism} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-medium truncate">{m.mechanism}</span>
                    <span className="text-micro font-mono text-muted-foreground">{m.count}</span>
                  </div>
                  <Progress value={(m.count / maxC) * 100} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
