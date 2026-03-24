import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";

export function LandingProblem() {
  const { t } = useTranslation("landing");
  const beforeItems = t("problem.before_items", { returnObjects: true }) as string[];
  const afterItems = t("problem.after_items", { returnObjects: true }) as string[];

  return (
    <section className="py-20 sm:py-32 md:py-40" aria-label="Problem and solution">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* BEFORE */}
            <div>
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--signal-red))] mb-5 block">{t("problem.before_label")}</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6 leading-[1.2]">
                {t("problem.before_title")}
              </h2>
              <div className="space-y-4 text-base text-muted-foreground leading-[1.7] max-w-lg">
                <p>{t("problem.before_p1")}</p>
                <p className="font-semibold text-foreground">{t("problem.before_p2")}</p>
                <div className="pl-5 border-l-2 border-[hsl(var(--signal-red)/0.25)] space-y-2 text-sm text-muted-foreground py-2">
                  <p>{t("problem.before_q1")}</p>
                  <p>{t("problem.before_q2")}</p>
                  <p>{t("problem.before_q3")}</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {beforeItems.map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal-red)/0.4)] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER */}
            <div className="relative">
              <div className="gold-divider mb-10 lg:hidden" />
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("problem.after_label")}</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6 leading-[1.2]">
                {t("problem.after_title")}
              </h2>
              <div className="space-y-4 text-base text-muted-foreground leading-[1.7] max-w-lg">
                <p>{t("problem.after_p1")}</p>
                <p>{t("problem.after_p2")}</p>
              </div>
              <div className="mt-8 space-y-3.5">
                {afterItems.map(item => (
                  <div key={item} className="flex items-center gap-3.5 text-base text-foreground">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--gold-oxide))] shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[100px] hidden lg:block" />
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
