import { FadeInView } from "@/components/motion/PageTransition";
import { Target, Zap, MessageSquare, Settings } from "lucide-react";

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
    <section className="py-16 sm:py-28 border-y border-border">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-10 sm:mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">WHAT CHANGES</span>
          <h2 className="heading-2 mb-4">What changes when you use AI-IDEI</h2>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {BENEFITS.map((b, i) => (
            <FadeInView
              key={b.title}
              delay={i * 0.08}
              className="relative p-6 sm:p-8 rounded-xl border border-border bg-card hover:border-[hsl(var(--gold-oxide)/0.2)] landing-card group"
            >
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--gold-oxide)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.18)] transition-colors">
                  <b.icon className="h-5 w-5 text-[hsl(var(--gold-oxide))] transition-colors" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
