import { FadeInView } from "@/components/motion/PageTransition";
import { IconFramework, IconAssistant, IconPodcast, IconOutput } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconFramework, IconAssistant, IconPodcast, IconOutput];

export function LandingWhatYouGet() {
  const { t } = useTranslation("landing");
  const blocks = t("what_you_get.blocks", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <section className="py-32 sm:py-44" aria-label="What you get">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-20 sm:mb-28">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-6 block">{t("what_you_get.label")}</span>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.01em] text-foreground mb-6 leading-[1.15]">{t("what_you_get.title")}</h2>
          <p className="text-[15px] text-muted-foreground max-w-[480px] leading-[1.75]">{t("what_you_get.subtitle")}</p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/50 rounded-xl overflow-hidden">
          {blocks.map((block, i) => {
            const BlockIcon = ICONS[i];
            return (
              <FadeInView key={i} delay={i * 0.1} className="bg-card p-9 sm:p-12 group hover:bg-accent/5 transition-all duration-300 landing-card">
                <BlockIcon className="text-[hsl(var(--gold-oxide))] mb-8 group-hover:scale-110 transition-transform duration-300" size={26} />
                <h3 className="text-lg font-bold text-foreground mb-3.5">{block.title}</h3>
                <p className="text-sm text-muted-foreground leading-[1.7] max-w-[360px]">{block.text}</p>
              </FadeInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}
