import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Zap, AlertTriangle, TrendingUp, Server,
  Activity, DollarSign, BarChart3, Shield, Clock,
  RefreshCw, CheckCircle, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KernelMetrics {
  total_runs: number;
  completed: number;
  failed: number;
  total_neurons_consumed: number;
  avg_assets_per_run: number;
  success_rate: number;
  recent_jobs: any[];
  top_services: { key: string; count: number }[];
  revenue_estimate: number;
}

export default function AdminKernel() {
  const [metrics, setMetrics] = useState<KernelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);

    // Load master-agent jobs
    const { data: jobs } = await supabase
      .from("neuron_jobs")
      .select("id, status, input, result, created_at, completed_at")
      .eq("worker_type", "master_agent")
      .order("created_at", { ascending: false })
      .limit(100);

    const allJobs = jobs || [];
    const completed = allJobs.filter(j => j.status === "completed");
    const failed = allJobs.filter(j => j.status === "failed");

    // Aggregate metrics
    let totalNeurons = 0;
    let totalAssets = 0;
    let totalRevenue = 0;
    const serviceUsage: Record<string, number> = {};

    for (const job of completed) {
      const result = job.result as any;
      if (result) {
        totalNeurons += result.cost_charged || 0;
        totalAssets += result.assets_generated || 0;
        totalRevenue += (result.marketplace_items || 0) * 500; // avg price estimate

        const topSvcs = result.top_services as string[] || [];
        for (const svc of topSvcs) {
          serviceUsage[svc] = (serviceUsage[svc] || 0) + 1;
        }
      }
    }

    const topServices = Object.entries(serviceUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));

    setMetrics({
      total_runs: allJobs.length,
      completed: completed.length,
      failed: failed.length,
      total_neurons_consumed: totalNeurons,
      avg_assets_per_run: completed.length > 0 ? Math.round(totalAssets / completed.length) : 0,
      success_rate: allJobs.length > 0 ? Math.round((completed.length / allJobs.length) * 100) : 0,
      recent_jobs: allJobs.slice(0, 15),
      top_services: topServices,
      revenue_estimate: totalRevenue,
    });

    setLoading(false);
  };

  useEffect(() => { loadMetrics(); }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Runs", value: metrics.total_runs, icon: Brain, color: "text-primary" },
    { label: "Success Rate", value: `${metrics.success_rate}%`, icon: CheckCircle, color: "text-success" },
    { label: "Failed", value: metrics.failed, icon: XCircle, color: "text-destructive" },
    { label: "NEURONS Consumed", value: metrics.total_neurons_consumed.toLocaleString(), icon: Zap, color: "text-amber-500" },
    { label: "Avg Assets/Run", value: metrics.avg_assets_per_run, icon: TrendingUp, color: "text-info" },
    { label: "Revenue Est.", value: `${metrics.revenue_estimate.toLocaleString()}N`, icon: DollarSign, color: "text-emerald-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <SEOHead title="Kernel Control Panel" description="Master Agent kernel metrics and control" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Kernel Control Panel</h1>
            <p className="text-xs text-muted-foreground">Master Agent orchestration metrics</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadMetrics} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Services */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Top Services (Usage)
          </h3>
          {metrics.top_services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-2">
              {metrics.top_services.map((svc, i) => (
                <div key={svc.key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-micro font-mono text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-xs font-medium truncate text-foreground">{svc.key}</span>
                  </div>
                  <Badge variant="outline" className="text-nano font-mono shrink-0">{svc.count}x</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tier Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Tier Limits Active
          </h3>
          <div className="space-y-3">
            {["free", "core", "pro", "elite"].map(tier => {
              const tierJobs = metrics.recent_jobs.filter(j => (j.result as any)?.tier === tier);
              return (
                <div key={tier} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize text-foreground">{tier}</span>
                    <span className="text-micro text-muted-foreground">{tierJobs.length} runs</span>
                  </div>
                  <Progress value={metrics.total_runs > 0 ? (tierJobs.length / metrics.total_runs) * 100 : 0} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety & Health */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Health & Safety
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">Success Rate</span>
              <Badge variant={metrics.success_rate >= 80 ? "default" : "destructive"} className="text-nano">
                {metrics.success_rate}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">Failure Rate</span>
              <Badge variant={metrics.failed < metrics.total_runs * 0.2 ? "outline" : "destructive"} className="text-nano">
                {metrics.total_runs > 0 ? Math.round((metrics.failed / metrics.total_runs) * 100) : 0}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">Avg Cost/Run</span>
              <span className="text-xs font-mono text-muted-foreground">
                {metrics.completed > 0 ? Math.round(metrics.total_neurons_consumed / metrics.completed).toLocaleString() : 0}N
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">ROI per Run</span>
              <span className="text-xs font-mono text-primary">
                {metrics.completed > 0 && metrics.total_neurons_consumed > 0
                  ? `${((metrics.revenue_estimate / metrics.total_neurons_consumed) * 100).toFixed(0)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Executions */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Recent Executions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Tier</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Strategy</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Cost</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Assets</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Services</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recent_jobs.map(job => {
                const result = job.result as any;
                const input = job.input as any;
                return (
                  <tr key={job.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2">
                      <Badge variant={job.status === "completed" ? "default" : "destructive"} className="text-nano">
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 capitalize text-foreground">{result?.tier || "—"}</td>
                    <td className="py-2 px-2 text-muted-foreground">{result?.strategy || input?.plan?.strategy || "—"}</td>
                    <td className="py-2 px-2 text-right font-mono text-foreground">{result?.cost_charged?.toLocaleString() || "—"}N</td>
                    <td className="py-2 px-2 text-right font-mono text-foreground">{result?.assets_generated || "—"}</td>
                    <td className="py-2 px-2 text-right font-mono text-foreground">{result?.services_matched || "—"}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
