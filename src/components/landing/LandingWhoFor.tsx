import { FadeInView } from "@/components/motion/PageTransition";
import { IconPodcast, IconFramework, IconAssistant, IconOutput, IconMultiply, IconExtract } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconMultiply, IconOutput, IconFramework, IconExtract, IconAssistant, IconPodcast];

export function LandingWhoFor() {
  const { t } = useTranslation("landing");
  const roles = t("who_for.roles", { returnObjects: true }) as Array<{ label: string; text: string }>;

  return (
    <section className="py-24 sm:py-36 border-y border-border/60" aria-label="Who this is for">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView>
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("who_for.label")}</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">{t("who_for.title")}</h2>
          <p className="text-base text-muted-foreground max-w-md mb-12 sm:mb-16 leading-[1.7]">{t("who_for.subtitle")}</p>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, i) => {
            const RoleIcon = ICONS[i];
            return (
              <FadeInView key={i} delay={i * 0.06} className="group flex items-start gap-4 p-6 sm:p-7 rounded-xl border border-border/60 bg-card hover:border-[hsl(var(--gold-oxide)/0.25)] landing-card min-h-[44px]">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.15)] transition-colors">
                  <RoleIcon className="text-[hsl(var(--gold-oxide))] transition-colors" size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground mb-1.5">{role.label}</p>
                  <p className="text-sm text-muted-foreground leading-[1.6]">{role.text}</p>
                </div>
              </FadeInView>
            );
          })}
        </div>

        <FadeInView className="text-sm text-muted-foreground italic font-mono mt-10 sm:mt-12 border-t border-border/40 pt-6">
          {t("who_for.footnote")}
        </FadeInView>
      </div>
    </section>
  );
}
