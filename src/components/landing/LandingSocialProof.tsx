import { FadeInView } from "@/components/motion/PageTransition";

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
        <FadeInView className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">PROOF</span>
          <h2 className="heading-2 mb-4">Built for people who want sharper thinking and stronger execution</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeInView
              key={i}
              delay={i * 0.08}
              className="relative p-6 sm:p-8 rounded-xl border border-border bg-card landing-card"
            >
              <span className="absolute top-3 left-5 text-3xl text-[hsl(var(--gold-oxide)/0.25)] leading-none select-none">"</span>
              <blockquote className="text-sm text-foreground leading-relaxed mb-5 sm:mb-6 pt-4 italic text-flow">
                {t.text}
              </blockquote>
              <div className="border-t border-border pt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--gold-oxide)/0.12)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-mono font-bold text-[hsl(var(--gold-oxide))]">{t.name}</span>
                </div>
                <p className="text-sm font-mono text-muted-foreground">{t.role}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
