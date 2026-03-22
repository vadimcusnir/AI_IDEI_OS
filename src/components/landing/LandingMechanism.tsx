import { motion } from "framer-motion";
import { IconExtract, IconFramework, IconOutput, IconMultiply } from "./ProprietaryIcons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const STEPS = [
  { num: "01", title: "Choose the problem", text: "Start with what you need: copy, content, positioning, offer clarity, or execution support.", icon: IconExtract },
  { num: "02", title: "Use the right resource", text: "Pick a framework, prompt, assistant, or example designed for that exact type of work.", icon: IconFramework },
  { num: "03", title: "Turn it into an asset", text: "Produce something usable: a post, email, landing page, offer, script, or campaign asset.", icon: IconOutput },
  { num: "04", title: "Repeat with speed", text: "Stop improvising. Start producing with clarity, consistency, and momentum.", icon: IconMultiply },
];

const TRANSFORMS = [
  { from: "A rough thought", to: "a social post that communicates value" },
  { from: "A messy service", to: "a clearer offer with stronger positioning" },
  { from: "A long transcript", to: "a newsletter, article, thread, and email sequence" },
  { from: "Scattered notes", to: "a content plan, product outline, or conversion asset" },
];

export function LandingMechanism() {
  return (
    <section id="mechanism" className="py-20 sm:py-28 border-y border-[hsl(var(--ivory-dim)/0.06)]">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-16">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">THE MECHANISM</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">One idea becomes many assets</h2>
          <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mx-auto">
            With the right system, a single idea stops being a thought and starts becoming leverage.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[hsl(var(--ivory-dim)/0.06)] rounded-xl overflow-hidden mb-16">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              variants={fadeUp}
              className="bg-[hsl(var(--obsidian-light)/0.5)] p-6 sm:p-8 group hover:bg-[hsl(var(--obsidian-light)/0.8)] transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-mono font-bold text-[hsl(var(--gold-oxide)/0.12)] group-hover:text-[hsl(var(--gold-oxide)/0.25)] transition-colors">{step.num}</span>
                <step.icon className="text-[hsl(var(--gold-oxide)/0.5)]" size={20} />
              </div>
              <h3 className="text-sm font-semibold text-[hsl(var(--ivory)/0.9)] mb-2">{step.title}</h3>
              <p className="text-xs text-[hsl(var(--ivory-dim)/0.45)] leading-relaxed">{step.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-2">
          {TRANSFORMS.map((t, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-[hsl(var(--ivory-dim)/0.03)] transition-colors"
            >
              <span className="text-xs font-mono text-[hsl(var(--ivory-dim)/0.4)] min-w-[140px] sm:min-w-[180px]">{t.from}</span>
              <span className="text-[hsl(var(--gold-oxide)/0.6)] font-mono text-xs">→</span>
              <span className="text-xs text-[hsl(var(--ivory)/0.7)]">{t.to}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
