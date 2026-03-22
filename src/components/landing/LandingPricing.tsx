/**
 * Pricing Section — Root2 pricing with 4 tiers.
 */
import { FadeInView } from "@/components/motion/PageTransition";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  { name: "Free", price: "$0", period: "forever", promise: "Test the system", text: "Get inside, explore, and see how AI-IDEI works before making a commitment.", cta: "Start Free", featured: false },
  { name: "Core", price: "$11", period: "/mo", promise: "Build clarity", text: "For people who want practical access to essentials for better copy, content, and execution.", cta: "Choose Core", featured: false },
  { name: "Pro", price: "$47", period: "/mo", promise: "Produce more", text: "Deeper access, advanced resources, and stronger leverage across copywriting and marketing.", cta: "Choose Pro", featured: true },
  { name: "Elite", price: "$137", period: "/mo", promise: "Full power", text: "For serious operators who want the most complete version and premium execution resources.", cta: "Choose Elite", featured: false },
];

interface Props {
  ctaAction: () => void;
}

export function LandingPricing({ ctaAction }: Props) {
  return (
    <section id="access" className="py-20 sm:py-28" aria-labelledby="pricing-heading">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">ACCESS</span>
          <h2 className="heading-2 mb-4">Choose the level that matches your ambition</h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto text-flow">
            Start simple. Upgrade when you want more depth, speed, and leverage.
          </p>
        </FadeInView>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <FadeInView
              key={plan.name}
              delay={i * 0.08}
              className={cn(
                "p-6 sm:p-8 flex flex-col relative",
                plan.featured
                  ? "bg-card ring-1 ring-[hsl(var(--gold-oxide)/0.4)]"
                  : "bg-card"
              )}
            >
              {plan.featured && (
                <span className="absolute top-3 right-3 text-xs font-mono tracking-[0.15em] text-[hsl(var(--gold-oxide))] border border-[hsl(var(--gold-oxide)/0.4)] px-2 py-0.5 rounded">POPULAR</span>
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
                  plan.featured
                    ? "bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))]"
                    : "bg-transparent border border-border text-muted-foreground hover:border-[hsl(var(--gold-oxide)/0.4)] hover:text-[hsl(var(--gold-oxide))]"
                )}
                size="sm"
              >
                {plan.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
