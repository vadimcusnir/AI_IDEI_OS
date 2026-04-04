import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { GenericPageSkeleton } from "@/components/skeletons/GenericPageSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Loader2, Coins, TrendingDown, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, Gift,
  BarChart3, Filter, Search, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { PageTransition } from "@/components/motion/PageTransition";
import { ControlledSection } from "@/components/ControlledSection";
import { WalletPanel } from "@/components/wallet/WalletPanel";
import { TopUpDialog } from "@/components/credits/TopUpDialog";
const ConsumptionChart = lazy(() => import("@/components/credits/ConsumptionChart").then(m => ({ default: m.ConsumptionChart })));
import { EconomicProjections } from "@/components/credits/EconomicProjections";
import { SubscriptionPlans } from "@/components/credits/SubscriptionPlans";
import { StorageUsagePanel } from "@/components/storage/StorageUsagePanel";
import { StorageBillingPanel } from "@/components/credits/StorageBillingPanel";
import { DailySpendingPanel } from "@/components/credits/DailySpendingPanel";
import { ConsumptionAnalytics } from "@/components/credits/ConsumptionAnalytics";
import { RuleEnginePanel } from "@/components/automation/RuleEnginePanel";
import { VIPProgressTimeline } from "@/components/vip/VIPProgressTimeline";
import { FlowTip } from "@/components/onboarding/FlowTip";

interface UserCredits {
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  job_id: string | null;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  spend: { icon: ArrowDownRight, color: "text-destructive", labelKey: "credits.spend" },
  reserve: { icon: Clock, color: "text-primary", labelKey: "credits.reserved" },
  release: { icon: ArrowUpRight, color: "text-status-validated", labelKey: "credits.released" },
  denied: { icon: TrendingDown, color: "text-muted-foreground", labelKey: "credits.denied" },
  topup: { icon: TrendingUp, color: "text-status-validated", labelKey: "credits.topup" },
  bonus: { icon: Gift, color: "text-ai-accent", labelKey: "credits.bonus" },
  adjustment: { icon: Coins, color: "text-primary", labelKey: "credits.adjustment" },
};

type TxFilter = "all" | "spend" | "topup" | "bonus" | "reserve" | "release";

