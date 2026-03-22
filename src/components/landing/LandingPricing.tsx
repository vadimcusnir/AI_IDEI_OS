/**
 * Pricing Section — Root2 pricing with 4 tiers.
 */
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

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
    <section id="access" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-16">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">ACCESS</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">Choose the level that matches your ambition</h2>
          <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mx-auto">
            Start simple. Upgrade when you want more depth, speed, and leverage.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[hsl(var(--ivory-dim)/0.06)] rounded-xl overflow-hidden max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              variants={fadeUp}
              className={cn(
                "p-6 sm:p-8 flex flex-col relative",
                plan.featured
                  ? "bg-[hsl(var(--obsidian-light))] ring-1 ring-[hsl(var(--gold-oxide)/0.3)]"
                  : "bg-[hsl(var(--obsidian-light)/0.3)]"
              )}
            >
              {plan.featured && (
                <span className="absolute top-3 right-3 text-[7px] font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] border border-[hsl(var(--gold-oxide)/0.3)] px-2 py-0.5 rounded">POPULAR</span>
              )}
              <h3 className="text-lg font-bold text-[hsl(var(--ivory)/0.9)]">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-2xl font-mono font-bold text-[hsl(var(--gold-oxide))]">{plan.price}</span>
                <span className="text-[10px] font-mono text-[hsl(var(--ivory-dim)/0.35)]">{plan.period}</span>
              </div>
              <p className="text-[10px] font-mono tracking-[0.1em] text-[hsl(var(--gold-oxide)/0.5)] mb-4">{plan.promise.toUpperCase()}</p>
              <p className="text-xs text-[hsl(var(--ivory-dim)/0.45)] leading-relaxed flex-1">{plan.text}</p>
              <Button
                onClick={ctaAction}
                className={cn(
                  "w-full mt-6 gap-2 text-xs h-10",
                  plan.featured
                    ? "bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))]"
                    : "bg-transparent border border-[hsl(var(--ivory-dim)/0.12)] text-[hsl(var(--ivory-dim)/0.6)] hover:border-[hsl(var(--gold-oxide)/0.3)] hover:text-[hsl(var(--gold-oxide))]"
                )}
                size="sm"
              >
                {plan.cta}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
