import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { GenericPageSkeleton } from "@/components/skeletons/GenericPageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, Users, CreditCard, ArrowUpRight,
  ArrowDownRight, RefreshCw, Loader2, BarChart3, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

interface RevenueMetrics {
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  totalUsers: number;
  activeSubscribers: number;
  estimatedMRR: number;
  avgRevenuePerUser: number;
}

interface DailyRevenue {
  date: string;
  topups: number;
  subscriptions: number;
  total: number;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export default function AdminRevenue() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalCreditsEarned: 0, totalCreditsSpent: 0, totalUsers: 0,
    activeSubscribers: 0, estimatedMRR: 0, avgRevenuePerUser: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recentTopups, setRecentTopups] = useState<any[]>([]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [creditsRes, txRes, profilesRes] = await Promise.all([
        supabase.from("user_credits").select("user_id, balance, total_earned, total_spent"),
        supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("id").limit(1000),
      ]);

      const credits = creditsRes.data ?? [];
      const txs = (txRes.data ?? []) as any[];
      const profiles = profilesRes.data ?? [];

      const totalEarned = credits.reduce((s, c) => s + (Number(c.total_earned) || 0), 0);
      const totalSpent = credits.reduce((s, c) => s + (Number(c.total_spent) || 0), 0);

      // Count topup transactions as revenue proxy
      const topups = txs.filter(t => t.type === "topup");
      const topupRevenue = topups.reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);

      setMetrics({
        totalCreditsEarned: totalEarned,
        totalCreditsSpent: totalSpent,
        totalUsers: profiles.length,
        activeSubscribers: credits.filter(c => Number(c.total_earned) > 500).length,
        estimatedMRR: Math.round(topupRevenue * 0.002 * 100) / 100,
        avgRevenuePerUser: profiles.length > 0 ? Math.round((totalSpent * 0.002) / profiles.length * 100) / 100 : 0,
      });

      setTransactions(txs);
      setRecentTopups(topups.slice(0, 10));
    } catch (err) {
      console.error("Revenue data load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Daily revenue chart data
  const dailyRevenue = useMemo<DailyRevenue[]>(() => {
    const days: Record<string, { topups: number; subscriptions: number }> = {};
    transactions.forEach(tx => {
      const date = tx.created_at?.slice(0, 10);
      if (!date) return;
      if (!days[date]) days[date] = { topups: 0, subscriptions: 0 };
      const amt = Math.abs(Number(tx.amount) || 0);
      if (tx.type === "topup") days[date].topups += amt;
      else if (tx.type === "spend") days[date].subscriptions += amt;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, v]) => ({
        date: date.slice(5),
        topups: Math.round(v.topups * 0.002 * 100) / 100,
        subscriptions: Math.round(v.subscriptions * 0.002 * 100) / 100,
        total: Math.round((v.topups + v.subscriptions) * 0.002 * 100) / 100,
      }));
  }, [transactions]);

  // Transaction type breakdown
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(tx => {
      counts[tx.type] = (counts[tx.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  if (loading) return <GenericPageSkeleton />;

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Revenue Dashboard — Admin" description="Revenue metrics and financial analytics." />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold tracking-tight">Revenue Dashboard</h1>
              <Badge variant="secondary" className="text-micro">Admin</Badge>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => loadData(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Refresh
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Est. MRR", value: `$${metrics.estimatedMRR}`, icon: DollarSign, color: "text-primary" },
              { label: "Total Users", value: metrics.totalUsers, icon: Users, color: "text-foreground" },
              { label: "Paying Users", value: metrics.activeSubscribers, icon: CreditCard, color: "text-primary" },
              { label: "Credits Earned", value: metrics.totalCreditsEarned.toLocaleString(), icon: TrendingUp, color: "text-status-validated" },
              { label: "Credits Spent", value: metrics.totalCreditsSpent.toLocaleString(), icon: ArrowDownRight, color: "text-destructive" },
              { label: "ARPU", value: `$${metrics.avgRevenuePerUser}`, icon: ArrowUpRight, color: "text-primary" },
            ].map((kpi, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
                  <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                </div>
                <span className="text-lg font-bold font-mono">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" /> Daily Revenue (Last 30 Days)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(v: number) => [`$${v}`, ""]}
                  />
                  <Area type="monotone" dataKey="topups" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" name="Top-ups" />
                  <Area type="monotone" dataKey="subscriptions" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" name="Usage" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Transaction Type Breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4">Transaction Breakdown</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {typeBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {typeBreakdown.map((t, i) => (
                  <span key={t.name} className="flex items-center gap-1 text-micro text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {t.name}: {t.value}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Top-ups */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-primary" /> Recent Top-ups
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentTopups.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No top-ups yet</p>
                ) : recentTopups.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background border border-border/50">
                    <div>
                      <p className="text-xs font-medium truncate max-w-[180px]">{tx.description}</p>
                      <p className="text-micro text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-status-validated">+{Math.abs(tx.amount)}</span>
                      <p className="text-nano text-muted-foreground">${(Math.abs(tx.amount) * 0.002).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4">Conversion Funnel</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Users", value: metrics.totalUsers, pct: 100 },
                { label: "Active (earned > 500N)", value: metrics.activeSubscribers, pct: metrics.totalUsers > 0 ? Math.round(metrics.activeSubscribers / metrics.totalUsers * 100) : 0 },
                { label: "Spent Credits", value: transactions.filter(t => t.type === "spend").length, pct: metrics.totalUsers > 0 ? Math.round(new Set(transactions.filter(t => t.type === "spend").map(t => t.user_id)).size / metrics.totalUsers * 100) : 0 },
                { label: "Topped Up", value: recentTopups.length, pct: metrics.totalUsers > 0 ? Math.round(new Set(transactions.filter(t => t.type === "topup").map(t => t.user_id)).size / metrics.totalUsers * 100) : 0 },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="h-2 rounded-full bg-muted mb-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${step.pct}%` }} />
                  </div>
                  <p className="text-lg font-bold font-mono">{typeof step.value === "number" ? step.value.toLocaleString() : step.value}</p>
                  <p className="text-micro text-muted-foreground">{step.label}</p>
                  <p className="text-nano text-primary font-medium">{step.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
