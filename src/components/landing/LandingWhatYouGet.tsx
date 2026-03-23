import { FadeInView } from "@/components/motion/PageTransition";
import { IconFramework, IconAssistant, IconPodcast, IconOutput } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconFramework, IconAssistant, IconPodcast, IconOutput];

export function LandingWhatYouGet() {
  const { t } = useTranslation("landing");
  const blocks = t("what_you_get.blocks", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <section className="py-20 sm:py-28" aria-label="What you get">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-10 sm:mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">{t("what_you_get.label")}</span>
          <h2 className="heading-2 mb-4">{t("what_you_get.title")}</h2>
          <p className="text-base text-muted-foreground max-w-lg text-flow">{t("what_you_get.subtitle")}</p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden">
          {blocks.map((block, i) => {
            const BlockIcon = ICONS[i];
            return (
              <FadeInView key={i} delay={i * 0.08} className="bg-card p-6 sm:p-10 group hover:bg-accent/5 transition-all">
                <BlockIcon className="text-[hsl(var(--gold-oxide))] mb-6 transition-colors" size={28} />
                <h3 className="text-lg font-semibold text-foreground mb-3">{block.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-flow">{block.text}</p>
              </FadeInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}