import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { FAQJsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown, ArrowRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/motion/PageTransition";
import { isRoot2 } from "@/lib/root2";

const PLANS = [
  {
    key: "free",
    name: "Explorer",
    price: "0",
    period: "",
    neurons: "500",
    badge: null,
    highlight: false,
    features: [
      "500 NEURONS credits",
      "3 transcriptions / month",
      "Basic extraction pipeline",
      "Knowledge library access",
      "Community access",
    ],
    cta: "Get Started Free",
  },
  {
    key: "creator",
    name: "Creator",
    price: "29",
    period: "/mo",
    neurons: "5,000",
    badge: "Popular",
    highlight: true,
    features: [
      "5,000 NEURONS / month",
      "Unlimited transcriptions",
      "Full extraction pipeline",
      "All AI services",
      "Priority processing",
      "Knowledge graph",
      "Export & API access",
    ],
    cta: "Start Creating",
  },
  {
    key: "professional",
    name: "Professional",
    price: "74",
    period: "/mo",
    neurons: "20,000",
    badge: null,
    highlight: false,
    features: [
      "20,000 NEURONS / month",
      "Everything in Creator",
      "Batch processing",
      "Advanced analytics",
      "Custom prompts",
      "Team workspace (3 seats)",
      "Priority support",
    ],
    cta: "Go Professional",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "299",
    period: "/mo",
    neurons: "100,000",
    badge: "Max Power",
    highlight: false,
    features: [
      "100,000 NEURONS / month",
      "Everything in Professional",
      "Unlimited team seats",
      "Custom integrations",
      "SLA & dedicated support",
      "White-label options",
      "NOTA2 token benefits",
    ],
    cta: "Contact Sales",
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
  const { user } = useAuth();
  const { t } = useTranslation("pages");

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
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={cn(
                  "relative flex flex-col rounded-xl border p-5 transition-all",
                  plan.highlight
                    ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                {plan.badge && (
                  <Badge className="absolute -top-2.5 right-4 text-[10px]">{plan.badge}</Badge>
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
                  variant={plan.highlight ? "default" : "outline"}
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    if (!user) navigate("/auth");
                    else navigate("/credits");
                  }}
                >
                  {plan.cta}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
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
