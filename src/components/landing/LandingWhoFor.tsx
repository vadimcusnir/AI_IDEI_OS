import { FadeInView } from "@/components/motion/PageTransition";
import { IconPodcast, IconFramework, IconAssistant, IconOutput, IconMultiply, IconExtract } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconMultiply, IconOutput, IconFramework, IconExtract, IconAssistant, IconPodcast];

export function LandingWhoFor() {
  const { t } = useTranslation("landing");
  const roles = t("who_for.roles", { returnObjects: true }) as Array<{ label: string; text: string }>;

  return (
    <section className="py-16 sm:py-28 border-y border-border" aria-label="Who this is for">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView>
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">{t("who_for.label")}</span>
          <h2 className="heading-2 mb-4">{t("who_for.title")}</h2>
          <p className="text-base text-muted-foreground max-w-lg mb-10 sm:mb-14 text-flow">{t("who_for.subtitle")}</p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {roles.map((role, i) => {
            const RoleIcon = ICONS[i];
            return (
              <FadeInView key={i} delay={i * 0.06} className="group flex items-start gap-4 p-5 sm:p-6 rounded-lg border border-border bg-card hover:border-[hsl(var(--gold-oxide)/0.25)] landing-card min-h-[44px]">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.15)] transition-colors">
                  <RoleIcon className="text-[hsl(var(--gold-oxide))] transition-colors" size={18} />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">{role.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{role.text}</p>
                </div>
              </FadeInView>
            );
          })}
        </div>

        <FadeInView className="text-sm text-muted-foreground italic font-mono mt-8 sm:mt-10 border-t border-border pt-6">
          {t("who_for.footnote")}
        </FadeInView>
      </div>
    </section>
  );
}