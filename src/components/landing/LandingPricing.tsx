import { FadeInView } from "@/components/motion/PageTransition";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

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
    <section id="access" className="py-32 sm:py-44" aria-labelledby="pricing-heading">
      <ContentBoundary width="default">
        <FadeInView className="text-center mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-[hsl(var(--gold-oxide))] mb-6 block">{t("pricing.label")}</span>
          <h2 id="pricing-heading" className="text-h2 text-foreground mb-6">{t("pricing.title")}</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto leading-relaxed">{t("pricing.subtitle")}</p>
        </FadeInView>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 rounded-xl overflow-hidden max-w-4xl mx-auto">
          {plans.map((plan, i) => {
            const featured = i === FEATURED_INDEX;
            return (
              <FadeInView
                key={i}
                delay={i * 0.1}
                className={cn(
                  "p-6 sm:p-8 flex flex-col relative group landing-card",
                  featured ? "bg-card ring-1 ring-[hsl(var(--gold-oxide)/0.3)]" : "bg-card"
                )}
              >
                {featured && (
                  <span className="absolute top-4 right-4 text-eyebrow font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] border border-[hsl(var(--gold-oxide)/0.25)] px-2.5 py-1 rounded-md">{t("pricing.popular")}</span>
                )}
                <h3 className="text-h4 text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mt-4 mb-2">
                  <span className="text-3xl font-mono font-bold text-[hsl(var(--gold-oxide))] tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">{plan.price}</span>
                  <span className="text-caption font-mono text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-eyebrow font-mono tracking-[0.15em] text-[hsl(var(--gold-dim))] mb-6">{plan.promise}</p>
                <p className="text-caption text-muted-foreground leading-relaxed flex-1">{plan.text}</p>
                <Button
                  onClick={ctaAction}
                  className={cn(
                    "cta-canon w-full mt-8 gap-2 text-sm rounded-lg transition-all duration-200",
                    featured
                      ? "cta-glow bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] font-semibold shadow-md shadow-[hsl(var(--gold-oxide)/0.15)]"
                      : "bg-transparent border border-border/50 text-muted-foreground hover:border-[hsl(var(--gold-oxide)/0.35)] hover:text-[hsl(var(--gold-oxide))]"
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
      </ContentBoundary>
    </section>
  );
}
