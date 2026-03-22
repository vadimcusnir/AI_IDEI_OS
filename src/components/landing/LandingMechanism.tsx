import { FadeInView } from "@/components/motion/PageTransition";
import { IconExtract, IconFramework, IconOutput, IconMultiply } from "./ProprietaryIcons";

const STEPS = [
  { num: "01", title: "Choose the problem", text: "Start with what you need: copy, content, positioning, offer clarity, or execution support.", icon: IconExtract },
  { num: "02", title: "Use the right resource", text: "Pick a framework, prompt, assistant, or example designed for that exact type of work.", icon: IconFramework },
  { num: "03", title: "Turn it into an asset", text: "Produce something usable: a post, email, landing page, offer, script, or campaign asset.", icon: IconOutput },
  { num: "04", title: "Repeat with speed", text: "Stop improvising. Start producing with clarity, consistency, and momentum.", icon: IconMultiply },
];

const TRANSFORMS = [
  { from: "A rough thought", to: "a social post that communicates value" },
  { from: "A messy service", to: "a clearer offer with stronger positioning" },
  { from: "A long transcript", to: "a newsletter, article, thread, and email sequence" },
  { from: "Scattered notes", to: "a content plan, product outline, or conversion asset" },
];

export function LandingMechanism() {
  return (
    <section id="mechanism" className="py-20 sm:py-28 border-y border-[hsl(var(--ivory-dim)/0.08)]">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide)/0.7)] mb-4 block">THE MECHANISM</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">One idea becomes many assets</h2>
          <p className="text-base text-[hsl(var(--ivory-dim)/0.65)] max-w-lg mx-auto">
            With the right system, a single idea stops being a thought and starts becoming leverage.
          </p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[hsl(var(--ivory-dim)/0.08)] rounded-xl overflow-hidden mb-16">
          {STEPS.map((step, i) => (
            <FadeInView key={step.num} delay={i * 0.08} className="bg-[hsl(var(--obsidian-light)/0.5)] p-6 sm:p-8 group hover:bg-[hsl(var(--obsidian-light)/0.8)] transition-colors">
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-mono font-bold text-[hsl(var(--gold-oxide)/0.15)] group-hover:text-[hsl(var(--gold-oxide)/0.3)] transition-colors">{step.num}</span>
                <step.icon className="text-[hsl(var(--gold-oxide)/0.6)]" size={20} />
              </div>
              <h3 className="text-base font-semibold text-[hsl(var(--ivory))] mb-2">{step.title}</h3>
              <p className="text-sm text-[hsl(var(--ivory-dim)/0.6)] leading-relaxed">{step.text}</p>
            </FadeInView>
          ))}
        </div>

        <div className="space-y-2">
          {TRANSFORMS.map((t, i) => (
            <FadeInView key={i} delay={i * 0.06} className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-[hsl(var(--ivory-dim)/0.04)] transition-colors">
              <span className="text-sm font-mono text-[hsl(var(--ivory-dim)/0.55)] min-w-[140px] sm:min-w-[180px]">{t.from}</span>
              <span className="text-[hsl(var(--gold-oxide)/0.7)] font-mono text-sm">→</span>
              <span className="text-sm text-[hsl(var(--ivory)/0.8)]">{t.to}</span>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
