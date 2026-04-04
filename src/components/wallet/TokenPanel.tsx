import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import {
  Coins, Lock, TrendingUp, Shield, RefreshCw,
  ArrowDownLeft, ArrowUpRight, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const TIER_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  holder: "bg-semantic-blue/10 text-semantic-blue",
  staker: "bg-primary/10 text-primary",
  governor: "bg-semantic-purple/10 text-semantic-purple",
  vip: "bg-semantic-amber/10 text-semantic-amber",
};

interface TokenTx {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export function TokenPanel() {
  const { token, loading, refresh } = useTokenBalance();
  const { user } = useAuth();
  const { t } = useTranslation("common");
  const [txns, setTxns] = useState<TokenTx[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("token_transactions")
      .select("id, amount, type, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setTxns(data as TokenTx[]);
        setTxLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Coins className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t("token.not_initialized", "No NOTA2 tokens yet")}</p>
        <p className="text-micro text-muted-foreground/60 mt-1">{t("token.earn_hint", "Earn tokens through platform activity and contributions")}</p>
      </div>
    );
  }

  const total = token.balance + token.staked;

  return (
    <div className="space-y-4">
      {/* Token Overview Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-semantic-amber" />
            <h3 className="text-sm font-semibold">NOTA2 Token</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded-full text-micro font-semibold uppercase tracking-wider", TIER_COLORS[token.accessTier] || TIER_COLORS.free)}>
              {token.accessTier}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-3 gap-px bg-border">
          <div className="bg-card px-4 py-3 bg-primary/[0.02]">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-semantic-amber" />
              <span className="text-micro uppercase tracking-wider text-muted-foreground font-semibold">
                {t("token.available", "Available")}
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-foreground">
              {token.balance.toLocaleString()}
            </p>
          </div>
          <div className="bg-card px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span className="text-micro uppercase tracking-wider text-muted-foreground font-semibold">
                {t("token.staked", "Staked")}
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-muted-foreground">
              {token.staked.toLocaleString()}
            </p>
          </div>
          <div className="bg-card px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="h-3.5 w-3.5 text-status-validated" />
              <span className="text-micro uppercase tracking-wider text-muted-foreground font-semibold">
                {t("token.total_earned", "Total Earned")}
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-muted-foreground">
              {token.totalEarned.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border text-dense text-muted-foreground">
          <span>
            {t("token.total_supply", "Total supply")}: 100,000,000 NOTA2
          </span>
          {token.tierExpiresAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("token.tier_expires", "Tier expires")}: {new Date(token.tierExpiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Access Info */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("token.access_model", "Token ≠ Compute · Token = Access")}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-micro font-semibold text-semantic-amber mb-0.5">NOTA2</p>
            <p className="text-xs text-muted-foreground">{t("token.access_desc", "Access rights, governance, tier unlock")}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-micro font-semibold text-primary mb-0.5">NEURONS</p>
            <p className="text-xs text-muted-foreground">{t("token.compute_desc", "Service execution, AI compute credits")}</p>
          </div>
        </div>
      </div>

      {/* Token Transactions */}
      {txns.length > 0 && (
        <div>
          <h4 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> {t("token.activity", "Token Activity")}
          </h4>
          <div className="space-y-1">
            {txns.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-muted")}>
                  {tx.amount > 0 ? (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-status-validated" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{tx.description}</p>
                  <p className="text-nano text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Badge variant="outline" className="text-nano px-1.5 py-0 h-4 shrink-0">{tx.type}</Badge>
                <span className={cn(
                  "text-xs font-mono font-bold shrink-0",
                  tx.amount > 0 ? "text-status-validated" : "text-destructive"
                )}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
