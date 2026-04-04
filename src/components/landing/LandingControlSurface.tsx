import { FadeInView } from "@/components/motion/PageTransition";
import { IconControl } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

export function LandingControlSurface() {
  const { t } = useTranslation("landing");
  const items = t("control.items", { returnObjects: true }) as Array<{ label: string; desc: string }>;

  return (
    <section id="control" className="py-32 sm:py-44" aria-labelledby="control-heading">
      <ContentBoundary width="default">
        <FadeInView className="text-center mb-20 sm:mb-28">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("control.label")}</span>
          <h2 id="control-heading" className="text-h2 text-foreground mb-6">{t("control.title")}</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto leading-relaxed">{t("control.subtitle")}</p>
        </FadeInView>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((ctrl, i) => (
            <FadeInView key={i} delay={i * 0.07} className="p-6 sm:p-7 rounded-xl border border-border/50 bg-card hover:border-gold/25 transition-all group flex items-start gap-4 sm:block landing-card min-h-[2.75rem]">
              <IconControl className="text-gold mb-0 sm:mb-5 mt-0.5 sm:mt-0 shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
              <div>
                <p className="text-sm font-bold text-foreground mb-2">{ctrl.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{ctrl.desc}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </ContentBoundary>
    </section>
  );
}