export default function Credits() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [txSearch, setTxSearch] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle topup success/cancel from URL params
  useEffect(() => {
    if (authLoading || !user) return;

    const topup = searchParams.get("topup");
    const sessionId = searchParams.get("session_id");
    const neurons = searchParams.get("neurons");

    if (topup === "success" && sessionId) {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-topup`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({ session_id: sessionId }),
            }
          );
          if (resp.ok) {
            toast.success(t("common:topup_success", { neurons: neurons || "" }));
          } else {
            toast.error(t("common:topup_verify_failed"));
          }
        } catch {
          toast.error(t("common:topup_payment_error"));
        }
        setSearchParams({});
        loadData();
      })();
    } else if (topup === "cancelled") {
      toast.info(t("common:topup_cancelled"));
      setSearchParams({});
    }

    const subscription = searchParams.get("subscription");
    if (subscription === "success") {
      toast.success(t("common:subscription_activated"));
      setSearchParams({});
    } else if (subscription === "cancel") {
      toast.info(t("common:subscription_cancelled"));
      setSearchParams({});
    }
  }, [searchParams, user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    const [creditsRes, txRes] = await Promise.all([
      supabase.from("user_credits").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("credit_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100),
    ]);

    if (creditsRes.data) {
      setCredits(creditsRes.data as UserCredits);
    } else {
      await supabase.from("user_credits").insert({
        user_id: user!.id, balance: 500, total_earned: 500, total_spent: 0,
      } as any);
      setCredits({ balance: 500, total_earned: 500, total_spent: 0, updated_at: new Date().toISOString() });
    }

    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    setLoading(false);
  };

  // Filtered & searched transactions
  const filteredTx = useMemo(() => {
    let list = transactions;
    if (txFilter !== "all") list = list.filter(t => t.type === txFilter);
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q));
    }
    return list;
  }, [transactions, txFilter, txSearch]);

  // Service consumption stats
  const serviceStats = useMemo(() => {
    const spends = transactions.filter(t => t.type === "spend");
    const acc: Record<string, { count: number; total: number }> = {};
    spends.forEach(t => {
      const serviceName = t.description.replace(/^(SPEND|EXTRACTION|Service): ?/, "").split(" — ")[0];
      if (!acc[serviceName]) acc[serviceName] = { count: 0, total: 0 };
      acc[serviceName].count++;
      acc[serviceName].total += Math.abs(t.amount);
    });
    return acc;
  }, [transactions]);

  // Balance health
  const utilization = credits && credits.total_earned > 0
    ? Math.round((credits.total_spent / credits.total_earned) * 100)
    : 0;
  const balanceHealth = (credits?.balance ?? 0) > 200 ? "healthy" : (credits?.balance ?? 0) > 50 ? "warning" : "critical";

  if (authLoading || loading) {
    return <GenericPageSkeleton />;
  }

  return (
    <PageTransition>
    <div className="flex-1 overflow-y-auto">
      <SEOHead title="Credits — AI-IDEI" description="Manage your NEURONS credits balance, transaction history and top-ups." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">{t("credits.title")}</h1>
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
              balanceHealth === "healthy" ? "bg-status-validated/15 text-status-validated" :
              balanceHealth === "warning" ? "bg-primary/15 text-primary" :
              "bg-destructive/15 text-destructive"
            )}>
              {balanceHealth === "healthy" ? t("credits.healthy") : balanceHealth === "warning" ? t("credits.low") : t("credits.critical")}
            </span>
          </div>
          <TopUpDialog onSuccess={loadData} />
        </div>

        {/* Flow guidance */}
        <FlowTip
          tipId="credits-intro"
          variant="info"
          title="How NEURONS credits work"
          description="NEURONS are the compute currency that powers AI services. Each service consumes credits based on complexity. Top up anytime or earn bonus credits."
          className="mb-4"
        />
        <FlowTip
          tipId="credits-low-balance"
          variant="tip"
          title="Your balance is running low"
          description="Top up your NEURONS to keep running AI services without interruption."
          action={{ label: "View plans", route: "/credits?tab=plans" }}
          show={balanceHealth === "critical" || balanceHealth === "warning"}
          className="mb-4"
        />

        {/* Wallet State */}
        <div className="mb-6">
          <WalletPanel />
        </div>

        {/* Daily Spending Protection */}
        <div className="mb-6">
          <DailySpendingPanel />
        </div>

        {/* Consumption Analytics */}
        <div className="mb-6">
          <ConsumptionAnalytics transactions={transactions} />
        </div>

        {/* Subscription Plans */}
        <ControlledSection elementId="credits.subscription_plans">
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <SubscriptionPlans />
          </div>
        </ControlledSection>

        {/* Storage Usage + Billing */}
        <ControlledSection elementId="credits.storage_usage">
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <StorageUsagePanel />
          </div>
        </ControlledSection>

        <ControlledSection elementId="credits.storage_billing">
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <StorageBillingPanel />
          </div>
        </ControlledSection>

        {/* VIP Progress */}
        <ControlledSection elementId="credits.vip_progress">
          <div className="mb-6">
            <VIPProgressTimeline />
          </div>
        </ControlledSection>

        {/* Rule Engine */}
        <ControlledSection elementId="credits.rule_engine">
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <RuleEnginePanel />
          </div>
        </ControlledSection>

        {/* Balance + Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          {/* Main balance */}
          <div className="sm:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("credits.current_balance")}</p>
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                balanceHealth === "healthy" ? "bg-status-validated/10" :
                balanceHealth === "warning" ? "bg-primary/10" : "bg-destructive/10"
              )}>
                <Coins className={cn(
                  "h-5 w-5",
                  balanceHealth === "healthy" ? "text-status-validated" :
                  balanceHealth === "warning" ? "text-[hsl(var(--gold-oxide))]" : "text-destructive"
                )} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold font-mono">{credits?.balance ?? 0}</span>
              <span className="text-xs text-muted-foreground">NEURONS</span>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{t("credits.earned")}</p>
                <p className="text-xs font-bold font-mono text-status-validated">+{credits?.total_earned ?? 0}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{t("credits.spent")}</p>
                <p className="text-xs font-bold font-mono text-destructive">-{credits?.total_spent ?? 0}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{t("credits.utilization")}</p>
                <p className="text-xs font-bold font-mono">{utilization}%</p>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("credits.transactions")}</p>
            <span className="text-2xl font-bold font-mono">{transactions.length}</span>
            <p className="text-[10px] text-muted-foreground mt-1">
              {transactions.filter(t => {
                const d = new Date(t.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length} {t("credits.this_month")}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("credits.services_used")}</p>
            <span className="text-2xl font-bold font-mono">{Object.keys(serviceStats).length}</span>
            <p className="text-[10px] text-muted-foreground mt-1">
              {transactions.filter(t => t.type === "spend").length} {t("credits.executions")}
            </p>
          </div>
        </div>

        {/* Consumption chart */}
        <Suspense fallback={<div className="h-40 bg-card border border-border rounded-xl animate-pulse" />}>
          <ConsumptionChart transactions={transactions} />
        </Suspense>

        {/* Economic Projections */}
        <EconomicProjections
          transactions={transactions}
          currentBalance={credits?.balance ?? 0}
        />

        {/* Service consumption breakdown */}
        {Object.keys(serviceStats).length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" /> {t("credits.consumption_per_service")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(serviceStats)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([name, stats]) => (
                  <div key={name} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{stats.count} execution{stats.count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-destructive shrink-0 ml-2">-{stats.total}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 shrink-0">
              {t("credits.transaction_history")}
              <span className="text-muted-foreground/40 font-normal">{filteredTx.length}</span>
            </h2>
            <div className="flex-1" />

            {/* Search */}
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 flex-1 sm:max-w-[200px]">
              <Search className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <input
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                placeholder={t("common:search")}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
              />
              {txSearch && (
                <button onClick={() => setTxSearch("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-0.5 flex-wrap">
              {([
                { value: "all" as TxFilter, labelKey: "credits.filter_all" },
                { value: "spend" as TxFilter, labelKey: "credits.spend" },
                { value: "topup" as TxFilter, labelKey: "credits.topup" },
                { value: "bonus" as TxFilter, labelKey: "credits.bonus" },
              ] as const).map(f => (
                <button
                  key={f.value}
                  onClick={() => setTxFilter(f.value)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium transition-colors",
                    txFilter === f.value ? "bg-[hsl(var(--gold-oxide)/0.1)] text-[hsl(var(--gold-oxide))]" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-8 w-8 opacity-20 mx-auto mb-3" />
              {transactions.length === 0 ? (
                <>
                   <p className="text-sm text-muted-foreground mb-1">{t("credits.no_transactions")}</p>
                  <p className="text-[10px] text-muted-foreground/60">{t("credits.no_transactions_hint")}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">{t("credits.no_filter_results")}</p>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => { setTxFilter("all"); setTxSearch(""); }}>
                    Clear filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredTx.map(tx => {
                const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.spend;
                const TxIcon = cfg.icon;
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors group">
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                      tx.amount > 0 ? "bg-status-validated/10" : tx.amount < 0 ? "bg-destructive/10" : "bg-muted"
                    )}>
                      <TxIcon className={cn("h-3.5 w-3.5", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()} · <span className="uppercase">{t(cfg.labelKey)}</span>
                      </p>
                    </div>
                    <span className={cn(
                      "text-sm font-mono font-bold shrink-0",
                      tx.amount > 0 ? "text-status-validated" : tx.amount < 0 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
