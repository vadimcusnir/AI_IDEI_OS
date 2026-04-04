import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";
import { SectionSigil } from "./SectionSigil";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

export function LandingProblem() {
  const { t } = useTranslation("landing");
  const beforeItems = t("problem.before_items", { returnObjects: true }) as string[];
  const afterItems = t("problem.after_items", { returnObjects: true }) as string[];

  return (
    <section className="py-32 sm:py-44" aria-label="Problem and solution">
      <ContentBoundary width="default">
        <FadeInView>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* BEFORE */}
            <div>
              <span className="text-eyebrow font-mono tracking-[0.3em] text-signal-red mb-6 block">{t("problem.before_label")}</span>
              <h2 className="text-h2 text-foreground mb-8">
                {t("problem.before_title")}
              </h2>
              <div className="space-y-4 text-body text-muted-foreground leading-relaxed max-w-md">
                <p>{t("problem.before_p1")}</p>
                <p className="font-semibold text-foreground">{t("problem.before_p2")}</p>
                <div className="pl-4 border-l-2 border-signal-red/20 space-y-2.5 text-caption text-muted-foreground py-3">
                  <p>{t("problem.before_q1")}</p>
                  <p>{t("problem.before_q2")}</p>
                  <p>{t("problem.before_q3")}</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {beforeItems.map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-caption text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-signal-red/35 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER */}
            <div className="relative">
              <div className="gold-divider mb-12 lg:hidden" />
              <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("problem.after_label")}</span>
              <h2 className="text-h2 text-foreground mb-8">
                {t("problem.after_title")}
              </h2>
              <div className="space-y-4 text-body text-muted-foreground leading-relaxed max-w-md">
                <p>{t("problem.after_p1")}</p>
                <p>{t("problem.after_p2")}</p>
              </div>
              <div className="mt-8 space-y-4">
                {afterItems.map(item => (
                  <div key={item} className="flex items-center gap-4 text-body text-foreground group">
                    <div className="h-2 w-2 rounded-full bg-gold shrink-0 group-hover:scale-125 transition-transform duration-300" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-gold/[0.035] rounded-full blur-[120px] hidden lg:block" />
            </div>
          </div>
        </FadeInView>

        <SectionSigil className="mt-20 sm:mt-24" />
      </ContentBoundary>
    </section>
  );
}
