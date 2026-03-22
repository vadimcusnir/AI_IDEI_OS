/**
 * "Who This Is For" — visual role cards.
 */
import { FadeInView } from "@/components/motion/PageTransition";
import { IconPodcast, IconFramework, IconAssistant, IconOutput, IconMultiply, IconExtract } from "./ProprietaryIcons";

const ROLES = [
  { icon: IconMultiply, label: "Creators", text: "Publish faster with structure, not pressure" },
  { icon: IconOutput, label: "Freelancers", text: "Stronger messaging, more speed, less guessing" },
  { icon: IconFramework, label: "Consultants", text: "Clearer offers, sharper positioning" },
  { icon: IconExtract, label: "Marketers", text: "Better systems, better campaigns, better output" },
  { icon: IconAssistant, label: "Founders", text: "Turn scattered ideas into assets" },
  { icon: IconPodcast, label: "Operators", text: "Practical AI for execution, not hype" },
];

export function LandingWhoFor() {
  return (
    <section className="py-16 sm:py-28 border-y border-border">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView>
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">WHO THIS IS FOR</span>
          <h2 className="heading-2 mb-4">
            Built for people who want output, not noise
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mb-10 sm:mb-14 text-flow">
            If you write, sell, teach, or build — this system is designed around your daily reality.
          </p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {ROLES.map((role, i) => (
            <FadeInView
              key={role.label}
              delay={i * 0.06}
              className="group flex items-start gap-4 p-5 sm:p-6 rounded-lg border border-border bg-card hover:border-[hsl(var(--gold-oxide)/0.25)] landing-card min-h-[44px]"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.15)] transition-colors">
                <role.icon className="text-[hsl(var(--gold-oxide))] transition-colors" size={18} />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground mb-1">{role.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{role.text}</p>
              </div>
            </FadeInView>
          ))}
        </div>

        <FadeInView className="text-sm text-muted-foreground italic font-mono mt-8 sm:mt-10 border-t border-border pt-6">
          Not for people who want theory without execution, tools without application, or endless prompting without results.
        </FadeInView>
      </div>
    </section>
  );
}
