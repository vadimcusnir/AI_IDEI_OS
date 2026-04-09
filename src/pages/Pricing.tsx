import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";

import { SEOHead } from "@/components/SEOHead";
import { FAQJsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown, ArrowRight, Brain, Loader2, ShoppingCart, Coins, Settings, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/motion/PageTransition";
import { toast } from "sonner";

function usePlans() {
  const { t } = useTranslation("pages");
  return [
    {
      key: "free",
      name: t("pricing.plan_explorer"),
      price: "0",
      period: "",
      neurons: "500",
      badge: null,
      highlight: false,
      priceId: null,
      mode: null as "subscription" | null,
      savingsVsFree: null,
      features: [
        t("pricing.feat_welcome_bonus"),
        t("pricing.feat_transcriptions_3"),
        t("pricing.feat_basic_extraction"),
        t("pricing.feat_library_access"),
        t("pricing.feat_community_access"),
      ],
      cta: t("pricing.start_free"),
    },
    {
      key: "starter",
      name: "Starter",
      price: String(SUBSCRIPTION_TIERS.starter_monthly.price),
      period: t("pricing.per_month"),
      neurons: SUBSCRIPTION_TIERS.starter_monthly.neurons_quota.toLocaleString(),
      badge: null,
      highlight: false,
      priceId: SUBSCRIPTION_TIERS.starter_monthly.price_id,
      mode: "subscription" as const,
      savingsVsFree: null,
      features: SUBSCRIPTION_TIERS.starter_monthly.features,
      cta: "Choose Starter",
    },
    {
      key: "pro",
      name: t("pricing.plan_pro"),
      price: String(SUBSCRIPTION_TIERS.pro_monthly.price),
      period: t("pricing.per_month"),
      neurons: SUBSCRIPTION_TIERS.pro_monthly.neurons_quota.toLocaleString(),
      badge: "Popular",
      highlight: true,
      priceId: SUBSCRIPTION_TIERS.pro_monthly.price_id,
      mode: "subscription" as const,
      savingsVsFree: "53%",
      features: SUBSCRIPTION_TIERS.pro_monthly.features,
      cta: t("pricing.choose_pro"),
    },
    {
      key: "vip",
      name: t("pricing.plan_vip"),
      price: String(SUBSCRIPTION_TIERS.vip_monthly.price),
      period: t("pricing.per_month"),
      neurons: SUBSCRIPTION_TIERS.vip_monthly.neurons_quota.toLocaleString(),
      badge: "Best Value",
      highlight: false,
      priceId: SUBSCRIPTION_TIERS.vip_monthly.price_id,
      mode: "subscription" as const,
      savingsVsFree: "77%",
      features: SUBSCRIPTION_TIERS.vip_monthly.features,
      cta: t("pricing.choose_vip"),
    },
    {
      key: "enterprise",
      name: "Enterprise",
      price: String(SUBSCRIPTION_TIERS.enterprise_monthly.price),
      period: t("pricing.per_month"),
      neurons: SUBSCRIPTION_TIERS.enterprise_monthly.neurons_quota.toLocaleString(),
      badge: "Max Power",
      highlight: false,
      priceId: SUBSCRIPTION_TIERS.enterprise_monthly.price_id,
      mode: "subscription" as const,
      savingsVsFree: "81%",
      features: SUBSCRIPTION_TIERS.enterprise_monthly.features,
      cta: "Choose Enterprise",
    },
  ];
}

const TOPUP_PACKAGES = [
  { key: "micro", neurons: 1000, price: 2, label: "Micro", savings: null },
  { key: "starter", neurons: 5500, price: 11, label: "Starter", savings: null },
  { key: "standard", neurons: 10000, price: 20, label: "Standard", popular: true, savings: "Save 9%" },
  { key: "growth", neurons: 23500, price: 47, label: "Growth", savings: "Save 15%" },
  { key: "scale", neurons: 46000, price: 92, label: "Scale", savings: "Save 20%" },
];

function useFaqItems() {
  const { t } = useTranslation("pages");
  return [
    { question: t("pricing.faq_q1"), answer: t("pricing.faq_a1") },
    { question: t("pricing.faq_q2"), answer: t("pricing.faq_a2") },
    { question: t("pricing.faq_q3"), answer: t("pricing.faq_a3") },
    { question: t("pricing.faq_q4"), answer: t("pricing.faq_a4") },
    { question: t("pricing.faq_q5"), answer: t("pricing.faq_a5") },
    { question: t("pricing.faq_q6"), answer: t("pricing.faq_a6") },
  ];
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { subscribed, tier, subscribe, buyNeurons, manageSubscription } = useSubscription();
  const { t } = useTranslation("pages");
  const [processing, setProcessing] = useState<string | null>(null);
  const PLANS = usePlans();
  const FAQ_ITEMS = useFaqItems();

  const handlePlanAction = async (plan: ReturnType<typeof usePlans>[number]) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (plan.key === "free") {
      navigate("/home");
      return;
    }
    if (plan.mode === "subscription" && plan.priceId) {
      setProcessing(plan.key);
      try {
        await subscribe(plan.priceId);
      } catch (e: any) {
        toast.error(e.message || t("pricing.checkout_failed"));
      } finally {
        setProcessing(null);
      }
      return;
    }
    navigate("/credits");
  };

  const isCurrentPlan = (planKey: string) => {
    if (planKey === "free" && !subscribed) return true;
    if (planKey === "starter" && tier === "starter_monthly") return true;
    if (planKey === "pro" && tier === "pro_monthly") return true;
    if (planKey === "vip" && tier === "vip_monthly") return true;
    if (planKey === "enterprise" && tier === "enterprise_monthly") return true;
    return false;
  };

  return (
    <PageTransition>
      <SEOHead
        title="Pricing — AI-IDEI"
        description="Simple, transparent pricing for AI-powered expertise capitalization. Start free with 500 NEURONS credits."
      />
      <FAQJsonLd items={FAQ_ITEMS} />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
            <Badge variant="secondary" className="mb-4 text-xs">
              <Sparkles className="h-3 w-3 mr-1" /> {t("pricing.badge")}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {t("pricing.hero_title")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-[50ch] mx-auto mb-6">
              {t("pricing.hero_desc")}
            </p>

            {/* Social proof bar */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <strong className="text-foreground">2,400+</strong> knowledge workers
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <strong className="text-foreground">1.2M+</strong> neurons processed
              </span>
              <span className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-primary" />
                <strong className="text-foreground">50+</strong> AI services
              </span>
            </div>
          </div>
        </section>

        {/* Plans Grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = isCurrentPlan(plan.key);
              const isProcessingThis = processing === plan.key;

              return (
                <div
                  key={plan.key}
                  className={cn(
                    "relative flex flex-col rounded-xl border p-5 transition-all",
                    isCurrent
                      ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                      : plan.highlight
                        ? "border-primary/50 bg-primary/[0.02] shadow-md shadow-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-2.5 right-4 text-micro">{plan.badge}</Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-2.5 left-4 text-micro bg-primary text-primary-foreground">
                      {t("pricing.your_plan")}
                    </Badge>
                  )}

                  <h3 className="text-sm font-semibold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold font-mono">${plan.price}</span>
                    {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="text-micro text-muted-foreground mb-1">
                    {plan.neurons} {t("pricing.neurons_per_month")}
                  </p>

                  {/* Savings anchor */}
                  {plan.savingsVsFree && (
                    <p className="text-nano font-semibold text-status-validated mb-3">
                      Save {plan.savingsVsFree} vs pay-as-you-go
                    </p>
                  )}
                  {!plan.savingsVsFree && <div className="mb-3" />}

                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlight || isCurrent ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs gap-1"
                    onClick={() => handlePlanAction(plan)}
                    disabled={isCurrent || !!processing}
                  >
                    {isProcessingThis ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> {t("pricing.processing")}</>
                    ) : isCurrent ? (
                      t("pricing.plan_active")
                    ) : plan.mode === "subscription" ? (
                      <><ShoppingCart className="h-3 w-3" /> {plan.cta}</>
                    ) : (
                      <>{plan.cta} <ArrowRight className="h-3 w-3" /></>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top-Up Packages */}
        <section className="border-t border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-3 text-xs">
                <Coins className="h-3 w-3 mr-1" /> {t("pricing.topup_badge")}
              </Badge>
              <h2 className="text-xl font-bold mb-2">{t("pricing.topup_title")}</h2>
              <p className="text-xs text-muted-foreground max-w-[45ch] mx-auto">
                {t("pricing.topup_desc")}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {TOPUP_PACKAGES.map((pkg) => {
                const isProcessingPkg = processing === `topup_${pkg.key}`;
                return (
                  <div
                    key={pkg.key}
                    className={cn(
                      "relative flex flex-col items-center rounded-xl border p-4 transition-all",
                      pkg.popular
                        ? "border-primary/50 bg-primary/[0.03] shadow-md"
                        : "border-border bg-background hover:border-primary/30"
                    )}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-2 text-nano">Popular</Badge>
                    )}
                    <span className="text-2xl font-bold font-mono">${pkg.price}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {pkg.neurons.toLocaleString()} N
                    </span>
                    <span className="text-nano text-muted-foreground/60 mt-0.5">
                      ${(pkg.price / pkg.neurons * 1000).toFixed(1)}/1K
                    </span>
                    {pkg.savings && (
                      <span className="text-nano font-semibold text-status-validated mt-1">
                        {pkg.savings}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={pkg.popular ? "default" : "outline"}
                      className="w-full mt-3 text-micro h-7 gap-1"
                      disabled={!!processing || !user}
                      onClick={async () => {
                        if (!user) { navigate("/auth"); return; }
                        setProcessing(`topup_${pkg.key}`);
                        try {
                          const { data, error } = await (await import("@/integrations/supabase/client")).supabase.functions.invoke("create-topup-checkout", {
                            body: { package_key: pkg.key },
                          });
                          if (error) throw error;
                          if (data?.url) window.open(data.url, "_blank");
                        } catch (e: any) {
                          toast.error(e?.message || t("pricing.checkout_failed"));
                        } finally {
                          setProcessing(null);
                        }
                      }}
                    >
                      {isProcessingPkg ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3" />}
                      {isProcessingPkg ? "..." : t("pricing.buy")}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Manage Subscription CTA */}
        {subscribed && (
          <section className="border-t border-border">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {t("pricing.manage_sub_desc")}
              </p>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => manageSubscription()}>
                <Settings className="h-3 w-3" /> {t("pricing.manage_sub_btn")}
              </Button>
            </div>
          </section>
        )}

        {/* Credits explainer */}
        <section className="border-t border-border bg-card">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <h2 className="text-xl font-bold mb-6 text-center">{t("pricing.how_credits_title")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">{t("pricing.step_upload")}</p>
                <p className="text-xs text-muted-foreground">{t("pricing.step_upload_desc")}</p>
              </div>
              <div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">{t("pricing.step_process")}</p>
                <p className="text-xs text-muted-foreground">{t("pricing.step_process_desc")}</p>
              </div>
              <div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">{t("pricing.step_deliver")}</p>
                <p className="text-xs text-muted-foreground">{t("pricing.step_deliver_desc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h2 className="text-xl font-bold mb-6 text-center">{t("pricing.faq_title")}</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">{faq.question}</h3>
                <p className="text-xs text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
