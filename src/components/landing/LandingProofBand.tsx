/**
 * Proof Band — animated stat counters.
 */
import { motion } from "framer-motion";

const STATS = [
  { value: "50+", label: "Deliverables per upload" },
  { value: "12", label: "Output families" },
  { value: "∞", label: "Knowledge reuse" },
  { value: "<2min", label: "Idea to asset" },
];

export function LandingProofBand() {
  return (
    <section className="border-y border-[hsl(var(--ivory-dim)/0.06)] py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl font-mono font-bold text-[hsl(var(--gold-oxide))]">{stat.value}</p>
              <p className="text-[8px] sm:text-[9px] font-mono tracking-[0.15em] text-[hsl(var(--ivory-dim)/0.4)] mt-2">{stat.label.toUpperCase()}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
