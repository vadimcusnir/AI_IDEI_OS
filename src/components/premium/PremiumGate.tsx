import { ReactNode, useState } from "react";
import { useUserTier, UserTier } from "@/hooks/useUserTier";
import { PremiumPaywall, tierSatisfied, getTierLabel } from "@/components/premium/PremiumPaywall";
import { Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumGateProps {
  /** Minimum tier required */
  requiredTier: "pro" | "vip";
  /** Name shown in paywall */
  featureName?: string;
  /** Content to render when access is granted */
  children: ReactNode;
  /** Fallback style: 'overlay' blurs content, 'replace' shows a card */
  fallback?: "overlay" | "replace";
}

/**
 * Wraps content behind a tier gate.
 * If user doesn't have the required tier, shows paywall trigger.
 */
export function PremiumGate({
  requiredTier,
  featureName,
  children,
  fallback = "overlay",
}: PremiumGateProps) {
  const { tier, loading } = useUserTier();
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasAccess = tierSatisfied(tier, requiredTier);
  if (hasAccess) return <>{children}</>;

  if (fallback === "replace") {
    return (
      <>
        <button
          onClick={() => setPaywallOpen(true)}
          className="w-full rounded-xl border border-dashed border-primary/20 bg-primary/5 p-6 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">
              {getTierLabel(requiredTier)} Required
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {featureName
                ? `"${featureName}" requires a ${getTierLabel(requiredTier)} subscription.`
                : `Upgrade to ${getTierLabel(requiredTier)} to unlock this feature.`}
            </p>
          </div>
        </button>
        <PremiumPaywall
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          requiredTier={requiredTier}
          serviceName={featureName}
        />
      </>
    );
  }

  // Overlay fallback — blur content with unlock button
  return (
    <>
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl">
          <button
            onClick={() => setPaywallOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            Unlock with {getTierLabel(requiredTier)}
          </button>
        </div>
      </div>
      <PremiumPaywall
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        requiredTier={requiredTier}
        serviceName={featureName}
      />
    </>
  );
}
