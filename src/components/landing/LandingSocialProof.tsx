import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const TESTIMONIALS = [
  {
    text: "AI-IDEI helped me turn scattered thoughts into clearer copy and a much stronger offer.",
    name: "M.R.",
    role: "Marketing Consultant",
  },
  {
    text: "This feels less like a resource library and more like an execution system for marketing.",
    name: "A.P.",
    role: "Content Creator",
  },
  {
    text: "I used it to move faster, write better, and structure my ideas in a way that actually led to usable output.",
    name: "D.C.",
    role: "Freelance Strategist",
  },
];

export function LandingSocialProof() {
  return (
    <section className="py-16 sm:py-28">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-12 sm:mb-16">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">PROOF</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">Built for people who want sharper thinking and stronger execution</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              variants={fadeUp}
              className="relative p-6 sm:p-8 rounded-xl border border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian-light)/0.2)] landing-card"
            >
              <span className="absolute top-3 left-5 text-3xl font-serif text-[hsl(var(--gold-oxide)/0.15)] leading-none select-none">"</span>
              <blockquote className="text-sm text-[hsl(var(--ivory)/0.75)] leading-relaxed mb-5 sm:mb-6 pt-4 italic">
                {t.text}
              </blockquote>
              <div className="border-t border-[hsl(var(--ivory-dim)/0.06)] pt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--gold-oxide)/0.1)] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-mono font-bold text-[hsl(var(--gold-oxide)/0.6)]">{t.name}</span>
                </div>
                <p className="text-[10px] font-mono text-[hsl(var(--ivory-dim)/0.4)]">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
