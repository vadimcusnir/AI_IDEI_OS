import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Coins, TrendingDown, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, Sparkles, Gift,
  BarChart3,
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

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  spend: { icon: ArrowDownRight, color: "text-destructive" },
  reserve: { icon: Clock, color: "text-primary" },
  release: { icon: ArrowUpRight, color: "text-status-validated" },
  denied: { icon: TrendingDown, color: "text-muted-foreground" },
  topup: { icon: TrendingUp, color: "text-status-validated" },
  bonus: { icon: Gift, color: "text-ai-accent" },
};

export default function Credits() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    const [creditsRes, txRes] = await Promise.all([
      supabase.from("user_credits").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("credit_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50),
    ]);

    if (creditsRes.data) {
      setCredits(creditsRes.data as UserCredits);
    } else {
      // Initialize credits
      await supabase.from("user_credits").insert({
        user_id: user!.id, balance: 500, total_earned: 500, total_spent: 0,
      } as any);
      setCredits({ balance: 500, total_earned: 500, total_spent: 0, updated_at: new Date().toISOString() });
    }

    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const spendTransactions = transactions.filter(t => t.type === "spend");
  const serviceStats = spendTransactions.reduce((acc, t) => {
    const serviceName = t.description.replace(/^(SPEND|EXTRACTION|Service): ?/, "").split(" — ")[0];
    if (!acc[serviceName]) acc[serviceName] = { count: 0, total: 0 };
    acc[serviceName].count++;
    acc[serviceName].total += Math.abs(t.amount);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  return (
    <div className="min-h-screen bg-background">
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img src={logo} alt="ai-idei.com" className="h-5 w-5" />
          <span className="text-sm font-serif">Credits</span>
          <span className="text-[9px] uppercase tracking-wider bg-ai-accent/10 text-ai-accent px-1.5 py-0.5 rounded font-semibold">
            Economy
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Balance card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono">{credits?.balance ?? 0}</span>
                <span className="text-sm text-muted-foreground">NEURONS</span>
              </div>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-ai-accent/10 flex items-center justify-center">
              <Coins className="h-7 w-7 text-ai-accent" />
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Total Earned</p>
              <p className="text-sm font-bold font-mono text-status-validated">{credits?.total_earned ?? 0}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Total Spent</p>
              <p className="text-sm font-bold font-mono text-destructive">{credits?.total_spent ?? 0}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Utilization</p>
              <p className="text-sm font-bold font-mono">
                {credits && credits.total_earned > 0
                  ? Math.round((credits.total_spent / credits.total_earned) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Service consumption stats */}
        {Object.keys(serviceStats).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Consumption by Service
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(serviceStats)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([name, stats]) => (
                  <div key={name} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card">
                    <div>
                      <p className="text-xs font-medium truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{stats.count} execution{stats.count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-sm font-mono font-bold">{stats.total}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Ledger</h2>
            <span className="text-[10px] text-muted-foreground">{transactions.length} entries</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-8 w-8 opacity-20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Run a service to see your first transaction.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map(tx => {
                const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.spend;
                const TxIcon = cfg.icon;
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-card transition-colors">
                    <TxIcon className={cn("h-4 w-4 shrink-0", cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        tx.amount > 0 ? "text-status-validated" : tx.amount < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{tx.type}</p>
                    </div>
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
