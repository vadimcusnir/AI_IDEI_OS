import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";
import { SectionSigil } from "./SectionSigil";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

export function LandingWhyDifferent() {
  const { t } = useTranslation("landing");
  const before = t("why_different.before", { returnObjects: true }) as string[];
  const after = t("why_different.after", { returnObjects: true }) as string[];

  return (
    <section className="py-32 sm:py-44" aria-label="Why AI-IDEI is different">
      <ContentBoundary width="default">
        <FadeInView className="mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("why_different.label")}</span>
          <h2 className="text-h2 text-foreground mb-6">{t("why_different.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-xl overflow-hidden bg-border/50 mb-24">
          <FadeInView className="bg-card p-8 sm:p-10">
            <span className="text-eyebrow font-mono tracking-[0.25em] text-muted-foreground mb-8 block">{t("why_different.without_label")}</span>
            <div className="space-y-4">
              {before.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/25 shrink-0" />
                  <span className="text-caption text-muted-foreground line-through decoration-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>

          <FadeInView delay={0.12} className="bg-card relative p-8 sm:p-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/[0.04] rounded-full blur-[100px]" />
            <span className="text-eyebrow font-mono tracking-[0.25em] text-gold mb-8 block relative">{t("why_different.with_label")}</span>
            <div className="space-y-4 relative">
              {after.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="h-2 w-2 rounded-full bg-gold shrink-0 group-hover:scale-125 transition-transform duration-300" />
                  <span className="text-caption text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>

        <FadeInView className="max-w-2xl mx-auto text-center py-12 sm:py-16 border-y border-gold/12">
          <p className="text-foreground font-bold text-xl sm:text-2xl leading-tight mb-6 tracking-tight">
            {t("why_different.quote")}
          </p>
          <p className="text-eyebrow text-muted-foreground font-mono tracking-[0.2em]">
            {t("why_different.tagline")}
          </p>
        </FadeInView>

        <SectionSigil className="mt-16 sm:mt-20" />
      </ContentBoundary>
    </section>
  );
}
