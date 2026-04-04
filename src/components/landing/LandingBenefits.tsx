import { FadeInView } from "@/components/motion/PageTransition";
import { Target, Zap, MessageSquare, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

const ICONS = [Target, Zap, MessageSquare, Settings];

export function LandingBenefits() {
  const { t } = useTranslation("landing");
  const items = t("benefits.items", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <section className="py-32 sm:py-44 border-y border-border/50" aria-label="Benefits">
      <ContentBoundary width="default">
        <FadeInView className="mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("benefits.label")}</span>
          <h2 className="text-h2 text-foreground">{t("benefits.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((b, i) => {
            const Icon = ICONS[i];
            return (
              <FadeInView
                key={i}
                delay={i * 0.1}
                className="relative p-6 sm:p-8 rounded-xl border border-border/50 bg-card hover:border-gold/22 landing-card group transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-lg bg-gold/[0.07] flex items-center justify-center group-hover:bg-gold/[0.16] group-hover:scale-105 transition-all duration-300">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">{b.title}</h3>
                    <p className="text-caption text-muted-foreground leading-relaxed max-w-sm">{b.text}</p>
                  </div>
                </div>
              </FadeInView>
            );
          })}
        </div>
      </ContentBoundary>
    </section>
  );
}
