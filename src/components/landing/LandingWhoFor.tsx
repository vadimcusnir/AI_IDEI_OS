import { FadeInView } from "@/components/motion/PageTransition";
import { IconPodcast, IconFramework, IconAssistant, IconOutput, IconMultiply, IconExtract } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconMultiply, IconOutput, IconFramework, IconExtract, IconAssistant, IconPodcast];

export function LandingWhoFor() {
  const { t } = useTranslation("landing");
  const roles = t("who_for.roles", { returnObjects: true }) as Array<{ label: string; text: string }>;

  return (
    <section className="py-28 sm:py-40 border-y border-border/50" aria-label="Who this is for">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView>
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-6 block">{t("who_for.label")}</span>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.01em] text-foreground mb-6 leading-[1.15]">{t("who_for.title")}</h2>
          <p className="text-[15px] text-muted-foreground max-w-[440px] mb-14 sm:mb-20 leading-[1.75]">{t("who_for.subtitle")}</p>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, i) => {
            const RoleIcon = ICONS[i];
            return (
              <FadeInView key={i} delay={i * 0.06} className="group flex items-start gap-4 p-6 sm:p-7 rounded-xl border border-border/50 bg-card hover:border-[hsl(var(--gold-oxide)/0.2)] landing-card min-h-[44px] transition-all">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-[hsl(var(--gold-oxide)/0.07)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.14)] transition-colors">
                  <RoleIcon className="text-[hsl(var(--gold-oxide))] transition-colors" size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground mb-2">{role.label}</p>
                  <p className="text-sm text-muted-foreground leading-[1.65]">{role.text}</p>
                </div>
              </FadeInView>
            );
          })}
        </div>

        <FadeInView className="text-sm text-muted-foreground italic font-mono mt-12 sm:mt-14 border-t border-border/30 pt-7">
          {t("who_for.footnote")}
        </FadeInView>
      </div>
    </section>
  );
}
