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
    <section className="py-20 sm:py-32 border-y border-border/40">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-14 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">TRANSFORMATION</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">From rough thought to finished asset</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-[1.7]">
            See how one idea moves through the system and becomes multiple usable outputs.
          </p>
        </motion.div>

        {/* 3-column flow */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1.5fr] gap-6 lg:gap-0 items-start">
          {/* INPUTS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-5 block">INPUT</span>
            <div className="space-y-2.5">
              {INPUTS.map((input) => (
                <div
                  key={input.label}
                  className="flex items-center gap-3.5 p-3.5 rounded-lg border border-border/40 bg-card/50 hover:border-[hsl(var(--gold-oxide)/0.15)] transition-all cursor-default landing-card"
                  onMouseEnter={() => setActiveStep(0)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <span className="text-sm">{input.icon}</span>
                  <span className="text-sm text-foreground font-medium">{input.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Arrow 1 */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp} className="hidden lg:flex items-center justify-center px-5 pt-10">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-14 h-px transition-colors duration-300 ${activeStep !== null ? 'bg-[hsl(var(--gold-oxide)/0.5)]' : 'bg-border/30'}`} />
              <span className="text-xs font-mono text-[hsl(var(--gold-oxide))]">→</span>
            </div>
          </motion.div>

          {/* PROCESS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}>
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">PROCESS</span>
            <div className="space-y-2.5">
              {PROCESSES.map((proc) => (
                <div
                  key={proc.label}
                  className="p-3.5 rounded-lg border border-[hsl(var(--gold-oxide)/0.08)] bg-card/50 hover:border-[hsl(var(--gold-oxide)/0.2)] transition-all cursor-default group landing-card"
                  onMouseEnter={() => setActiveStep(1)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <p className="text-sm font-bold text-foreground mb-0.5">{proc.label}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{proc.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Arrow 2 */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeUp} className="hidden lg:flex items-center justify-center px-5 pt-10">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-14 h-px transition-colors duration-300 ${activeStep !== null ? 'bg-[hsl(var(--gold-oxide)/0.5)]' : 'bg-border/30'}`} />
              <span className="text-xs font-mono text-[hsl(var(--gold-oxide))]">→</span>
            </div>
          </motion.div>

          {/* OUTPUTS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={4} variants={fadeUp}>
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-5 block">OUTPUT</span>
            <div className="grid grid-cols-2 gap-2.5">
              {OUTPUTS.map((output) => (
                <div
                  key={output.label}
                  className="p-3 rounded-lg border border-border/40 bg-card/50 hover:border-[hsl(var(--gold-oxide)/0.15)] transition-all cursor-default landing-card"
                  onMouseEnter={() => setActiveStep(2)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <p className="text-xs sm:text-sm font-medium text-foreground">{output.label}</p>
                  <p className="text-[11px] font-mono text-[hsl(var(--gold-oxide))] mt-0.5">{output.family}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile flow label */}
        <div className="flex lg:hidden justify-center my-6">
          <div className="flex items-center gap-3 text-[hsl(var(--gold-oxide))]">
            <span className="text-[11px] font-mono tracking-wider uppercase">INPUT</span>
            <span className="text-xs">→</span>
            <span className="text-[11px] font-mono tracking-wider uppercase">PROCESS</span>
            <span className="text-xs">→</span>
            <span className="text-[11px] font-mono tracking-wider uppercase">OUTPUT</span>
          </div>
        </div>
      </div>
    </section>
  );
}
