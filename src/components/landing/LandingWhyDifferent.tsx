/**
 * "Why Different" — asymmetric before/after layout with visual contrast.
 * Not a text wall. Uses 2-column comparison + blockquote.
 */
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const BEFORE = [
  "Blank page every time",
  "Random prompts, no system",
  "Scattered ideas, no structure",
  "Guessing what to write",
  "Output feels generic",
];

const AFTER = [
  "Start with proven frameworks",
  "Organized resources by goal",
  "Clear flow from idea to asset",
  "Direction before execution",
  "Output sounds like you, but sharper",
];

export function LandingWhyDifferent() {
  return (
    <section className="py-16 sm:py-28">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="mb-10 sm:mb-16">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">WHY DIFFERENT</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">
            Not another prompt pack. Not another content library.
          </h2>
        </motion.div>

        {/* Before / After — asymmetric 2-column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-xl overflow-hidden bg-[hsl(var(--ivory-dim)/0.06)] mb-12 sm:mb-16">
          {/* BEFORE */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
            className="bg-[hsl(var(--obsidian-light)/0.4)] p-6 sm:p-10"
          >
            <span className="text-[9px] font-mono tracking-[0.2em] text-[hsl(var(--ivory-dim)/0.35)] mb-6 block">WITHOUT A SYSTEM</span>
            <div className="space-y-3">
              {BEFORE.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1 w-1 rounded-full bg-[hsl(var(--ivory-dim)/0.2)] shrink-0" />
                  <span className="text-sm text-[hsl(var(--ivory-dim)/0.4)] line-through decoration-[hsl(var(--ivory-dim)/0.15)]">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AFTER */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
            className="bg-[hsl(var(--obsidian-light)/0.2)] p-6 sm:p-10 relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--gold-oxide)/0.03)] rounded-full blur-[60px]" />
            <span className="text-[9px] font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide)/0.6)] mb-6 block relative">WITH AI-IDEI</span>
            <div className="space-y-3 relative">
              {AFTER.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide)/0.5)] shrink-0" />
                  <span className="text-sm text-[hsl(var(--ivory)/0.8)] font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Central quote */}
        <motion.blockquote
          initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}
          className="max-w-3xl mx-auto text-center py-8 sm:py-12 border-y border-[hsl(var(--gold-oxide)/0.1)]"
        >
          <p className="text-[hsl(var(--ivory)/0.9)] font-serif font-bold text-lg sm:text-xl leading-snug mb-4">
            AI-IDEI is built around one goal: help you turn thought into execution.
          </p>
          <p className="text-xs text-[hsl(var(--ivory-dim)/0.4)] font-mono tracking-[0.1em]">
            LESS FRICTION · STRONGER COPY · FASTER RESULTS
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
}
