/**
 * Control Surface — parameter control cards.
 */
import { FadeInView } from "@/components/motion/PageTransition";
import { IconControl } from "./ProprietaryIcons";

const CONTROLS = [
  { label: "Tone", desc: "Professional, casual, authoritative" },
  { label: "Language", desc: "EN, RO, RU, and expanding" },
  { label: "Format", desc: "Post, email, page, script, thread" },
  { label: "Objective", desc: "Sell, educate, attract, convert" },
  { label: "Depth", desc: "Quick draft to deep analysis" },
  { label: "Audience", desc: "B2B, B2C, niche, broad" },
];

export function LandingControlSurface() {
  return (
    <section id="control" className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide)/0.7)] mb-4 block">CONTROL LAYER</span>
          <h2 className="heading-2 mb-4">You control the output. Not the other way around.</h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto text-flow">
            Set tone, language, format, objective, depth, and audience for every execution.
          </p>
        </FadeInView>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CONTROLS.map((ctrl, i) => (
            <FadeInView
              key={ctrl.label}
              delay={i * 0.06}
              className="p-4 sm:p-5 rounded-lg border border-border bg-card hover:border-[hsl(var(--gold-oxide)/0.2)] transition-colors group flex items-start gap-4 sm:block landing-card"
            >
              <IconControl className="text-[hsl(var(--gold-oxide)/0.5)] mb-0 sm:mb-3 mt-0.5 sm:mt-0 shrink-0 group-hover:text-[hsl(var(--gold-oxide)/0.8)] transition-colors" size={18} />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">{ctrl.label}</p>
                <p className="text-sm text-muted-foreground">{ctrl.desc}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
