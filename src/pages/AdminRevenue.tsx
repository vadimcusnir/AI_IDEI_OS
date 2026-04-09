/**
 * AdminRevenue — Real Stripe revenue dashboard.
 * Fetches live data from admin-revenue edge function.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { GenericPageSkeleton } from "@/components/skeletons/GenericPageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, Users, CreditCard, RefreshCw, Loader2,
  BarChart3, Coins, ArrowUpRight, ArrowDownRight, Wallet, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface StripeRevenue {
  mrr: number;
  activeSubscriptions: number;
  totalCustomers: number;
  revenue30d: number;
  revenue7d: number;
  availableBalance: number;
  pendingBalance: number;
  dailyRevenue: { date: string; amount: number }[];
  tierBreakdown: Record<string, number>;
  charges30dCount: number;
  avgChargeAmount: number;
}

interface LocalMetrics {
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  totalUsers: number;
  recentTransactions: any[];
}

export default function AdminRevenue() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stripe, setStripe] = useState<StripeRevenue | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [local, setLocal] = useState<LocalMetrics>({ totalCreditsEarned: 0, totalCreditsSpent: 0, totalUsers: 0, recentTransactions: [] });

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Parallel: Stripe data + local DB data
      const [stripeRes, creditsRes, txRes, profilesRes] = await Promise.all([
        supabase.functions.invoke("admin-revenue"),
        supabase.from("user_credits").select("user_id, balance, total_earned, total_spent"),
        supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      if (stripeRes.error || stripeRes.data?.error) {
        setStripeError(stripeRes.data?.error || stripeRes.error?.message || "Failed to load Stripe data");
      } else {
        setStripe(stripeRes.data as StripeRevenue);
        setStripeError(null);
      }

      const credits = creditsRes.data ?? [];
      setLocal({
        totalCreditsEarned: credits.reduce((s, c) => s + (Number(c.total_earned) || 0), 0),
        totalCreditsSpent: credits.reduce((s, c) => s + (Number(c.total_spent) || 0), 0),
        totalUsers: profilesRes.count || 0,
        recentTransactions: txRes.data ?? [],
      });
    } catch (e) {
      console.error("Revenue load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <GenericPageSkeleton />;

  const kpiCards = [
    {
      label: "MRR", value: stripe ? `$${stripe.mrr.toFixed(2)}` : "—",
      icon: DollarSign, color: "text-emerald-500",
      sub: stripe ? `${stripe.activeSubscriptions} active subs` : undefined,
    },
    {
      label: "Revenue (30d)", value: stripe ? `$${stripe.revenue30d.toFixed(2)}` : "—",
      icon: TrendingUp, color: "text-primary",
      sub: stripe ? `${stripe.charges30dCount} charges` : undefined,
    },
    {
      label: "Revenue (7d)", value: stripe ? `$${stripe.revenue7d.toFixed(2)}` : "—",
      icon: Activity, color: "text-blue-500",
      sub: stripe ? `avg $${stripe.avgChargeAmount.toFixed(2)}` : undefined,
    },
    {
      label: "Stripe Balance", value: stripe ? `$${stripe.availableBalance.toFixed(2)}` : "—",
      icon: Wallet, color: "text-amber-500",
      sub: stripe ? `$${stripe.pendingBalance.toFixed(2)} pending` : undefined,
    },
    {
      label: "Customers", value: stripe?.totalCustomers?.toLocaleString() ?? "—",
      icon: Users, color: "text-indigo-500",
      sub: `${local.totalUsers} platform users`,
    },
    {
      label: "Credits Earned", value: local.totalCreditsEarned.toLocaleString(),
      icon: Coins, color: "text-primary",
      sub: `${local.totalCreditsSpent.toLocaleString()} spent`,
    },
  ];

  return (
    <PageTransition>
      <SEOHead title="Revenue Dashboard — Admin" description="Real-time revenue metrics from Stripe" />

      <div className="space-y-4 p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Revenue Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Live Stripe + platform data</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => loadData(true)} disabled={refreshing}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {stripeError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            Stripe data unavailable: {stripeError}
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiCards.map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={cn("h-3.5 w-3.5", color)} />
                <span className="text-micro text-muted-foreground">{label}</span>
              </div>
              <p className="text-lg font-bold font-mono">{value}</p>
              {sub && <p className="text-nano text-muted-foreground mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        {stripe?.dailyRevenue && stripe.dailyRevenue.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Daily Revenue (30 days)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stripe.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Recent Credit Transactions</h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {local.recentTransactions.slice(0, 20).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {Number(tx.amount) > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-status-validated shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-destructive shrink-0" />
                  )}
                  <span className="truncate text-muted-foreground">{tx.description || tx.type}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-nano">
                    {tx.type}
                  </Badge>
                  <span className={cn("font-mono font-bold", Number(tx.amount) > 0 ? "text-emerald-500" : "text-destructive")}>
                    {Number(tx.amount) > 0 ? "+" : ""}{tx.amount}N
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
