import { FadeInView } from "@/components/motion/PageTransition";
import { Target, Zap, MessageSquare, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

const ICONS = [Target, Zap, MessageSquare, Settings];

export function LandingBenefits() {
  const { t } = useTranslation("landing");
  const items = t("benefits.items", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <section className="py-24 sm:py-36 border-y border-border/60" aria-label="Benefits">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-12 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("benefits.label")}</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-[1.2]">{t("benefits.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {items.map((b, i) => {
            const Icon = ICONS[i];
            return (
              <FadeInView
                key={i}
                delay={i * 0.08}
                className="relative p-7 sm:p-9 rounded-xl border border-border/60 bg-card hover:border-[hsl(var(--gold-oxide)/0.2)] landing-card group"
              >
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-11 h-11 rounded-lg bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.15)] transition-colors">
                    <Icon className="h-5 w-5 text-[hsl(var(--gold-oxide))] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2.5">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-[1.7] max-w-sm">{b.text}</p>
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
