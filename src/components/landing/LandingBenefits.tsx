import { motion } from "framer-motion";
import { Target, Zap, MessageSquare, Settings } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const BENEFITS = [
  {
    icon: Target,
    title: "You stop wasting time on blank starts",
    text: "You get structure, direction, and ready-to-use resources that make starting dramatically easier.",
  },
  {
    icon: Zap,
    title: "You write faster without lowering quality",
    text: "Instead of improvising every time, you use reusable systems that improve speed and consistency.",
  },
  {
    icon: MessageSquare,
    title: "Your offers become easier to explain and sell",
    text: "Better wording creates better positioning. Better positioning creates stronger conversion.",
  },
  {
    icon: Settings,
    title: "You turn AI into a real working advantage",
    text: "Not random prompting. Not chaotic experimentation. A more intentional, more useful, more profitable way to work.",
  },
];

export function LandingBenefits() {
  return (
    <section className="py-20 sm:py-28 border-y border-[hsl(var(--ivory-dim)/0.06)]">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="mb-16">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">WHAT CHANGES</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">What changes when you use AI-IDEI</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              variants={fadeUp}
              className="relative p-8 rounded-xl border border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian-light)/0.3)] hover:border-[hsl(var(--gold-oxide)/0.12)] transition-colors group"
            >
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.15)] transition-colors">
                  <b.icon className="h-5 w-5 text-[hsl(var(--gold-oxide)/0.6)] group-hover:text-[hsl(var(--gold-oxide))] transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[hsl(var(--ivory)/0.9)] mb-2">{b.title}</h3>
                  <p className="text-xs text-[hsl(var(--ivory-dim)/0.5)] leading-relaxed">{b.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
