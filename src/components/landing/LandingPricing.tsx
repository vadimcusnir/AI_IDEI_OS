import { FadeInView } from "@/components/motion/PageTransition";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const FEATURED_INDEX = 2; // Pro plan

interface Props {
  ctaAction: () => void;
}

export function LandingPricing({ ctaAction }: Props) {
  const { t } = useTranslation("landing");
  const plans = t("pricing.plans", { returnObjects: true }) as Array<{
    name: string; price: string; period: string; promise: string; text: string; cta: string;
  }>;

  return (
    <section id="access" className="py-20 sm:py-28" aria-labelledby="pricing-heading">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">{t("pricing.label")}</span>
          <h2 id="pricing-heading" className="heading-2 mb-4">{t("pricing.title")}</h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto text-flow">{t("pricing.subtitle")}</p>
        </FadeInView>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden max-w-4xl mx-auto">
          {plans.map((plan, i) => {
            const featured = i === FEATURED_INDEX;
            return (
              <FadeInView
                key={i}
                delay={i * 0.08}
                className={cn(
                  "p-6 sm:p-8 flex flex-col relative",
                  featured ? "bg-card ring-1 ring-[hsl(var(--gold-oxide)/0.4)]" : "bg-card"
                )}
              >
                {featured && (
                  <span className="absolute top-3 right-3 text-xs font-mono tracking-[0.15em] text-[hsl(var(--gold-oxide))] border border-[hsl(var(--gold-oxide)/0.4)] px-2 py-0.5 rounded">{t("pricing.popular")}</span>
                )}
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-1">
                  <span className="text-2xl font-mono font-bold text-[hsl(var(--gold-oxide))]">{plan.price}</span>
                  <span className="text-sm font-mono text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs sm:text-sm font-mono tracking-[0.1em] text-[hsl(var(--gold-dim))] mb-4">{plan.promise.toUpperCase()}</p>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{plan.text}</p>
                <Button
                  onClick={ctaAction}
                  className={cn(
                    "w-full mt-6 gap-2 text-sm h-11 min-h-[44px]",
                    featured
                      ? "bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))]"
                      : "bg-transparent border border-border text-muted-foreground hover:border-[hsl(var(--gold-oxide)/0.4)] hover:text-[hsl(var(--gold-oxide))]"
                  )}
                  size="sm"
                >
                  {plan.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </FadeInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}