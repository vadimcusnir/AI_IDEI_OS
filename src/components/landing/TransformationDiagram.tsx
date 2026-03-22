/**
 * Transformation Diagram — interactive visual flow.
 * Input → Process → Outputs with hover states.
 */
import { motion } from "framer-motion";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const INPUTS = [
  { label: "Rough idea", icon: "💭" },
  { label: "Voice note", icon: "🎙" },
  { label: "Draft copy", icon: "📝" },
  { label: "Client brief", icon: "📋" },
];

const PROCESSES = [
  { label: "Structure", desc: "Find the framework" },
  { label: "Sharpen", desc: "Refine the angle" },
  { label: "Expand", desc: "Generate variations" },
  { label: "Format", desc: "Package for output" },
];

const OUTPUTS = [
  { label: "Social post", family: "Content" },
  { label: "Email sequence", family: "Sales" },
  { label: "Landing copy", family: "Sales" },
  { label: "Article", family: "Content" },
  { label: "Offer page", family: "Sales" },
  { label: "Script", family: "Content" },
  { label: "Thread", family: "Content" },
  { label: "Ad copy", family: "Sales" },
];

export function TransformationDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-28 border-y border-[hsl(var(--ivory-dim)/0.06)]">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-12 sm:mb-16">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">TRANSFORMATION</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">From rough thought to finished asset</h2>
          <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mx-auto">
            See how one idea moves through the system and becomes multiple usable outputs.
          </p>
        </motion.div>

        {/* 3-column flow: Input → Process → Output */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1.5fr] gap-6 lg:gap-0 items-start">
          {/* INPUTS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
            <span className="text-[8px] font-mono tracking-[0.2em] text-[hsl(var(--ivory-dim)/0.35)] mb-4 block">INPUT</span>
            <div className="space-y-2">
              {INPUTS.map((input, i) => (
                <div
                  key={input.label}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian-light)/0.2)] hover:border-[hsl(var(--gold-oxide)/0.12)] transition-all cursor-default landing-card"
                  onMouseEnter={() => setActiveStep(0)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <span className="text-sm">{input.icon}</span>
                  <span className="text-xs text-[hsl(var(--ivory)/0.7)]">{input.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Arrow 1 */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp} className="hidden lg:flex items-center justify-center px-4 pt-8">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-px transition-colors duration-300 ${activeStep !== null ? 'bg-[hsl(var(--gold-oxide)/0.5)]' : 'bg-[hsl(var(--ivory-dim)/0.12)]'}`} />
              <span className="text-[7px] font-mono text-[hsl(var(--gold-oxide)/0.4)]">→</span>
            </div>
          </motion.div>

          {/* PROCESS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}>
            <span className="text-[8px] font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide)/0.5)] mb-4 block">PROCESS</span>
            <div className="space-y-2">
              {PROCESSES.map((proc, i) => (
                <div
                  key={proc.label}
                  className="p-3 rounded-lg border border-[hsl(var(--gold-oxide)/0.08)] bg-[hsl(var(--obsidian-light)/0.3)] hover:border-[hsl(var(--gold-oxide)/0.2)] transition-all cursor-default group landing-card"
                  onMouseEnter={() => setActiveStep(1)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <p className="text-xs font-semibold text-[hsl(var(--ivory)/0.85)] mb-0.5">{proc.label}</p>
                  <p className="text-[10px] text-[hsl(var(--ivory-dim)/0.4)]">{proc.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Arrow 2 */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeUp} className="hidden lg:flex items-center justify-center px-4 pt-8">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-px transition-colors duration-300 ${activeStep !== null ? 'bg-[hsl(var(--gold-oxide)/0.5)]' : 'bg-[hsl(var(--ivory-dim)/0.12)]'}`} />
              <span className="text-[7px] font-mono text-[hsl(var(--gold-oxide)/0.4)]">→</span>
            </div>
          </motion.div>

          {/* OUTPUTS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={4} variants={fadeUp}>
            <span className="text-[8px] font-mono tracking-[0.2em] text-[hsl(var(--ivory-dim)/0.35)] mb-4 block">OUTPUT</span>
            <div className="grid grid-cols-2 gap-2">
              {OUTPUTS.map((output) => (
                <div
                  key={output.label}
                  className="p-2.5 rounded-lg border border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian-light)/0.2)] hover:border-[hsl(var(--gold-oxide)/0.15)] transition-all cursor-default landing-card"
                  onMouseEnter={() => setActiveStep(2)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <p className="text-[10px] font-medium text-[hsl(var(--ivory)/0.8)]">{output.label}</p>
                  <p className="text-[8px] font-mono text-[hsl(var(--gold-oxide)/0.4)] mt-0.5">{output.family}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile flow arrows */}
        <div className="flex lg:hidden justify-center my-4">
          <div className="flex items-center gap-2 text-[hsl(var(--gold-oxide)/0.4)]">
            <span className="text-[9px] font-mono">INPUT</span>
            <span>→</span>
            <span className="text-[9px] font-mono">PROCESS</span>
            <span>→</span>
            <span className="text-[9px] font-mono">OUTPUT</span>
          </div>
        </div>
      </div>
    </section>
  );
}
