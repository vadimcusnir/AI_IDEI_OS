import { useEffect, useState, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useWalletState } from "@/hooks/useWalletState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WalletPanel } from "@/components/wallet/WalletPanel";
import { TokenPanel } from "@/components/wallet/TokenPanel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Lock,
  Loader2, Clock, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  job_id: string | null;
  created_at: string;
}

export default function WalletPage() {
  const { t } = useTranslation("pages");
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    add: { icon: ArrowDownLeft, color: "text-status-validated", label: t("wallet.type_credit") },
    spend: { icon: ArrowUpRight, color: "text-destructive", label: t("wallet.type_spend") },
    reserve: { icon: Lock, color: "text-primary", label: t("wallet.type_reserve") },
    refund: { icon: RefreshCw, color: "text-status-validated", label: t("wallet.type_refund") },
  };

  useEffect(() => {
    if (!user) return;
    supabase.rpc("wallet_history", { _user_id: user.id, _limit: 50 })
      .then(({ data }) => {
        if (data) setTxns(data as Transaction[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Wallet — AI-IDEI" description="Manage your NEURONS credits wallet — balance, transactions, and access tier." />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">

          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center">
              <Wallet className="h-5 w-5 text-[hsl(var(--gold-oxide))]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">{t("wallet.title")}</h1>
              <p className="text-micro text-muted-foreground">{t("wallet.subtitle")}</p>
            </div>
          </div>

          <div className="mb-6">
            <WalletPanel />
          </div>

          {/* NOTA2 Token */}
          <div className="mb-6">
            <TokenPanel />
          </div>

          {/* Transaction History */}
          <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> {t("wallet.transaction_history")}
          </h2>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : txns.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("wallet.no_transactions")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {txns.map(tx => {
                const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.spend;
                const Icon = cfg.icon;
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-muted")}>
                      <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{tx.description}</p>
                      <p className="text-nano text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-nano px-1.5 py-0 h-4 shrink-0">{cfg.label}</Badge>
                    <span className={cn(
                      "text-xs font-mono font-bold shrink-0",
                      tx.amount > 0 ? "text-status-validated" : "text-destructive"
                    )}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
