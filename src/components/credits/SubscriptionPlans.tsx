import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
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

      {subscribed && subscriptionEnd && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{t("subscription.active_label")}</span> — {t("subscription.expires_on")}{" "}
          {new Date(subscriptionEnd).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, plan]) => {
          const isCurrentPlan = tier === key;
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
                <Badge className="absolute -top-2 right-3 text-[8px] bg-primary text-primary-foreground">
                  {t("subscription.your_plan")}
                </Badge>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">{plan.name}</h4>
              </div>

              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold">${plan.price}</span>
                <span className="text-xs text-muted-foreground">
                  {plan.interval === "month" ? t("subscription.per_month") : t("subscription.per_year")}
                </span>
              </div>

              <div className="text-[10px] text-muted-foreground mb-3">
                {plan.neurons_quota.toLocaleString()} NEURONS {plan.interval === "month" ? t("subscription.per_month") : t("subscription.per_year")}
              </div>

              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[11px]">
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
