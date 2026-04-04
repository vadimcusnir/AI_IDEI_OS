/**
 * Transformation Diagram — interactive visual flow.
 * Input → Process → Outputs with hover states.
 */
import { motion } from "framer-motion";
import { useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

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
  const reduced = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: reduced ? 0 : 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: reduced ? 0 : 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
  };

  return (
    <section className="py-24 sm:py-40 border-y border-border/40">
      <ContentBoundary width="default">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.35em] text-[hsl(var(--gold-oxide))] mb-6 block">TRANSFORMATION</span>
          <h2 className="text-h2 text-foreground mb-6">From rough thought to finished asset</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto leading-relaxed">
            See how one idea moves through the system and becomes multiple usable outputs.
          </p>
        </motion.div>

        {/* 3-column flow */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1.5fr] gap-6 lg:gap-0 items-start">
          {/* INPUTS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
            <span className="text-eyebrow font-mono tracking-[0.25em] text-muted-foreground mb-6 block">INPUT</span>
            <div className="space-y-3">
              {INPUTS.map((input) => (
                <div
                  key={input.label}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/40 bg-card/50 hover:border-[hsl(var(--gold-oxide)/0.2)] hover:bg-accent/5 transition-all duration-200 cursor-default landing-card min-h-[44px]"
                  onMouseEnter={() => setActiveStep(0)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <span className="text-sm">{input.icon}</span>
                  <span className="text-caption text-foreground font-medium">{input.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Arrow 1 */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp} className="hidden lg:flex items-center justify-center px-6 pt-12">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-16 h-px transition-all duration-300 ${activeStep !== null ? 'bg-[hsl(var(--gold-oxide)/0.5)] w-20' : 'bg-border/25'}`} />
              <span className="text-footnote font-mono text-[hsl(var(--gold-oxide)/0.6)]">→</span>
            </div>
          </motion.div>

          {/* PROCESS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}>
            <span className="text-eyebrow font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide))] mb-6 block">PROCESS</span>
            <div className="space-y-3">
              {PROCESSES.map((proc) => (
                <div
                  key={proc.label}
                  className="p-4 rounded-lg border border-[hsl(var(--gold-oxide)/0.07)] bg-card/50 hover:border-[hsl(var(--gold-oxide)/0.22)] hover:bg-accent/5 transition-all duration-200 cursor-default group landing-card min-h-[44px]"
                  onMouseEnter={() => setActiveStep(1)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <p className="text-caption font-bold text-foreground mb-1">{proc.label}</p>
                  <p className="text-footnote sm:text-caption text-muted-foreground">{proc.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Arrow 2 */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeUp} className="hidden lg:flex items-center justify-center px-6 pt-12">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-16 h-px transition-all duration-300 ${activeStep !== null ? 'bg-[hsl(var(--gold-oxide)/0.5)] w-20' : 'bg-border/25'}`} />
              <span className="text-footnote font-mono text-[hsl(var(--gold-oxide)/0.6)]">→</span>
            </div>
          </motion.div>

          {/* OUTPUTS */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={4} variants={fadeUp}>
            <span className="text-eyebrow font-mono tracking-[0.25em] text-muted-foreground mb-6 block">OUTPUT</span>
            <div className="grid grid-cols-2 gap-3">
              {OUTPUTS.map((output) => (
                <div
                  key={output.label}
                  className="p-3 rounded-lg border border-border/40 bg-card/50 hover:border-[hsl(var(--gold-oxide)/0.2)] hover:bg-accent/5 transition-all duration-200 cursor-default landing-card min-h-[44px]"
                  onMouseEnter={() => setActiveStep(2)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <p className="text-footnote sm:text-caption font-medium text-foreground">{output.label}</p>
                  <p className="text-eyebrow font-mono text-[hsl(var(--gold-oxide))] mt-1">{output.family}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile flow label */}
        <div className="flex lg:hidden justify-center my-8">
          <div className="flex items-center gap-4 text-[hsl(var(--gold-oxide))]">
            <span className="text-eyebrow font-mono tracking-wider">INPUT</span>
            <span className="text-footnote">→</span>
            <span className="text-eyebrow font-mono tracking-wider">PROCESS</span>
            <span className="text-footnote">→</span>
            <span className="text-eyebrow font-mono tracking-wider">OUTPUT</span>
          </div>
        </div>
      </ContentBoundary>
    </section>
  );
}
