import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";

export function LandingProblem() {
  const { t } = useTranslation("landing");
  const beforeItems = t("problem.before_items", { returnObjects: true }) as string[];
  const afterItems = t("problem.after_items", { returnObjects: true }) as string[];

  return (
    <section className="py-16 sm:py-28 md:py-32" aria-label="Problem and solution">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* BEFORE */}
            <div>
              <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--signal-red))] mb-4 block">{t("problem.before_label")}</span>
              <h2 className="heading-2 mb-5 sm:mb-6">
                {t("problem.before_title")}
              </h2>
              <div className="space-y-3 sm:space-y-4 text-base text-muted-foreground leading-relaxed text-flow">
                <p>{t("problem.before_p1")}</p>
                <p className="font-semibold text-foreground">{t("problem.before_p2")}</p>
                <div className="pl-4 border-l-2 border-[hsl(var(--signal-red)/0.3)] space-y-1.5 text-sm text-muted-foreground py-1">
                  <p>{t("problem.before_q1")}</p>
                  <p>{t("problem.before_q2")}</p>
                  <p>{t("problem.before_q3")}</p>
                </div>
              </div>
              <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2.5 sm:gap-3">
                {beforeItems.map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal-red)/0.5)] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER */}
            <div className="relative">
              <div className="gold-divider mb-8 lg:hidden" />
              <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">{t("problem.after_label")}</span>
              <h2 className="heading-2 mb-5 sm:mb-6">
                {t("problem.after_title")}
              </h2>
              <div className="space-y-3 sm:space-y-4 text-base text-muted-foreground leading-relaxed text-flow">
                <p>{t("problem.after_p1")}</p>
                <p>{t("problem.after_p2")}</p>
              </div>
              <div className="mt-6 sm:mt-8 space-y-3">
                {afterItems.map(item => (
                  <div key={item} className="flex items-center gap-3 text-base text-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide))] shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[80px] hidden lg:block" />
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}