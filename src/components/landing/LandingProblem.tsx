import { FadeInView } from "@/components/motion/PageTransition";

export function LandingProblem() {
  return (
    <section className="py-16 sm:py-28 md:py-32">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* BEFORE */}
            <div>
              <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--signal-red))] mb-4 block">BEFORE</span>
              <h2 className="heading-2 mb-5 sm:mb-6">
                Most people do not struggle with ideas. They struggle with turning ideas into assets.
              </h2>
              <div className="space-y-3 sm:space-y-4 text-base text-muted-foreground leading-relaxed text-flow">
                <p>You have thoughts. Notes. Drafts. Angles. Offers. Half-built campaigns. Fragments of good copy.</p>
                <p className="font-semibold text-foreground">But the real bottleneck is not creativity. It is execution.</p>
                <div className="pl-4 border-l-2 border-[hsl(var(--signal-red)/0.3)] space-y-1.5 text-sm text-muted-foreground py-1">
                  <p>You open ChatGPT. You test random prompts.</p>
                  <p>You save interesting things. You try to write.</p>
                  <p>You restart. You overthink. You lose momentum.</p>
                </div>
              </div>
              <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2.5 sm:gap-3">
                {["too many ideas", "weak positioning", "slow writing", "unclear offers", "inconsistent content", "scattered execution"].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal-red)/0.5)] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER */}
            <div className="relative">
              <div className="gold-divider mb-8 lg:hidden" />
              <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">AFTER</span>
              <h2 className="heading-2 mb-5 sm:mb-6">
                AI-IDEI closes that gap.
              </h2>
              <div className="space-y-3 sm:space-y-4 text-base text-muted-foreground leading-relaxed text-flow">
                <p>It helps you turn raw thinking into usable copy, structured content, stronger messaging, and faster marketing output.</p>
                <p>Instead of guessing what to write, how to structure it, how to phrase it, or how to package it — you use a system that helps you move faster and think better.</p>
              </div>
              <div className="mt-6 sm:mt-8 space-y-3">
                {["write faster", "sharpen your message", "build stronger offers", "create more content from one idea", "turn scattered thinking into commercial assets"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-base text-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide))] shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[80px] hidden lg:block" />
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
