import { FadeInView } from "@/components/motion/PageTransition";
import { Target, Zap, MessageSquare, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

const ICONS = [Target, Zap, MessageSquare, Settings];

export function LandingBenefits() {
  const { t } = useTranslation("landing");
  const items = t("benefits.items", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <section className="py-32 sm:py-44 border-y border-border/50" aria-label="Benefits">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-20 sm:mb-28">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-6 block">{t("benefits.label")}</span>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.01em] text-foreground leading-[1.15]">{t("benefits.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((b, i) => {
            const Icon = ICONS[i];
            return (
              <FadeInView
                key={i}
                delay={i * 0.1}
                className="relative p-8 sm:p-10 rounded-xl border border-border/50 bg-card hover:border-[hsl(var(--gold-oxide)/0.22)] landing-card group transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-11 h-11 rounded-lg bg-[hsl(var(--gold-oxide)/0.07)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.16)] group-hover:scale-105 transition-all duration-300">
                    <Icon className="h-5 w-5 text-[hsl(var(--gold-oxide))]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-[1.7] max-w-[360px]">{b.text}</p>
                  </div>
                </div>
              </FadeInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}
