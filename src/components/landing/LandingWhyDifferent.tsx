import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";

export function LandingWhyDifferent() {
  const { t } = useTranslation("landing");
  const before = t("why_different.before", { returnObjects: true }) as string[];
  const after = t("why_different.after", { returnObjects: true }) as string[];

  return (
    <section className="py-16 sm:py-28" aria-label="Why AI-IDEI is different">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-10 sm:mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">{t("why_different.label")}</span>
          <h2 className="heading-2 mb-4">{t("why_different.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-xl overflow-hidden bg-border mb-12 sm:mb-16">
          <FadeInView className="bg-card p-6 sm:p-10">
            <span className="text-xs font-mono tracking-[0.15em] text-muted-foreground mb-6 block">{t("why_different.without_label")}</span>
            <div className="space-y-3">
              {before.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/30">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>

          <FadeInView delay={0.1} className="bg-card relative p-6 sm:p-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[60px]" />
            <span className="text-xs font-mono tracking-[0.15em] text-[hsl(var(--gold-oxide))] mb-6 block relative">{t("why_different.with_label")}</span>
            <div className="space-y-3 relative">
              {after.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide))] shrink-0" />
                  <span className="text-sm text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>

        <FadeInView className="max-w-3xl mx-auto text-center py-8 sm:py-12 border-y border-[hsl(var(--gold-oxide)/0.15)]">
          <p className="text-foreground font-bold text-lg sm:text-xl leading-snug mb-4">
            {t("why_different.quote")}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono tracking-[0.1em]">
            {t("why_different.tagline")}
          </p>
        </FadeInView>
      </div>
    </section>
  );
}