import { FadeInView } from "@/components/motion/PageTransition";
import { IconPodcast, IconFramework, IconAssistant, IconOutput, IconMultiply, IconExtract } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

const ICONS = [IconMultiply, IconOutput, IconFramework, IconExtract, IconAssistant, IconPodcast];

export function LandingWhoFor() {
  const { t } = useTranslation("landing");
  const roles = t("who_for.roles", { returnObjects: true }) as Array<{ label: string; text: string }>;

  return (
    <section className="py-32 sm:py-44 border-y border-border/50" aria-label="Who this is for">
      <ContentBoundary width="default">
        <FadeInView>
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("who_for.label")}</span>
          <h2 className="text-h2 text-foreground mb-6">{t("who_for.title")}</h2>
          <p className="text-body text-muted-foreground max-w-lg mb-16 sm:mb-24 leading-relaxed">{t("who_for.subtitle")}</p>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, i) => {
            const RoleIcon = ICONS[i];
            return (
              <FadeInView key={i} delay={i * 0.07} className="group flex items-start gap-4 p-6 rounded-xl border border-border/50 bg-card hover:border-gold/25 landing-card min-h-[2.75rem] transition-all">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-gold/[0.07] flex items-center justify-center group-hover:bg-gold/[0.16] group-hover:scale-105 transition-all duration-300">
                  <RoleIcon className="text-gold transition-colors" size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground mb-2">{role.label}</p>
                  <p className="text-caption text-muted-foreground leading-relaxed">{role.text}</p>
                </div>
              </FadeInView>
            );
          })}
        </div>

        <FadeInView className="text-caption text-muted-foreground italic font-mono mt-12 sm:mt-16 border-t border-border/30 pt-6">
          {t("who_for.footnote")}
        </FadeInView>
      </ContentBoundary>
    </section>
  );
}
