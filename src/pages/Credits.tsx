import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Loader2, Coins, TrendingDown, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, Gift,
  BarChart3, Filter, Search, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  spend: { icon: ArrowDownRight, color: "text-destructive", label: "Consum" },
  reserve: { icon: Clock, color: "text-primary", label: "Rezervat" },
  release: { icon: ArrowUpRight, color: "text-status-validated", label: "Eliberat" },
  denied: { icon: TrendingDown, color: "text-muted-foreground", label: "Refuzat" },
  topup: { icon: TrendingUp, color: "text-status-validated", label: "Încărcare" },
  bonus: { icon: Gift, color: "text-ai-accent", label: "Bonus" },
  adjustment: { icon: Coins, color: "text-primary", label: "Ajustare" },
};

type TxFilter = "all" | "spend" | "topup" | "bonus" | "reserve" | "release";

export default function Credits() {
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [txSearch, setTxSearch] = useState("");

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
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

        {/* Page title */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Credite NEURONS</h1>
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
              balanceHealth === "healthy" ? "bg-status-validated/15 text-status-validated" :
              balanceHealth === "warning" ? "bg-primary/15 text-primary" :
              "bg-destructive/15 text-destructive"
            )}>
              {balanceHealth === "healthy" ? "Sănătos" : balanceHealth === "warning" ? "Scăzut" : "Critic"}
            </span>
          </div>
        </div>

        {/* Balance + Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          {/* Main balance */}
          <div className="sm:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Balanță curentă</p>
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                balanceHealth === "healthy" ? "bg-status-validated/10" :
                balanceHealth === "warning" ? "bg-primary/10" : "bg-destructive/10"
              )}>
                <Coins className={cn(
                  "h-5 w-5",
                  balanceHealth === "healthy" ? "text-status-validated" :
                  balanceHealth === "warning" ? "text-primary" : "text-destructive"
                )} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold font-mono">{credits?.balance ?? 0}</span>
              <span className="text-xs text-muted-foreground">NEURONS</span>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Câștigat</p>
                <p className="text-xs font-bold font-mono text-status-validated">+{credits?.total_earned ?? 0}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Consumat</p>
                <p className="text-xs font-bold font-mono text-destructive">-{credits?.total_spent ?? 0}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Utilizare</p>
                <p className="text-xs font-bold font-mono">{utilization}%</p>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tranzacții</p>
            <span className="text-2xl font-bold font-mono">{transactions.length}</span>
            <p className="text-[10px] text-muted-foreground mt-1">
              {transactions.filter(t => {
                const d = new Date(t.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length} luna asta
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Servicii folosite</p>
            <span className="text-2xl font-bold font-mono">{Object.keys(serviceStats).length}</span>
            <p className="text-[10px] text-muted-foreground mt-1">
              {transactions.filter(t => t.type === "spend").length} execuții
            </p>
          </div>
        </div>

        {/* Service consumption breakdown */}
        {Object.keys(serviceStats).length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" /> Consum per serviciu
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(serviceStats)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([name, stats]) => (
                  <div key={name} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{stats.count} execuți{stats.count !== 1 ? "i" : "e"}</p>
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
              Istoric tranzacții
              <span className="text-muted-foreground/40 font-normal">{filteredTx.length}</span>
            </h2>
            <div className="flex-1" />

            {/* Search */}
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 flex-1 sm:max-w-[200px]">
              <Search className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <input
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                placeholder="Caută..."
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
                { value: "all" as TxFilter, label: "Toate" },
                { value: "spend" as TxFilter, label: "Consum" },
                { value: "topup" as TxFilter, label: "Încărcări" },
                { value: "bonus" as TxFilter, label: "Bonus" },
              ]).map(f => (
                <button
                  key={f.value}
                  onClick={() => setTxFilter(f.value)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium transition-colors",
                    txFilter === f.value ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-8 w-8 opacity-20 mx-auto mb-3" />
              {transactions.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-1">Nicio tranzacție încă</p>
                  <p className="text-[10px] text-muted-foreground/60">Rulează un serviciu pentru a vedea prima tranzacție.</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">Niciun rezultat pentru filtrul selectat</p>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => { setTxFilter("all"); setTxSearch(""); }}>
                    Șterge filtrele
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
                        {new Date(tx.created_at).toLocaleString("ro-RO")} · <span className="uppercase">{cfg.label}</span>
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
  );
}
