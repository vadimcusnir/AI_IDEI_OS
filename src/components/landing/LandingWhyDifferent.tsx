import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";
import { SectionSigil } from "./SectionSigil";

export function LandingWhyDifferent() {
  const { t } = useTranslation("landing");
  const before = t("why_different.before", { returnObjects: true }) as string[];
  const after = t("why_different.after", { returnObjects: true }) as string[];

  return (
    <section className="py-32 sm:py-44" aria-label="Why AI-IDEI is different">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-20 sm:mb-28">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-6 block">{t("why_different.label")}</span>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.01em] text-foreground mb-6 leading-[1.15]">{t("why_different.title")}</h2>
        </FadeInView>

        {/* Before / After comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-xl overflow-hidden bg-border/50 mb-24 sm:mb-28">
          <FadeInView className="bg-card p-9 sm:p-12">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-muted-foreground mb-8 block">{t("why_different.without_label")}</span>
            <div className="space-y-4">
              {before.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/25 shrink-0" />
                  <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>

          <FadeInView delay={0.12} className="bg-card relative p-9 sm:p-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[100px]" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-8 block relative">{t("why_different.with_label")}</span>
            <div className="space-y-4 relative">
              {after.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--gold-oxide))] shrink-0 group-hover:scale-125 transition-transform duration-300" />
                  <span className="text-sm text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>

        {/* Pull quote */}
        <FadeInView className="max-w-2xl mx-auto text-center py-14 sm:py-18 border-y border-[hsl(var(--gold-oxide)/0.12)]">
          <p className="text-foreground font-bold text-xl sm:text-2xl leading-[1.25] mb-6 tracking-[-0.01em]">
            {t("why_different.quote")}
          </p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-mono tracking-[0.2em] uppercase">
            {t("why_different.tagline")}
          </p>
        </FadeInView>

        <SectionSigil className="mt-16 sm:mt-20" />
      </div>
    </section>
  );
}
