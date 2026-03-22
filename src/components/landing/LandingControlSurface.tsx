/**
 * Control Surface — parameter control cards.
 */
import { motion } from "framer-motion";
import { IconControl } from "./ProprietaryIcons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const CONTROLS = [
  { label: "Tone", desc: "Professional, casual, authoritative" },
  { label: "Language", desc: "EN, RO, RU, and expanding" },
  { label: "Format", desc: "Post, email, page, script, thread" },
  { label: "Objective", desc: "Sell, educate, attract, convert" },
  { label: "Depth", desc: "Quick draft to deep analysis" },
  { label: "Audience", desc: "B2B, B2C, niche, broad" },
];

export function LandingControlSurface() {
  return (
    <section id="control" className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-16">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">CONTROL LAYER</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">You control the output. Not the other way around.</h2>
          <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mx-auto">
            Set tone, language, format, objective, depth, and audience for every execution.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CONTROLS.map((ctrl, i) => (
            <motion.div
              key={ctrl.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="p-4 sm:p-5 rounded-lg border border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian-light)/0.3)] hover:border-[hsl(var(--gold-oxide)/0.15)] transition-colors group flex items-start gap-4 sm:block landing-card"
            >
              <IconControl className="text-[hsl(var(--gold-oxide)/0.4)] mb-0 sm:mb-3 mt-0.5 sm:mt-0 shrink-0 group-hover:text-[hsl(var(--gold-oxide)/0.7)] transition-colors" size={18} />
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--ivory)/0.85)] mb-0.5 sm:mb-1">{ctrl.label}</p>
                <p className="text-[10px] text-[hsl(var(--ivory-dim)/0.4)]">{ctrl.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
