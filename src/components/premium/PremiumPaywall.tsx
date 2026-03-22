import { useNavigate } from "react-router-dom";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier?: string;
  serviceName?: string;
}

const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  authenticated: 1,
  pro: 2,
  vip: 3,
};

export function tierSatisfied(userTier: string | null, requiredTier: string): boolean {
  if (!requiredTier || requiredTier === "free" || requiredTier === "authenticated") return true;
  const userLevel = TIER_HIERARCHY[userTier || "free"] ?? 0;
  const requiredLevel = TIER_HIERARCHY[requiredTier] ?? 0;
  return userLevel >= requiredLevel;
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case "free": return "Free";
    case "authenticated": return "Free";
    case "pro": return "Pro";
    case "vip": return "VIP";
    default: return tier;
  }
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case "pro": return "bg-primary/15 text-primary border-primary/20";
    case "vip": return "bg-amber-500/15 text-amber-600 border-amber-500/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export function PremiumPaywall({ open, onOpenChange, requiredTier = "pro", serviceName }: PremiumPaywallProps) {
  const navigate = useNavigate();
  const { subscribe } = useSubscription();

  const handleSubscribe = async (priceId: string) => {
    try {
      await subscribe(priceId);
    } catch {
      // Fallback to credits page
      navigate("/credits");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-lg">
            {requiredTier === "vip" ? "VIP Access Required" : "Pro Plan Required"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {serviceName
              ? `"${serviceName}" requires a ${getTierLabel(requiredTier)} subscription.`
              : `This feature requires a ${getTierLabel(requiredTier)} subscription.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
            <div
              key={key}
              className={cn(
                "rounded-xl border p-4 transition-all hover:border-primary/40",
                key === "pro_monthly" ? "border-primary/20 bg-primary/5" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tier.neurons_quota.toLocaleString()} NEURONS/{tier.interval === "month" ? "lună" : "an"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono">${tier.price}</p>
                  <p className="text-[10px] text-muted-foreground">/{tier.interval === "month" ? "mo" : "yr"}</p>
                </div>
              </div>
              <ul className="space-y-1 mb-3">
                {tier.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className="w-full gap-1.5 text-xs"
                variant={key === "pro_monthly" ? "default" : "outline"}
                onClick={() => handleSubscribe(tier.price_id)}
              >
                <Zap className="h-3 w-3" />
                Subscribe
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Cancel anytime. Manage subscription from your profile.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** Tier badge component for service cards */
export function TierBadge({ tier }: { tier: string }) {
  if (!tier || tier === "free" || tier === "authenticated") return null;
  return (
    <Badge variant="outline" className={cn("text-[8px] gap-0.5 px-1.5 py-0", getTierColor(tier))}>
      {tier === "vip" ? <Crown className="h-2 w-2" /> : <Lock className="h-2 w-2" />}
      {getTierLabel(tier)}
    </Badge>
  );
}
