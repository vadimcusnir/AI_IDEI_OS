import { FadeInView } from "@/components/motion/PageTransition";
import { IconExtract, IconFramework, IconOutput, IconMultiply } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import extractionDiagram from "@/assets/diagrams/extraction-process-dark.png";

const ICONS = [IconExtract, IconFramework, IconOutput, IconMultiply];

export function LandingMechanism() {
  const { t } = useTranslation("landing");
  const steps = t("mechanism.steps", { returnObjects: true }) as Array<{ num: string; title: string; text: string }>;
  const transforms = t("mechanism.transforms", { returnObjects: true }) as Array<{ from: string; to: string }>;

  return (
    <section id="mechanism" className="py-32 sm:py-44 border-y border-border/50" aria-labelledby="mechanism-heading">
      <ContentBoundary width="default">
        <FadeInView className="text-center mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("mechanism.label")}</span>
          <h2 id="mechanism-heading" className="text-h2 text-foreground mb-6">{t("mechanism.title")}</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t("mechanism.subtitle")}
          </p>
        </FadeInView>

        {/* Visual Diagram — Extraction Process */}
        <FadeInView className="mb-20 sm:mb-24">
          <div className="relative rounded-xl overflow-hidden border border-border/30 bg-obsidian">
            <img
              src={extractionDiagram}
              alt="Extraction Process: Messy Inputs → Filtration, Parsing, Clustering, Semantic Compression → Atomic Knowledge Units"
              className="w-full h-auto"
              loading="lazy"
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-[hsl(var(--gold-oxide)/0.08)] pointer-events-none" />
          </div>
        </FadeInView>

        {/* 4-step grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 rounded-xl overflow-hidden mb-24">
          {steps.map((step, i) => {
            const StepIcon = ICONS[i];
            return (
              <FadeInView key={step.num} delay={i * 0.1} className="bg-card p-6 sm:p-8 group hover:bg-accent/5 transition-all duration-300 landing-card">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-4xl font-mono font-bold text-gold/10 group-hover:text-gold/28 transition-colors duration-300 leading-none">{step.num}</span>
                  <StepIcon className="text-gold group-hover:scale-110 transition-transform duration-300" size={22} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-caption text-muted-foreground leading-relaxed">{step.text}</p>
              </FadeInView>
            );
          })}
        </div>

        {/* Transform list */}
        <div className="space-y-1 max-w-3xl mx-auto">
          {transforms.map((t_item, i) => (
            <FadeInView key={i} delay={i * 0.05} className="flex items-center gap-3 sm:gap-6 py-4 px-3 sm:px-4 rounded-lg hover:bg-accent/5 transition-all duration-200 group">
              <span className="text-xs sm:text-sm font-mono text-muted-foreground min-w-24 sm:min-w-48 group-hover:text-foreground transition-colors duration-200">{t_item.from}</span>
              <span className="text-gold font-mono text-sm shrink-0 group-hover:scale-125 transition-transform duration-200">→</span>
              <span className="text-xs sm:text-sm text-foreground font-medium">{t_item.to}</span>
            </FadeInView>
          ))}
        </div>
      </ContentBoundary>
    </section>
  );
}
