import { FadeInView } from "@/components/motion/PageTransition";
import { IconFramework, IconAssistant, IconPodcast, IconOutput } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

const ICONS = [IconFramework, IconAssistant, IconPodcast, IconOutput];

export function LandingWhatYouGet() {
  const { t } = useTranslation("landing");
  const blocks = t("what_you_get.blocks", { returnObjects: true }) as Array<{ title: string; text: string }>;

  return (
    <section className="py-32 sm:py-44" aria-label="What you get">
      <ContentBoundary width="default">
        <FadeInView className="mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-[hsl(var(--gold-oxide))] mb-6 block">{t("what_you_get.label")}</span>
          <h2 className="text-h2 text-foreground mb-6">{t("what_you_get.title")}</h2>
          <p className="text-body text-muted-foreground max-w-lg leading-relaxed">{t("what_you_get.subtitle")}</p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/50 rounded-xl overflow-hidden">
          {blocks.map((block, i) => {
            const BlockIcon = ICONS[i];
            return (
              <FadeInView key={i} delay={i * 0.1} className="bg-card p-8 sm:p-10 group hover:bg-accent/5 transition-all duration-300 landing-card">
                <BlockIcon className="text-[hsl(var(--gold-oxide))] mb-8 group-hover:scale-110 transition-transform duration-300" size={26} />
                <h3 className="text-h4 text-foreground mb-3">{block.title}</h3>
                <p className="text-caption text-muted-foreground leading-relaxed max-w-sm">{block.text}</p>
              </FadeInView>
            );
          })}
        </div>
      </ContentBoundary>
    </section>
  );
}
