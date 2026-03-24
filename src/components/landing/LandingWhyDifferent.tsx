import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";

export function LandingWhyDifferent() {
  const { t } = useTranslation("landing");
  const before = t("why_different.before", { returnObjects: true }) as string[];
  const after = t("why_different.after", { returnObjects: true }) as string[];

  return (
    <section className="py-24 sm:py-36" aria-label="Why AI-IDEI is different">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-12 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("why_different.label")}</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">{t("why_different.title")}</h2>
        </FadeInView>

        {/* Before / After comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-xl overflow-hidden bg-border/60 mb-16 sm:mb-20">
          <FadeInView className="bg-card p-8 sm:p-12">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-7 block">{t("why_different.without_label")}</span>
            <div className="space-y-3.5">
              {before.map((item, i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/25">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>

          <FadeInView delay={0.1} className="bg-card relative p-8 sm:p-12">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[80px]" />
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[hsl(var(--gold-oxide))] mb-7 block relative">{t("why_different.with_label")}</span>
            <div className="space-y-3.5 relative">
              {after.map((item, i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--gold-oxide))] shrink-0" />
                  <span className="text-sm text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>

        {/* Pull quote */}
        <FadeInView className="max-w-3xl mx-auto text-center py-10 sm:py-14 border-y border-[hsl(var(--gold-oxide)/0.12)]">
          <p className="text-foreground font-bold text-xl sm:text-2xl leading-[1.3] mb-5 tracking-tight">
            {t("why_different.quote")}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-mono tracking-[0.15em] uppercase">
            {t("why_different.tagline")}
          </p>
        </FadeInView>
      </div>
    </section>
  );
}
