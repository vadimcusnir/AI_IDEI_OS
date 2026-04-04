import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Coins, AlertTriangle, ArrowRight, TrendingDown,
  Shield, Zap, Crown, Lock, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { getTimeEstimate } from "@/hooks/useEconomicGate";

interface EconomicGateProps {
  balance: number;
  estimatedCost: number;
  tierDiscount: number; // 0-40
  tier: string;
  onProceed: () => void;
  onCancel: () => void;
}

export function EconomicGate({
  balance, estimatedCost, tierDiscount, tier, onProceed, onCancel,
}: EconomicGateProps) {
  const navigate = useNavigate();
  const discountedCost = Math.round(estimatedCost * (1 - tierDiscount / 100));
  const canAfford = balance >= discountedCost;
  const savings = estimatedCost - discountedCost;
  const balanceAfter = balance - discountedCost;
  const timeEstimate = getTimeEstimate(estimatedCost);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border border-border rounded-xl bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Economic Pre-flight Check</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-micro">Est. {timeEstimate.label}</span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Cost breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-nano uppercase tracking-widest text-muted-foreground">Base Cost</p>
            <p className="text-sm font-bold flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-primary" />
              {estimatedCost}
              <span className="text-micro font-normal text-muted-foreground">N</span>
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-nano uppercase tracking-widest text-muted-foreground">Your Cost</p>
            <p className={cn("text-sm font-bold flex items-center gap-1", tierDiscount > 0 && "text-success")}>
              <Coins className="h-3.5 w-3.5" />
              {discountedCost}
              <span className="text-micro font-normal text-muted-foreground">N</span>
            </p>
          </div>
        </div>

        {/* Tier discount */}
        {tierDiscount > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-success/5 border border-success/20">
            <TrendingDown className="h-3 w-3 text-success shrink-0" />
            <span className="text-micro text-success">
              {tier} discount: -{tierDiscount}% ({savings} NEURONS saved)
            </span>
          </div>
        )}

        {/* Balance status */}
        <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-muted/50">
          <div className="text-micro">
            <span className="text-muted-foreground">Current balance: </span>
            <span className="font-bold">{balance.toLocaleString()} N</span>
          </div>
          {canAfford && (
            <div className="text-micro">
              <span className="text-muted-foreground">After: </span>
              <span className={cn("font-bold", balanceAfter < 200 ? "text-warning" : "text-foreground")}>
                {balanceAfter.toLocaleString()} N
              </span>
            </div>
          )}
        </div>

        {/* Cancellation + refund info */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/20">
          <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-micro text-muted-foreground">
            Credits are charged only after successful execution. Cancelling at any point returns your credits in full.
          </span>
        </div>

        {/* Insufficient balance */}
        {!canAfford && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-micro text-destructive font-medium">Insufficient balance</p>
              <p className="text-nano text-destructive/70">
                Need {discountedCost - balance} more NEURONS
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 text-nano"
              onClick={() => navigate("/credits")}
            >
              Top Up
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="ghost" size="sm" className="h-7 text-micro flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-micro flex-1 gap-1"
            onClick={onProceed}
            disabled={!canAfford}
          >
            <Zap className="h-3 w-3" />
            Confirm & Execute
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══ Cusnir_OS Layer Indicator ═══ */
interface KernelBadgeProps {
  variant?: "inline" | "banner";
  label?: string;
}

export function KernelBadge({ variant = "inline", label }: KernelBadgeProps) {
  if (variant === "banner") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
        <div className="h-4 w-4 rounded bg-primary/10 flex items-center justify-center">
          <Shield className="h-2.5 w-2.5 text-primary" />
        </div>
        <span className="text-nano text-muted-foreground">
          {label || "Optimized by system orchestration layer"}
        </span>
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-nano h-3.5 px-1.5 gap-0.5 border-primary/20 text-primary/70"
    >
      <Shield className="h-2 w-2" />
      {label || "Orchestrated"}
    </Badge>
  );
}

/* ═══ Premium Lock Overlay ═══ */
interface PremiumLockProps {
  feature: string;
  requiredTier: string;
  currentTier: string;
}

export function PremiumLock({ feature, requiredTier, currentTier }: PremiumLockProps) {
  const navigate = useNavigate();
  const isLocked = tierLevel(currentTier) < tierLevel(requiredTier);

  if (!isLocked) return null;

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
      <Lock className="h-5 w-5 text-muted-foreground mb-2" />
      <p className="text-micro font-medium mb-0.5">{feature}</p>
      <p className="text-nano text-muted-foreground mb-2">
        Requires {requiredTier} access
      </p>
      <Button
        size="sm"
        className="h-6 text-nano gap-1"
        onClick={() => navigate("/pricing")}
      >
        <Crown className="h-2.5 w-2.5" />
        Upgrade
      </Button>
    </div>
  );
}

function tierLevel(tier: string): number {
  const levels: Record<string, number> = { free: 0, core: 1, pro: 2, elite: 3, vip: 4 };
  return levels[tier.toLowerCase()] ?? 0;
}
