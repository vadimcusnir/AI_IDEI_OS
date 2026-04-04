import { useFinOps, CostEntry } from "@/hooks/useFinOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, DollarSign, TrendingUp, BarChart3, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

export function FinOpsTab() {
  const { stats, costs, loading, reload } = useFinOps();

  // Aggregate costs by provider
  const costByProvider = useMemo(() => {
    const map: Record<string, { measured: number; estimated: number; total: number }> = {};
    costs.forEach(c => {
      const key = c.provider_key || "platform";
      if (!map[key]) map[key] = { measured: 0, estimated: 0, total: 0 };
      map[key].total += c.amount_usd;
      if (c.cost_category === "measured") map[key].measured += c.amount_usd;
      else map[key].estimated += c.amount_usd;
    });
    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [costs]);

  // Aggregate costs by service
  const costByService = useMemo(() => {
    const map: Record<string, { usd: number; credits: number; count: number }> = {};
    costs.forEach(c => {
      const key = c.service_key || "unattributed";
      if (!map[key]) map[key] = { usd: 0, credits: 0, count: 0 };
      map[key].usd += c.amount_usd;
      map[key].credits += c.amount_credits;
      map[key].count++;
    });
    return Object.entries(map).sort(([, a], [, b]) => b.usd - a.usd);
  }, [costs]);

  // Unit economics derived from stats
  const unitEcon = useMemo(() => {
    if (!stats) return null;
    const totalCost = costs.reduce((s, c) => s + c.amount_usd, 0);
    const costPerUser = stats.total_users > 0 ? totalCost / stats.total_users : 0;
    const costPerJob = stats.jobs_completed_24h > 0 ? (stats.total_credits_spent_24h * 0.01) / stats.jobs_completed_24h : 0;
    const refundRate = stats.total_credits_spent_24h > 0
      ? (stats.total_credits_refunded_24h / stats.total_credits_spent_24h) * 100 : 0;
    return { totalCost, costPerUser, costPerJob, refundRate };
  }, [stats, costs]);

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon={DollarSign} label="Total Recorded Cost" value={`$${(unitEcon?.totalCost ?? 0).toFixed(2)}`} accent="text-primary" />
        <KPI icon={TrendingUp} label="Cost/User" value={`$${(unitEcon?.costPerUser ?? 0).toFixed(3)}`} />
        <KPI icon={BarChart3} label="Cost/Job (24h)" value={`$${(unitEcon?.costPerJob ?? 0).toFixed(4)}`} />
        <KPI icon={Layers} label="Refund Rate" value={`${(unitEcon?.refundRate ?? 0).toFixed(1)}%`} accent={unitEcon && unitEcon.refundRate > 10 ? "text-destructive" : undefined} />
      </div>

      {/* Cost by Provider */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" /> Cost by Provider
          </h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reload} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
        {costByProvider.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No cost data recorded yet. Costs populate from provider usage tracking.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Provider</TableHead>
                <TableHead className="text-[10px] text-right">Measured</TableHead>
                <TableHead className="text-[10px] text-right">Estimated</TableHead>
                <TableHead className="text-[10px] text-right">Total USD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costByProvider.map(([key, val]) => (
                <TableRow key={key}>
                  <TableCell className="text-xs font-mono">{key}</TableCell>
                  <TableCell className="text-xs font-mono text-right">${val.measured.toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">${val.estimated.toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-mono text-right font-bold text-primary">${val.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Cost by Service */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
          <BarChart3 className="h-3 w-3" /> Cost by Service
        </h3>
        {costByService.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No service cost data yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Service</TableHead>
                <TableHead className="text-[10px] text-right">Entries</TableHead>
                <TableHead className="text-[10px] text-right">Credits</TableHead>
                <TableHead className="text-[10px] text-right">USD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costByService.slice(0, 15).map(([key, val]) => (
                <TableRow key={key}>
                  <TableCell className="text-xs font-mono">{key}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{val.count}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{val.credits.toFixed(0)}</TableCell>
                  <TableCell className="text-xs font-mono text-right font-bold">${val.usd.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Recent cost entries */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
          <Layers className="h-3 w-3" /> Recent Cost Entries
        </h3>
        {costs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No entries. Cost data will populate as provider usage is tracked.</p>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Type</TableHead>
                  <TableHead className="text-[10px]">Provider</TableHead>
                  <TableHead className="text-[10px]">Category</TableHead>
                  <TableHead className="text-[10px] text-right">USD</TableHead>
                  <TableHead className="text-[10px]">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.slice(0, 25).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-mono">{c.cost_type}</TableCell>
                    <TableCell className="text-xs font-mono">{c.provider_key || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px]">{c.cost_category}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right">${c.amount_usd.toFixed(4)}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: string }) {
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
