import { FadeInView } from "@/components/motion/PageTransition";
import { IconControl } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

export function LandingControlSurface() {
  const { t } = useTranslation("landing");
  const items = t("control.items", { returnObjects: true }) as Array<{ label: string; desc: string }>;

  return (
    <section id="control" className="py-24 sm:py-36" aria-labelledby="control-heading">
      <div className="max-w-4xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("control.label")}</span>
          <h2 id="control-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">{t("control.title")}</h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-[1.7]">{t("control.subtitle")}</p>
        </FadeInView>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((ctrl, i) => (
            <FadeInView key={i} delay={i * 0.06} className="p-5 sm:p-6 rounded-xl border border-border/60 bg-card hover:border-[hsl(var(--gold-oxide)/0.25)] transition-colors group flex items-start gap-4 sm:block landing-card">
              <IconControl className="text-[hsl(var(--gold-oxide))] mb-0 sm:mb-4 mt-0.5 sm:mt-0 shrink-0 transition-colors" size={20} />
              <div>
                <p className="text-sm font-bold text-foreground mb-1.5">{ctrl.label}</p>
                <p className="text-sm text-muted-foreground leading-[1.6]">{ctrl.desc}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
