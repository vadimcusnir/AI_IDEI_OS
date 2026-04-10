import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/useSubscription";
import {
  SUBSCRIPTION_TIERS,
  ANNUAL_TIERS,
  TIER_PAIRS,
  annualSavingsPct,
  type BillingInterval,
  type SubscriptionTier,
} from "@/config/economyConfig";
import { Check, Crown, Zap, Loader2, ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DowngradeRetention } from "@/components/revenue/DowngradeRetention";

export function SubscriptionPlans() {
  const { subscribed, tier, subscriptionEnd, loading, subscribe, manageSubscription } = useSubscription();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [showRetention, setShowRetention] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const { t } = useTranslation("common");

  const handleSubscribe = async (priceId: string, tierKey: string) => {
    setSubscribing(tierKey);
    try {
      await subscribe(priceId);
    } catch (e: any) {
      toast.error(e.message || t("subscription.error_subscribe"));
    } finally {
      setSubscribing(null);
    }
  };

  const handleManage = async () => {
    try {
      await manageSubscription();
    } catch (e: any) {
      toast.error(e.message || t("subscription.error_portal"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const tiers = billingInterval === "month" ? SUBSCRIPTION_TIERS : ANNUAL_TIERS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Crown className="h-4 w-4 text-primary" /> {t("subscription.plans_title")}
        </h3>
        {subscribed && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowRetention(true)}>
            <Settings className="h-3 w-3" /> {t("subscription.manage_btn")}
          </Button>
        )}
      </div>

      {/* Monthly / Annual toggle */}
      <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
        <button
          onClick={() => setBillingInterval("month")}
          className={cn(
            "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
            billingInterval === "month"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Lunar
        </button>
        <button
          onClick={() => setBillingInterval("year")}
          className={cn(
            "px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
            billingInterval === "year"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Anual
          <span className="text-nano font-bold px-1.5 py-0.5 rounded-full bg-status-validated/15 text-status-validated">
            -18%
          </span>
        </button>
      </div>

      {subscribed && subscriptionEnd && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{t("subscription.active_label")}</span> — {t("subscription.expires_on")}{" "}
          {new Date(subscriptionEnd).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TIER_PAIRS.map((pair) => {
          const key = billingInterval === "month" ? pair.monthly : pair.annual;
          const plan = tiers[key];
          if (!plan) return null;
          const isCurrentPlan = tier === key;
          const monthlyTier = SUBSCRIPTION_TIERS[pair.monthly];
          const annualTier = ANNUAL_TIERS[pair.annual];
          const savings = annualSavingsPct(monthlyTier.price, annualTier.price);

          return (
            <div
              key={key}
              className={cn(
                "relative rounded-xl border p-4 transition-all",
                isCurrentPlan
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              {isCurrentPlan && (
                <Badge className="absolute -top-2 right-3 text-nano bg-primary text-primary-foreground">
                  {t("subscription.your_plan")}
                </Badge>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">{plan.name}</h4>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold">${plan.price}</span>
                <span className="text-xs text-muted-foreground">
                  /{billingInterval === "month" ? t("subscription.per_month") : t("subscription.per_year")}
                </span>
              </div>

              {billingInterval === "year" && (
                <p className="text-nano text-status-validated font-medium mb-2">
                  Economisești {savings}% — ${monthlyTier.price * 12 - annualTier.price}/an
                </p>
              )}

              <div className="text-micro text-muted-foreground mb-3">
                {plan.neurons_quota.toLocaleString()} NEURONS / lună
              </div>

              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-dense">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                  {t("subscription.plan_active")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full text-xs gap-1"
                  onClick={() => handleSubscribe(plan.price_id, key)}
                  disabled={!!subscribing}
                >
                  {subscribing === key ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3 w-3" />
                  )}
                  {subscribing === key ? t("subscription.processing") : t("subscription.subscribe")}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <DowngradeRetention
        open={showRetention}
        onClose={() => setShowRetention(false)}
        onConfirmCancel={() => {
          setShowRetention(false);
          handleManage();
        }}
        currentTier={tier}
      />
    </div>
  );
}
