import { FadeInView } from "@/components/motion/PageTransition";
import { Target, Zap, MessageSquare, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

const ICONS = [Target, Zap, MessageSquare, Settings];

export function LandingBenefits() {
  const { t } = useTranslation("landing");
  const items = t("benefits.items", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <section className="py-16 sm:py-28 border-y border-border" aria-label="Benefits">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-10 sm:mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">{t("benefits.label")}</span>
          <h2 className="heading-2 mb-4">{t("benefits.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {items.map((b, i) => {
            const Icon = ICONS[i];
            return (
              <FadeInView
                key={i}
                delay={i * 0.08}
                className="relative p-6 sm:p-8 rounded-xl border border-border bg-card hover:border-[hsl(var(--gold-oxide)/0.2)] landing-card group"
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--gold-oxide)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.18)] transition-colors">
                    <Icon className="h-5 w-5 text-[hsl(var(--gold-oxide))] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-flow">{b.text}</p>
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