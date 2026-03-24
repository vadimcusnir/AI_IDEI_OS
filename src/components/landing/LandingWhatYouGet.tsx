import { FadeInView } from "@/components/motion/PageTransition";
import { IconFramework, IconAssistant, IconPodcast, IconOutput } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconFramework, IconAssistant, IconPodcast, IconOutput];

export function LandingWhatYouGet() {
  const { t } = useTranslation("landing");
  const blocks = t("what_you_get.blocks", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <section className="py-24 sm:py-36" aria-label="What you get">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-12 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("what_you_get.label")}</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">{t("what_you_get.title")}</h2>
          <p className="text-base text-muted-foreground max-w-md leading-[1.7]">{t("what_you_get.subtitle")}</p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/60 rounded-xl overflow-hidden">
          {blocks.map((block, i) => {
            const BlockIcon = ICONS[i];
            return (
              <FadeInView key={i} delay={i * 0.08} className="bg-card p-8 sm:p-12 group hover:bg-accent/5 transition-all">
                <BlockIcon className="text-[hsl(var(--gold-oxide))] mb-7 transition-colors" size={28} />
                <h3 className="text-lg font-bold text-foreground mb-3">{block.title}</h3>
                <p className="text-sm text-muted-foreground leading-[1.7] max-w-sm">{block.text}</p>
              </FadeInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}
