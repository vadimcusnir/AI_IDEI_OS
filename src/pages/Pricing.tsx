import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";

import { SEOHead } from "@/components/SEOHead";
import { FAQJsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown, ArrowRight, Brain, Loader2, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/motion/PageTransition";
import { toast } from "sonner";

const PLANS = [
  {
    key: "free",
    name: "Explorer",
    price: "0",
    period: "",
    neurons: "500",
    badge: null,
    highlight: false,
    priceId: null,
    mode: null as "subscription" | null,
    features: [
      "500 NEURONS bonus de bun venit",
      "3 transcrieri / lună",
      "Extracție de bază",
      "Acces librărie",
      "Acces comunitate",
    ],
    cta: "Începe gratuit",
  },
  {
    key: "core",
    name: "Core",
    price: "11",
    period: "/lună",
    neurons: "2,000",
    badge: null,
    highlight: false,
    priceId: SUBSCRIPTION_TIERS.core_monthly.price_id,
    mode: "subscription" as const,
    features: [
      "2,000 NEURONS / lună",
      "Acces la LCSS de bază",
      "Transcrieri nelimitate",
      "Pipeline complet de extracție",
      "Toate serviciile AI de bază",
      "Acces Knowledge Graph",
    ],
    cta: "Alege Core",
  },
  {
    key: "pro",
    name: "Pro",
    price: "47",
    period: "/lună",
    neurons: "10,000",
    badge: "Popular",
    highlight: true,
    priceId: SUBSCRIPTION_TIERS.pro_monthly.price_id,
    mode: "subscription" as const,
    features: [
      "10,000 NEURONS / lună",
      "-10% cost execuție",
      "Tot din Core",
      "Acces la toate serviciile",
      "Procesare prioritară",
      "Batch processing",
      "Analytics avansat",
    ],
    cta: "Alege Pro",
  },
  {
    key: "vip",
    name: "VIP",
    price: "128",
    period: "/lună",
    neurons: "30,000",
    badge: "Max Power",
    highlight: false,
    priceId: SUBSCRIPTION_TIERS.elite_monthly.price_id,
    mode: "subscription" as const,
    features: [
      "30,000 NEURONS / lună",
      "Suport prioritar dedicat",
      "Tot din Pro",
      "API access complet",
      "Integrări personalizate",
      "SLA & asistență dedicată",
      "Beneficii NOTA2",
    ],
    cta: "Alege VIP",
  },
];
const TOPUP_PACKAGES = [
  { key: "micro", neurons: 1000, price: 2, label: "Micro" },
  { key: "starter", neurons: 5500, price: 11, label: "Starter" },
  { key: "standard", neurons: 10000, price: 20, label: "Standard", popular: true },
  { key: "growth", neurons: 23500, price: 47, label: "Growth" },
  { key: "scale", neurons: 46000, price: 92, label: "Scale" },
];

const FAQ_ITEMS = [
  { question: "What are NEURONS credits?", answer: "NEURONS are compute credits that power AI service execution. Each service consumes a specific amount based on complexity. Base rate: $1 = 500 NEURONS. Subscriptions include monthly neurons + execution discounts up to 40%." },
  { question: "Can I buy credits without a subscription?", answer: "Yes! Top up credits anytime at the base rate ($1 = 500N). Subscriptions give you a monthly allocation plus discounted execution costs." },
  { question: "What is Root2 pricing?", answer: "All AI-IDEI prices follow the Root2 principle — the digital root of every price equals 2 (e.g. $11, $47, $137). This unique pricing philosophy ensures mathematical harmony across our economy." },
  { question: "How much does a typical service cost?", answer: "A simple extraction costs 20-47 NEURONS ($0.04-$0.09). An article generation costs ~74 NEURONS ($0.15). A complete capitalization pipeline costs ~290 NEURONS ($0.58). That's under $0.01 per deliverable vs $25+ from freelancers." },
  { question: "What does 'execution discount' mean?", answer: "Subscribers pay fewer NEURONS per service. Core saves 10%, Pro saves 25%, Elite saves 40%. This means your included neurons go further — Pro's 12,000N effectively buys 16,000N worth of services." },
  { question: "What happens when I run out of credits?", answer: "Your existing neurons and outputs remain accessible. You simply cannot run new AI services until you top up or your subscription renews." },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { subscribed, tier, subscribe, buyNeurons, manageSubscription } = useSubscription();
  const { t } = useTranslation("pages");
  const [processing, setProcessing] = useState<string | null>(null);

  const handlePlanAction = async (plan: typeof PLANS[number]) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Free plan — go to home
    if (plan.key === "free") {
      navigate("/home");
      return;
    }

    // Subscription plan with priceId
    if (plan.mode === "subscription" && plan.priceId) {
      setProcessing(plan.key);
      try {
        await subscribe(plan.priceId);
      } catch (e: any) {
        toast.error(e.message || "Checkout failed");
      } finally {
        setProcessing(null);
      }
      return;
    }

    // Fallback — go to credits for contact/topup
    navigate("/credits");
  };

  const isCurrentPlan = (planKey: string) => {
    if (planKey === "free" && !subscribed) return true;
    if (planKey === "core" && tier === "core_monthly") return true;
    if (planKey === "pro" && tier === "pro_monthly") return true;
    if (planKey === "vip" && tier === "elite_monthly") return true;
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
              <Sparkles className="h-3 w-3 mr-1" /> Root2 Pricing
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Transform Knowledge Into Assets
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-[50ch] mx-auto">
              Start free. Scale as your knowledge library grows. Every credit turns expertise into reusable intellectual capital.
            </p>
          </div>
        </section>

        {/* Plans Grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <Badge className="absolute -top-2.5 right-4 text-[10px]">{plan.badge}</Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-2.5 left-4 text-[10px] bg-primary text-primary-foreground">
                      Planul tău
                    </Badge>
                  )}

                  <h3 className="text-sm font-semibold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold font-mono">${plan.price}</span>
                    {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-4">
                    {plan.neurons} NEURONS / month
                  </p>

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
                      <><Loader2 className="h-3 w-3 animate-spin" /> Se procesează...</>
                    ) : isCurrent ? (
                      "Plan activ"
                    ) : plan.mode === "subscription" || plan.mode === "topup" ? (
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

        {/* Credits explainer */}
        <section className="border-t border-border bg-card">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <h2 className="text-xl font-bold mb-6 text-center">How NEURONS Credits Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">Upload Content</p>
                <p className="text-xs text-muted-foreground">Podcasts, videos, text — any knowledge source</p>
              </div>
              <div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">AI Processes</p>
                <p className="text-xs text-muted-foreground">Each service consumes NEURONS based on complexity</p>
              </div>
              <div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">Get Deliverables</p>
                <p className="text-xs text-muted-foreground">50+ outputs from a single knowledge extraction</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
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