/**
 * Final CTA — compact, tensioned, clear.
 */
import { motion } from "framer-motion";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

interface Props {
  ctaAction: () => void;
}

export function LandingFinalCTA({ ctaAction }: Props) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[hsl(var(--gold-oxide)/0.05)] rounded-full blur-[180px]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-5">
            Stop collecting ideas.
            <br />
            <span className="text-[hsl(var(--gold-oxide))]">Start turning them into assets.</span>
          </h2>
          <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] mb-12 max-w-lg mx-auto leading-relaxed">
            Use AI-IDEI to write faster, market better, and turn rough thinking into persuasive output.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
            <Button size="lg" onClick={ctaAction} className="gap-2 px-10 h-12 sm:h-14 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))] font-semibold shadow-lg shadow-[hsl(var(--gold-oxide)/0.15)] w-full sm:w-auto">
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 h-12 sm:h-14 w-full sm:w-auto border-[hsl(var(--ivory-dim)/0.15)] text-[hsl(var(--ivory-dim)/0.7)] hover:bg-[hsl(var(--ivory-dim)/0.05)]">
              <Eye className="h-4 w-4" />
              See What's Inside
            </Button>
          </div>
          <p className="text-[10px] font-mono tracking-[0.15em] text-[hsl(var(--ivory-dim)/0.3)]">
            LESS FRICTION · BETTER COPY · STRONGER EXECUTION
          </p>
        </motion.div>
      </div>
    </section>
  );
}
