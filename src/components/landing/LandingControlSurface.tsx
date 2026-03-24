import { FadeInView } from "@/components/motion/PageTransition";
import { IconControl } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

export function LandingControlSurface() {
  const { t } = useTranslation("landing");
  const items = t("control.items", { returnObjects: true }) as Array<{ label: string; desc: string }>;

  return (
    <section id="control" className="py-28 sm:py-40" aria-labelledby="control-heading">
      <div className="max-w-4xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-20 sm:mb-24">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-6 block">{t("control.label")}</span>
          <h2 id="control-heading" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.01em] text-foreground mb-6 leading-[1.15]">{t("control.title")}</h2>
          <p className="text-[15px] text-muted-foreground max-w-[440px] mx-auto leading-[1.75]">{t("control.subtitle")}</p>
        </FadeInView>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((ctrl, i) => (
            <FadeInView key={i} delay={i * 0.06} className="p-6 sm:p-7 rounded-xl border border-border/50 bg-card hover:border-[hsl(var(--gold-oxide)/0.2)] transition-all group flex items-start gap-4 sm:block landing-card">
              <IconControl className="text-[hsl(var(--gold-oxide))] mb-0 sm:mb-5 mt-0.5 sm:mt-0 shrink-0 transition-colors" size={20} />
              <div>
                <p className="text-sm font-bold text-foreground mb-2">{ctrl.label}</p>
                <p className="text-sm text-muted-foreground leading-[1.65]">{ctrl.desc}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
