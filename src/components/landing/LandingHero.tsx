import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtractionEngine } from "./ExtractionEngine";
import { MagicButton } from "./MagicButton";
import { RefObject } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  heroRef: RefObject<HTMLDivElement | null>;
  ctaAction: () => void;
}

export function LandingHero({ heroRef, ctaAction }: Props) {
  const { t } = useTranslation("landing");

  return (
    <section ref={heroRef} className="relative overflow-hidden" aria-label="Hero">
      {/* Layered ambient glow — asymmetric for visual tension */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-[55%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[hsl(var(--gold-oxide)/0.05)] blur-[180px]" />
        <div className="absolute bottom-0 left-[30%] w-[350px] h-[250px] rounded-full bg-[hsl(var(--gold-oxide)/0.025)] blur-[140px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-24 sm:pt-36 md:pt-44 pb-10 sm:pb-20 text-center">
        {/* Mono tagline — eyebrow */}
        <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] uppercase text-[hsl(var(--gold-oxide))] mb-10 sm:mb-12">
          {t("hero.tagline")}
        </p>

        {/* H1 — dominant, tight, commanding */}
        <h1 className="text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[1.05] tracking-[-0.02em] text-foreground mb-7 sm:mb-8">
          {t("hero.title_prefix")}{" "}
          <MagicButton className="text-[hsl(var(--gold-oxide))]">{t("hero.title_highlight")}</MagicButton>
          {" "}{t("hero.title_suffix")}
        </h1>

        {/* Subtitle — narrower, more breathing */}
        <p className="text-[15px] sm:text-lg text-muted-foreground leading-[1.75] max-w-[580px] mx-auto mb-12 sm:mb-16 px-2">
          {t("hero.subtitle")}
        </p>

        {/* CTA cluster — generous spacing, clear hierarchy */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-20 sm:mb-24 px-4 sm:px-0">
          <Button
            size="lg"
            onClick={ctaAction}
            className="gap-2.5 text-sm font-semibold px-10 h-[52px] sm:h-14 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] shadow-lg shadow-[hsl(var(--gold-oxide)/0.18)] w-full sm:w-auto min-h-[48px] rounded-lg transition-all duration-200"
          >
            {t("hero.cta_start")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })}
            className="gap-2.5 text-sm h-[52px] sm:h-14 w-full sm:w-auto border-border/50 text-muted-foreground hover:bg-accent/8 hover:border-[hsl(var(--gold-oxide)/0.3)] min-h-[48px] rounded-lg transition-all duration-200"
          >
            <Eye className="h-4 w-4" />
            {t("hero.cta_mechanism")}
          </Button>
        </div>
      </div>

      {/* Extraction engine visual — more top spacing for separation */}
      <div className="relative max-w-3xl mx-auto px-3 sm:px-4 pb-20 sm:pb-32">
        <ExtractionEngine />
      </div>
    </section>
  );
}
