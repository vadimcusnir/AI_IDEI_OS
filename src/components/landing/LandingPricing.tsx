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
    <section id="access" className="py-24 sm:py-36" aria-labelledby="pricing-heading">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("pricing.label")}</span>
          <h2 id="pricing-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">{t("pricing.title")}</h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-[1.7]">{t("pricing.subtitle")}</p>
        </FadeInView>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 rounded-xl overflow-hidden max-w-4xl mx-auto">
          {plans.map((plan, i) => {
            const featured = i === FEATURED_INDEX;
            return (
              <FadeInView
                key={i}
                delay={i * 0.08}
                className={cn(
                  "p-7 sm:p-9 flex flex-col relative",
                  featured ? "bg-card ring-1 ring-[hsl(var(--gold-oxide)/0.35)]" : "bg-card"
                )}
              >
                {featured && (
                  <span className="absolute top-3.5 right-3.5 text-[10px] font-mono tracking-[0.15em] uppercase text-[hsl(var(--gold-oxide))] border border-[hsl(var(--gold-oxide)/0.3)] px-2.5 py-1 rounded-md">{t("pricing.popular")}</span>
                )}
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mt-3 mb-1.5">
                  <span className="text-3xl font-mono font-bold text-[hsl(var(--gold-oxide))] tracking-tight">{plan.price}</span>
                  <span className="text-sm font-mono text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-[11px] font-mono tracking-[0.12em] uppercase text-[hsl(var(--gold-dim))] mb-5">{plan.promise}</p>
                <p className="text-sm text-muted-foreground leading-[1.7] flex-1">{plan.text}</p>
                <Button
                  onClick={ctaAction}
                  className={cn(
                    "w-full mt-7 gap-2 text-sm h-11 min-h-[44px] rounded-lg",
                    featured
                      ? "bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] font-semibold"
                      : "bg-transparent border border-border/60 text-muted-foreground hover:border-[hsl(var(--gold-oxide)/0.4)] hover:text-[hsl(var(--gold-oxide))]"
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
