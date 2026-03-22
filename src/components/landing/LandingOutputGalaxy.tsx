/**
 * Output Galaxy Section — wraps the orbital visualization.
 */
import { motion } from "framer-motion";
import { OutputGalaxy } from "./OutputGalaxy";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function LandingOutputGalaxy() {
  return (
    <section id="outputs" className="py-20 sm:py-28 border-y border-border relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--gold-oxide)/0.02)] to-transparent" />
      <div className="relative max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-8">
          <span className="text-xs font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide))] mb-4 block">OUTPUT UNIVERSE</span>
          <h2 className="heading-2 mb-4">One idea can become much more than one output</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto text-flow">
            Content, education, sales, knowledge, assistants — organized into asset families.
          </p>
        </motion.div>
        <OutputGalaxy />
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-8 text-xs font-mono tracking-[0.1em] text-[hsl(var(--gold-oxide))]">
          AI-IDEI helps you create faster, clearer, and with more commercial intent.
        </motion.p>
      </div>
    </section>
  );
}
