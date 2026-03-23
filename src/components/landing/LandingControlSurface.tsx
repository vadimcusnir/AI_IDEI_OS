import { FadeInView } from "@/components/motion/PageTransition";
import { IconControl } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

export function LandingControlSurface() {
  const { t } = useTranslation("landing");
  const items = t("control.items", { returnObjects: true }) as Array<{ label: string; desc: string }>;

  return (
    <section id="control" className="py-20 sm:py-28" aria-labelledby="control-heading">
      <div className="max-w-4xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">{t("control.label")}</span>
          <h2 id="control-heading" className="heading-2 mb-4">{t("control.title")}</h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto text-flow">{t("control.subtitle")}</p>
        </FadeInView>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((ctrl, i) => (
            <FadeInView key={i} delay={i * 0.06} className="p-4 sm:p-5 rounded-lg border border-border bg-card hover:border-[hsl(var(--gold-oxide)/0.25)] transition-colors group flex items-start gap-4 sm:block landing-card">
              <IconControl className="text-[hsl(var(--gold-oxide))] mb-0 sm:mb-3 mt-0.5 sm:mt-0 shrink-0 transition-colors" size={18} />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">{ctrl.label}</p>
                <p className="text-sm text-muted-foreground">{ctrl.desc}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}