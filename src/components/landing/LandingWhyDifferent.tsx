/**
 * "Why Different" — before/after comparison + blockquote.
 */
import { FadeInView } from "@/components/motion/PageTransition";

const BEFORE = [
  "Blank page every time",
  "Random prompts, no system",
  "Scattered ideas, no structure",
  "Guessing what to write",
  "Output feels generic",
];

const AFTER = [
  "Start with proven frameworks",
  "Organized resources by goal",
  "Clear flow from idea to asset",
  "Direction before execution",
  "Output sounds like you, but sharper",
];

export function LandingWhyDifferent() {
  return (
    <section className="py-16 sm:py-28">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-10 sm:mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide)/0.7)] mb-4 block">WHY DIFFERENT</span>
          <h2 className="heading-2 mb-4">
            Not another prompt pack. Not another content library.
          </h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-xl overflow-hidden bg-border mb-12 sm:mb-16">
          <FadeInView className="bg-card p-6 sm:p-10">
            <span className="text-xs font-mono tracking-[0.15em] text-muted-foreground mb-6 block">WITHOUT A SYSTEM</span>
            <div className="space-y-3">
              {BEFORE.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/30">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>

          <FadeInView delay={0.1} className="bg-card relative p-6 sm:p-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[60px]" />
            <span className="text-xs font-mono tracking-[0.15em] text-[hsl(var(--gold-oxide)/0.7)] mb-6 block relative">WITH AI-IDEI</span>
            <div className="space-y-3 relative">
              {AFTER.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide)/0.6)] shrink-0" />
                  <span className="text-sm text-foreground/85 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>

        <FadeInView className="max-w-3xl mx-auto text-center py-8 sm:py-12 border-y border-[hsl(var(--gold-oxide)/0.12)]">
          <p className="text-foreground font-serif font-bold text-lg sm:text-xl leading-snug mb-4">
            AI-IDEI is built around one goal: help you turn thought into execution.
          </p>
          <p className="text-sm text-muted-foreground font-mono tracking-[0.1em]">
            LESS FRICTION · STRONGER COPY · FASTER RESULTS
          </p>
        </FadeInView>
      </div>
    </section>
  );
}
