import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ServiceRecon {
  service_key: string;
  name: string;
  credits_cost: number;
  total_runs: number;
  completed_runs: number;
  total_revenue_credits: number;
  estimated_usd: string;
}

export function ReconciliationTab() {
  const { t } = useTranslation("common");
  const [data, setData] = useState<ServiceRecon[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ totalRuns: 0, totalRevenue: 0, totalUsd: "0.00" });

  const load = async () => {
    setLoading(true);
    const [servicesRes, jobsRes] = await Promise.all([
      supabase.from("service_catalog").select("service_key, name, credits_cost").eq("is_active", true),
      supabase.from("neuron_jobs").select("worker_type, status"),
    ]);

    const services = servicesRes.data || [];
    const jobs = jobsRes.data || [];

    const jobCounts: Record<string, { total: number; completed: number }> = {};
    jobs.forEach((j: any) => {
      if (!jobCounts[j.worker_type]) jobCounts[j.worker_type] = { total: 0, completed: 0 };
      jobCounts[j.worker_type].total++;
      if (j.status === "completed") jobCounts[j.worker_type].completed++;
    });

    const rows: ServiceRecon[] = services.map((s: any) => {
      const counts = jobCounts[s.service_key] || { total: 0, completed: 0 };
      const revenue = counts.completed * s.credits_cost;
      return {
        service_key: s.service_key,
        name: s.name,
        credits_cost: s.credits_cost,
        total_runs: counts.total,
        completed_runs: counts.completed,
        total_revenue_credits: revenue,
        estimated_usd: (revenue * 0.01).toFixed(2),
      };
    }).sort((a: ServiceRecon, b: ServiceRecon) => b.total_revenue_credits - a.total_revenue_credits);

    setData(rows);
    const totalRev = rows.reduce((s: number, r: ServiceRecon) => s + r.total_revenue_credits, 0);
    setTotals({
      totalRuns: rows.reduce((s: number, r: ServiceRecon) => s + r.total_runs, 0),
      totalRevenue: totalRev,
      totalUsd: (totalRev * 0.01).toFixed(2),
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.total_runs")}</span>
          <p className="text-xl font-bold font-mono">{totals.totalRuns}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.revenue_credits")}</span>
          <p className="text-xl font-bold font-mono text-primary">{totals.totalRevenue}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.revenue_usd")}</span>
          <p className="text-xl font-bold font-mono text-primary">${totals.totalUsd}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" /> {t("admin.service_reconciliation")}
          </h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> {t("admin.refresh")}
          </Button>
        </div>
        <div className="overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">{t("admin.service")}</TableHead>
                <TableHead className="text-micro text-right">{t("admin.cost_per_run")}</TableHead>
                <TableHead className="text-micro text-right">{t("admin.total_runs")}</TableHead>
                <TableHead className="text-micro text-right">{t("admin.completed")}</TableHead>
                <TableHead className="text-micro text-right">{t("admin.revenue_credits")}</TableHead>
                <TableHead className="text-micro text-right">{t("admin.revenue_usd")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(r => (
                <TableRow key={r.service_key}>
                  <TableCell>
                    <p className="text-xs font-medium">{r.name}</p>
                    <p className="text-nano font-mono text-muted-foreground">{r.service_key}</p>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">{r.credits_cost}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{r.total_runs}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{r.completed_runs}</TableCell>
                  <TableCell className="text-xs font-mono text-right font-bold text-primary">{r.total_revenue_credits}</TableCell>
                  <TableCell className="text-xs font-mono text-right">${r.estimated_usd}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
