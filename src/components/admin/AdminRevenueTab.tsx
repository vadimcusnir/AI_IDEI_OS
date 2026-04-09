/**
 * AdminRevenueTab — Real revenue dashboard with MRR, ARPU, revenue by service level, cost tracking.
 * Phase 8.3
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RefreshCw, Loader2, DollarSign, TrendingUp, Users, Zap,
  ArrowUpRight, ArrowDownRight, Layers, BarChart3,
} from "lucide-react";

interface RevenueStats {
  totalRevenue: number;
  revenue30d: number;
  revenue7d: number;
  revenue24h: number;
  totalTransactions: number;
  uniquePayers: number;
  avgTransactionSize: number;
  refundTotal: number;
  revenueByType: Record<string, number>;
  revenueByService: { service_key: string; total: number; count: number }[];
  dailyRevenue: { day: string; amount: number }[];
}

export function AdminRevenueTab() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d1 = new Date(now.getTime() - 86400000).toISOString();

    const [allTxn, txn30, txn7, txn1] = await Promise.all([
      supabase.from("credit_transactions").select("amount, type, service_key, user_id, created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("credit_transactions").select("amount, type").gte("created_at", d30).lt("amount", 0),
      supabase.from("credit_transactions").select("amount").gte("created_at", d7).lt("amount", 0),
      supabase.from("credit_transactions").select("amount").gte("created_at", d1).lt("amount", 0),
    ]);

    const all = (allTxn.data || []) as any[];
    const spends = all.filter(t => t.amount < 0);
    const refunds = all.filter(t => t.type === "refund");
    const uniqueUsers = new Set(spends.map(t => t.user_id));

    // Revenue by type
    const byType: Record<string, number> = {};
    spends.forEach(t => {
      const key = t.type || "execution";
      byType[key] = (byType[key] || 0) + Math.abs(t.amount);
    });

    // Revenue by service
    const byServiceMap: Record<string, { total: number; count: number }> = {};
    spends.forEach(t => {
      const key = t.service_key || "unattributed";
      if (!byServiceMap[key]) byServiceMap[key] = { total: 0, count: 0 };
      byServiceMap[key].total += Math.abs(t.amount);
      byServiceMap[key].count++;
    });
    const byService = Object.entries(byServiceMap)
      .map(([service_key, v]) => ({ service_key, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Daily revenue (last 30 days)
    const dailyMap: Record<string, number> = {};
    const txn30Data = (txn30.data || []) as any[];
    txn30Data.forEach(t => {
      const day = t.created_at?.substring(0, 10) || "unknown";
      dailyMap[day] = (dailyMap[day] || 0) + Math.abs(t.amount);
    });
    const dailyRevenue = Object.entries(dailyMap)
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => a.day.localeCompare(b.day));

    setStats({
      totalRevenue: spends.reduce((s, t) => s + Math.abs(t.amount), 0),
      revenue30d: txn30Data.reduce((s: number, t: any) => s + Math.abs(t.amount), 0),
      revenue7d: (txn7.data || []).reduce((s: number, t: any) => s + Math.abs(t.amount), 0),
      revenue24h: (txn1.data || []).reduce((s: number, t: any) => s + Math.abs(t.amount), 0),
      totalTransactions: spends.length,
      uniquePayers: uniqueUsers.size,
      avgTransactionSize: spends.length > 0 ? Math.round(spends.reduce((s, t) => s + Math.abs(t.amount), 0) / spends.length) : 0,
      refundTotal: refunds.reduce((s, t) => s + Math.abs(t.amount), 0),
      revenueByType: byType,
      revenueByService: byService,
      dailyRevenue,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!stats) return null;

  const neuronToUsd = (n: number) => (n * 0.01).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-status-validated/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-status-validated" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Revenue Dashboard</h2>
            <p className="text-micro text-muted-foreground">Real metrics from credit transactions</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1 text-xs h-8">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard icon={DollarSign} label="Total Revenue" value={`${stats.totalRevenue.toLocaleString()}N`} sub={`≈ $${neuronToUsd(stats.totalRevenue)}`} accent="text-status-validated" />
        <KPICard icon={TrendingUp} label="Last 30 Days" value={`${stats.revenue30d.toLocaleString()}N`} sub={`≈ $${neuronToUsd(stats.revenue30d)}`} accent="text-primary" />
        <KPICard icon={Users} label="Unique Payers" value={stats.uniquePayers.toString()} sub={`ARPU: ${stats.uniquePayers > 0 ? Math.round(stats.totalRevenue / stats.uniquePayers) : 0}N`} />
        <KPICard icon={Zap} label="Avg Transaction" value={`${stats.avgTransactionSize}N`} sub={`${stats.totalTransactions} total txns`} />
      </div>

      {/* Period comparison */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-micro text-muted-foreground mb-1">24h Revenue</p>
          <p className="text-lg font-bold font-mono">{stats.revenue24h.toLocaleString()}N</p>
          <p className="text-micro text-muted-foreground">≈ ${neuronToUsd(stats.revenue24h)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-micro text-muted-foreground mb-1">7d Revenue</p>
          <p className="text-lg font-bold font-mono">{stats.revenue7d.toLocaleString()}N</p>
          <p className="text-micro text-muted-foreground">≈ ${neuronToUsd(stats.revenue7d)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-micro text-muted-foreground mb-1">Refunds</p>
          <p className="text-lg font-bold font-mono text-destructive">{stats.refundTotal.toLocaleString()}N</p>
          <p className="text-micro text-muted-foreground">≈ ${neuronToUsd(stats.refundTotal)}</p>
        </div>
      </div>

      {/* Revenue by Service */}
      {stats.revenueByService.length > 0 && (
        <div>
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue by Service</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="space-y-0.5">
              {stats.revenueByService.map((s, i) => {
                const pct = stats.totalRevenue > 0 ? (s.total / stats.totalRevenue) * 100 : 0;
                return (
                  <div key={s.service_key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <span className="text-micro font-mono text-muted-foreground w-5">{i + 1}</span>
                    <span className="text-xs font-medium flex-1 truncate">{s.service_key.replace(/-/g, " ")}</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-xs font-mono font-medium w-20 text-right">{s.total.toLocaleString()}N</span>
                    <Badge variant="outline" className="text-nano shrink-0">{s.count} txns</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Daily Revenue Sparkline */}
      {stats.dailyRevenue.length > 0 && (
        <div>
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">Daily Revenue (30d)</h3>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-end gap-1 h-20">
              {stats.dailyRevenue.map((d, i) => {
                const max = Math.max(...stats.dailyRevenue.map(x => x.amount));
                const h = max > 0 ? (d.amount / max) * 100 : 0;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end" title={`${d.day}: ${d.amount}N`}>
                    <div className="w-full bg-primary/60 rounded-t-sm min-h-[2px]" style={{ height: `${Math.max(h, 3)}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-nano text-muted-foreground">{stats.dailyRevenue[0]?.day}</span>
              <span className="text-nano text-muted-foreground">{stats.dailyRevenue[stats.dailyRevenue.length - 1]?.day}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn("h-3.5 w-3.5", accent || "text-muted-foreground")} />
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold font-mono", accent)}>{value}</p>
      {sub && <p className="text-micro text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
