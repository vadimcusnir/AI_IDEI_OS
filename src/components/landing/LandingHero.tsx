import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtractionEngine } from "./ExtractionEngine";
import { MagicButton } from "./MagicButton";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  heroRef: RefObject<HTMLDivElement | null>;
  ctaAction: () => void;
}

export function LandingHero({ heroRef, ctaAction }: Props) {
  const { t } = useTranslation("landing");
  const reduced = useReducedMotion();

  const fadeUp = reduced
    ? {}
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  return (
    <section ref={heroRef} className="relative overflow-hidden" aria-label="Hero">
      {/* Layered ambient glow — asymmetric for visual tension */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-[55%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[hsl(var(--gold-oxide)/0.05)] blur-[180px]" />
        <div className="absolute bottom-0 left-[30%] w-[350px] h-[250px] rounded-full bg-[hsl(var(--gold-oxide)/0.025)] blur-[140px]" />
      </div>

      <ContentBoundary width="default" className="relative pt-24 sm:pt-36 md:pt-44 pb-10 sm:pb-20 text-center">
        {/* Mono tagline — eyebrow */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-eyebrow font-mono tracking-[0.35em] text-[hsl(var(--gold-oxide))] mb-10 sm:mb-12"
        >
          {t("hero.tagline")}
        </motion.p>

        {/* H1 — dominant, tight, commanding */}
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-h1 text-foreground mb-8"
        >
          {t("hero.title_prefix")}{" "}
          <MagicButton className="text-[hsl(var(--gold-oxide))]">{t("hero.title_highlight")}</MagicButton>
          {" "}{t("hero.title_suffix")}
        </motion.h1>

        {/* Subtitle — narrower, more breathing */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-body sm:text-body-lg text-muted-foreground leading-relaxed max-w-[36rem] mx-auto mb-12 sm:mb-16 px-2"
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* CTA cluster — generous spacing, clear hierarchy */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-20 sm:mb-24 px-4 sm:px-0"
        >
          <Button
            size="lg"
            onClick={ctaAction}
            className="cta-canon cta-glow gap-2.5 text-sm font-semibold px-10 h-12 sm:h-14 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] shadow-lg shadow-[hsl(var(--gold-oxide)/0.18)] w-full sm:w-auto rounded-lg transition-all duration-200"
          >
            {t("hero.cta_start")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })}
            className="cta-canon gap-2.5 text-sm h-12 sm:h-14 w-full sm:w-auto border-border/50 text-muted-foreground hover:bg-accent/8 hover:border-[hsl(var(--gold-oxide)/0.3)] rounded-lg transition-all duration-200"
          >
            <Eye className="h-4 w-4" />
            {t("hero.cta_mechanism")}
          </Button>
        </motion.div>
      </ContentBoundary>

      {/* Extraction engine visual — more top spacing for separation */}
      <ContentBoundary width="narrow" className="pb-20 sm:pb-32">
        <ExtractionEngine />
      </ContentBoundary>
    </section>
  );
}
