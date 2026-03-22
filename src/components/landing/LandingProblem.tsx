import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function LandingProblem() {
  return (
    <section className="py-20 sm:py-28 md:py-32">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* BEFORE */}
            <div>
              <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--signal-red)/0.6)] mb-4 block">BEFORE</span>
              <h2 className="heading-2 text-[hsl(var(--ivory))] mb-6">
                Most people do not struggle with ideas. They struggle with turning ideas into assets.
              </h2>
              <div className="space-y-4 text-sm text-[hsl(var(--ivory-dim)/0.6)] leading-relaxed">
                <p>You have thoughts. Notes. Drafts. Angles. Offers. Half-built campaigns. Fragments of good copy.</p>
                <p className="font-semibold text-[hsl(var(--ivory)/0.9)]">But the real bottleneck is not creativity. It is execution.</p>
                <div className="pl-4 border-l border-[hsl(var(--signal-red)/0.2)] space-y-1 text-xs text-[hsl(var(--ivory-dim)/0.4)]">
                  <p>You open ChatGPT. You test random prompts.</p>
                  <p>You save interesting things. You try to write.</p>
                  <p>You restart. You overthink. You lose momentum.</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {["too many ideas", "weak positioning", "slow writing", "unclear offers", "inconsistent content", "scattered execution"].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-[hsl(var(--ivory-dim)/0.45)]">
                    <div className="h-1 w-1 rounded-full bg-[hsl(var(--signal-red)/0.5)] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER */}
            <div className="relative">
              <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.7)] mb-4 block">AFTER</span>
              <h2 className="heading-2 text-[hsl(var(--ivory))] mb-6">
                AI-IDEI closes that gap.
              </h2>
              <div className="space-y-4 text-sm text-[hsl(var(--ivory-dim)/0.6)] leading-relaxed">
                <p>It helps you turn raw thinking into usable copy, structured content, stronger messaging, and faster marketing output.</p>
                <p>Instead of guessing what to write, how to structure it, how to phrase it, or how to package it — you use a system that helps you move faster and think better.</p>
              </div>
              <div className="mt-8 space-y-3">
                {["write faster", "sharpen your message", "build stronger offers", "create more content from one idea", "turn scattered thinking into commercial assets"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-[hsl(var(--ivory)/0.85)]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide)/0.7)] shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[80px]" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
