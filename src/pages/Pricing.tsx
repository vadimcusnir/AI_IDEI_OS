import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
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
    mode: null as "subscription" | "topup" | null,
    features: [
      "500 NEURONS welcome bonus",
      "3 transcriptions / month",
      "Basic extraction pipeline",
      "Knowledge library access",
      "Community access",
    ],
    cta: "Get Started Free",
  },
  {
    key: "core",
    name: "Core",
    price: "11",
    period: "/mo",
    neurons: "2,000",
    badge: null,
    highlight: false,
    priceId: Object.values(SUBSCRIPTION_TIERS).find(t => t.name === "Core")?.price_id || null,
    mode: "subscription" as const,
    features: [
      "2,000 NEURONS / month",
      "Unlimited transcriptions",
      "Full extraction pipeline",
      "All AI services",
      "Knowledge graph access",
    ],
    cta: "Start with Core",
  },
  {
    key: "pro",
    name: "Pro",
    price: "47",
    period: "/mo",
    neurons: "10,000",
    badge: "Popular",
    highlight: true,
    priceId: Object.values(SUBSCRIPTION_TIERS).find(t => t.name === "Pro")?.price_id || null,
    mode: "subscription" as const,
    features: [
      "10,000 NEURONS / month",
      "Everything in Core",
      "Priority processing",
      "Batch processing",
      "Advanced analytics",
      "Custom prompts",
      "Export & API access",
    ],
    cta: "Go Pro",
  },
  {
    key: "elite",
    name: "Elite",
    price: "137",
    period: "/mo",
    neurons: "50,000",
    badge: "Max Power",
    highlight: false,
    priceId: Object.values(SUBSCRIPTION_TIERS).find(t => t.name === "Elite")?.price_id || null,
    mode: "subscription" as const,
    features: [
      "50,000 NEURONS / month",
      "Everything in Pro",
      "Unlimited team seats",
      "Custom integrations",
      "SLA & dedicated support",
      "White-label options",
      "NOTA2 token benefits",
    ],
    cta: "Go Elite",
  },
];
const FAQ_ITEMS = [
  { question: "What are NEURONS credits?", answer: "NEURONS are compute credits that power AI service execution. Each service consumes a specific amount of credits based on complexity. 1000 NEURONS = $10 USD." },
  { question: "Can I buy credits without a subscription?", answer: "Yes! You can top up credits anytime via one-time purchases. Subscriptions simply give you a monthly allowance at a better rate." },
  { question: "What is Root2 pricing?", answer: "All AI-IDEI prices follow the Root2 principle — the digital root of every price equals 2. This is our unique pricing philosophy." },
  { question: "What happens when I run out of credits?", answer: "Your existing neurons and outputs remain accessible. You simply cannot run new AI services until you top up or your subscription renews." },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { subscribed, tier, subscribe } = useSubscription();
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

    // Enterprise — contact
    if (plan.key === "enterprise") {
      navigate("/credits");
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

    // Top-up package
    if (plan.mode === "topup" && (plan as any).topupPackage) {
      setProcessing(plan.key);
      try {
        const { data, error } = await supabase.functions.invoke("create-topup-checkout", {
          body: { package_key: (plan as any).topupPackage },
        });
        if (error) throw new Error(error.message);
        if (data?.url) window.open(data.url, "_blank");
      } catch (e: any) {
        toast.error(e.message || "Checkout failed");
      } finally {
        setProcessing(null);
      }
      return;
    }

    // Fallback
    navigate("/credits");
  };

  const isCurrentPlan = (planKey: string) => {
    if (planKey === "free" && !subscribed) return true;
    if (planKey === "creator" && tier === "pro_monthly") return true;
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