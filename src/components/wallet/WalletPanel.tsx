import { useWalletState } from "@/hooks/useWalletState";
import {
  Wallet, Shield, Clock, TrendingUp, Lock, Unlock,
  RefreshCw, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const TIER_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  pro: "bg-primary/10 text-primary",
  business: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  vip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const STATUS_CONFIG = {
  open: { icon: Unlock, label: "Open", color: "text-status-validated" },
  restricted: { icon: AlertTriangle, label: "Restricted", color: "text-amber-500" },
  locked: { icon: Lock, label: "Locked", color: "text-destructive" },
  suspended: { icon: Shield, label: "Suspended", color: "text-destructive" },
};

export function WalletPanel() {
  const { wallet, access, loading, isFresh, refresh } = useWalletState();
  const { t } = useTranslation("common");

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Wallet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t("wallet.not_initialized")}</p>
      </div>
    );
  }

  const status = access ? STATUS_CONFIG[access.windowStatus] : null;
  const StatusIcon = status?.icon || Shield;
  const total = wallet.available + wallet.staked + wallet.locked;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("wallet.wallet_state")}</h3>
        </div>
        <div className="flex items-center gap-2">
          {access && (
            <span className={cn("px-2 py-0.5 rounded-full text-micro font-semibold uppercase tracking-wider", TIER_COLORS[access.tier])}>
              {access.tier}
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-3 gap-px bg-border">
        <BalanceCell
          label={t("wallet.available")}
          value={wallet.available}
          icon={<TrendingUp className="h-3.5 w-3.5 text-status-validated" />}
          highlight
        />
        <BalanceCell
          label={t("wallet.staked")}
          value={wallet.staked}
          icon={<Lock className="h-3.5 w-3.5 text-primary" />}
        />
        <BalanceCell
          label={t("wallet.locked")}
          value={wallet.locked}
          icon={<Shield className="h-3.5 w-3.5 text-amber-500" />}
        />
      </div>

      {/* Footer: Snapshot + Access status */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border text-dense text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>Snapshot: {Math.round(wallet.snapshotAgeSec)}s {t("ago")}</span>
          {isFresh ? (
            <CheckCircle2 className="h-3 w-3 text-status-validated" />
          ) : (
            <AlertTriangle className="h-3 w-3 text-amber-500" />
          )}
        </div>
        {status && (
          <div className={cn("flex items-center gap-1", status.color)}>
            <StatusIcon className="h-3 w-3" />
            <span className="font-medium">{t(`wallet.status_${access?.windowStatus}`)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BalanceCell({ label, value, icon, highlight }: {
  label: string; value: number; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={cn("bg-card px-4 py-3", highlight && "bg-primary/[0.02]")}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-micro uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      </div>
      <p className={cn("text-lg font-mono font-bold", highlight ? "text-foreground" : "text-muted-foreground")}>
        {value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}
