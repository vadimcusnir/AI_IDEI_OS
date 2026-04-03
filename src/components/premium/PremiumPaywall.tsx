import { useNavigate } from "react-router-dom";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap, CheckCircle2, ArrowRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier?: string;
  serviceName?: string;
}

const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  core: 1,
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
    case "core": return "Core";
    case "pro": return "Pro";
    case "vip": return "VIP";
    default: return tier;
  }
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case "core": return "bg-blue-500/15 text-blue-600 border-blue-500/20";
    case "pro": return "bg-primary/15 text-primary border-primary/20";
    case "vip": return "bg-amber-500/15 text-amber-600 border-amber-500/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

const PRO_BENEFITS = [
  "12,000 NEURONS / lună",
  "Acces la toate serviciile AI",
  "Procesare prioritară",
  "Batch processing",
  "-25% cost execuție",
];

const TOPUP_BENEFITS = [
  "2,000 NEURONS instant",
  "Fără abonament recurent",
  "Acces la serviciile de bază",
];

export function PremiumPaywall({ open, onOpenChange, requiredTier = "pro", serviceName }: PremiumPaywallProps) {
  const navigate = useNavigate();
  const { subscribe } = useSubscription();

  const handleSubscribePro = async () => {
    try {
      await subscribe(SUBSCRIPTION_TIERS.pro_monthly.price_id);
    } catch {
      navigate("/credits");
    }
    onOpenChange(false);
  };

  const handleBuyNeurons = async () => {
    try {
      await subscribe(SUBSCRIPTION_TIERS.pro_monthly.price_id);
    } catch {
      navigate("/credits");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <DialogHeader className="items-center">
            <DialogTitle className="text-lg">
              {serviceName
                ? `Deblochează "${serviceName}"`
                : "Deblochează funcționalitatea completă"}
            </DialogTitle>
            <DialogDescription className="text-sm max-w-xs mx-auto">
              Alege cum vrei să continui — abonament lunar sau credite la cerere.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Two-column options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 pb-5">
          {/* Option A: Pro subscription */}
          <div className="relative rounded-xl border-2 border-primary/30 bg-primary/5 p-4 flex flex-col">
            <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-2 py-0.5">
              Recomandat
            </Badge>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Abonează-te la Pro</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold font-mono text-foreground">$47</span>
              <span className="text-xs text-muted-foreground">/lună</span>
            </div>
            <ul className="space-y-1.5 mb-4 flex-1">
              {PRO_BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
            <Button size="sm" className="w-full gap-1.5 text-xs" onClick={handleSubscribePro}>
              Upgrade to Pro
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Option B: One-time NEURONS purchase */}
          <div className="rounded-xl border border-border p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold">Cumpără NEURONS</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold font-mono text-foreground">$11</span>
              <span className="text-xs text-muted-foreground">o singură dată</span>
            </div>
            <ul className="space-y-1.5 mb-4 flex-1">
              {TOPUP_BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={handleBuyNeurons}>
              Buy 2,000 NEURONS
              <Coins className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pb-4 px-5">
          Poți anula oricând. Gestionezi abonamentul din profilul tău.
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
