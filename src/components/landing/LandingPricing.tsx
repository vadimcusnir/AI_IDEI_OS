import { useState } from "react";
import { FadeInView } from "@/components/motion/PageTransition";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

const FEATURED_INDEX = 2; // Pro plan

interface Props {
  ctaAction: () => void;
  /** When true, only show Free + Pro (compact for /home). Default false = full grid. */
  compact?: boolean;
}

export function LandingPricing({ ctaAction, compact = false }: Props) {
  const { t } = useTranslation("landing");
  const [interval, setInterval] = useState<"month" | "year">("month");

  const allPlans = t("pricing.plans", { returnObjects: true }) as Array<{
    name: string; price: string; priceAnnual?: string; period: string; promise: string; text: string; cta: string;
  }>;
  // Compact: Free (idx 0) + Pro (idx 2). Full: all 4.
  const plans = compact ? [allPlans[0], allPlans[2]].filter(Boolean) : allPlans;
  const featuredIndex = compact ? 1 : FEATURED_INDEX;

  return (
    <section id="access" className="py-32 sm:py-44" aria-labelledby="pricing-heading">
      <ContentBoundary width="default">
        <FadeInView className="text-center mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("pricing.label")}</span>
          <h2 id="pricing-heading" className="text-h2 text-foreground mb-6">{t("pricing.title")}</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto leading-relaxed">{t("pricing.subtitle")}</p>
        </FadeInView>

        {/* Billing toggle */}
        <FadeInView className="flex items-center justify-center gap-1 p-1 bg-muted/50 rounded-lg w-fit mx-auto mb-12">
          <button
            onClick={() => setInterval("month")}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-mono font-medium transition-all",
              interval === "month"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Lunar
          </button>
          <button
            onClick={() => setInterval("year")}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-mono font-medium transition-all flex items-center gap-2",
              interval === "year"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anual
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold">
              -18%
            </span>
          </button>
        </FadeInView>

        <div className={cn(
          "grid grid-cols-1 gap-px bg-border/50 rounded-xl overflow-hidden mx-auto",
          compact ? "md:grid-cols-2 max-w-2xl" : "md:grid-cols-2 lg:grid-cols-4 max-w-4xl"
        )}>
          {plans.map((plan, i) => {
            const featured = i === featuredIndex;
            const displayPrice = interval === "year" && plan.priceAnnual
              ? plan.priceAnnual
              : plan.price;
            const displayPeriod = interval === "year" ? "/an" : plan.period;

            return (
              <FadeInView
                key={i}
                delay={i * 0.1}
                className={cn(
                  "p-6 sm:p-8 flex flex-col relative group landing-card",
                  featured ? "bg-card ring-1 ring-gold/30" : "bg-card"
                )}
              >
                {featured && (
                  <span className="absolute top-4 right-4 text-eyebrow font-mono tracking-[0.2em] text-gold border border-gold/25 px-2.5 py-1 rounded-md">{t("pricing.popular")}</span>
                )}
                <h3 className="text-h4 text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mt-4 mb-2">
                  <span className="text-3xl font-mono font-bold text-gold tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">{displayPrice}</span>
                  <span className="text-caption font-mono text-muted-foreground">{displayPeriod}</span>
                </div>
                {interval === "year" && (
                  <p className="text-eyebrow font-mono tracking-[0.15em] text-gold-dim mb-2">Economisești ~18%</p>
                )}
                <p className="text-eyebrow font-mono tracking-[0.15em] text-gold-dim mb-6">{plan.promise}</p>
                <p className="text-caption text-muted-foreground leading-relaxed flex-1">{plan.text}</p>
                <Button
                  onClick={ctaAction}
                  className={cn(
                    "cta-canon w-full mt-8 gap-2 text-sm rounded-lg transition-all duration-200",
                    featured
                      ? "cta-glow bg-gold hover:bg-gold-dim text-obsidian font-semibold shadow-md shadow-gold/15"
                      : "bg-transparent border border-border/50 text-muted-foreground hover:border-gold/35 hover:text-gold"
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
        {compact && (
          <div className="text-center mt-8">
            <a
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold underline underline-offset-4 decoration-gold/30 hover:decoration-gold transition-colors duration-200"
            >
              See all plans
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </ContentBoundary>
    </section>
  );
}
