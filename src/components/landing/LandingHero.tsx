import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtractionEngine } from "./ExtractionEngine";
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
      {/* Layered ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-[hsl(var(--gold-oxide)/0.04)] blur-[220px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-[hsl(var(--gold-oxide)/0.02)] blur-[160px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-5 sm:px-6 pt-20 sm:pt-32 md:pt-40 pb-8 sm:pb-16 text-center">
        {/* Mono tagline */}
        <p className="text-[11px] sm:text-xs font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-8 sm:mb-10">
          {t("hero.tagline")}
        </p>

        {/* H1 — larger, tighter, bolder */}
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-foreground mb-6 sm:mb-7 px-1">
          {t("hero.title_prefix")}{" "}
          <span className="text-[hsl(var(--gold-oxide))]">{t("hero.title_highlight")}</span>
          {" "}{t("hero.title_suffix")}
        </h1>

        {/* Subtitle — constrained width, relaxed line-height */}
        <p className="text-base sm:text-lg text-muted-foreground leading-[1.7] max-w-xl mx-auto mb-10 sm:mb-14 px-2">
          {t("hero.subtitle")}
        </p>

        {/* CTA cluster — more breathing room */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-20 px-4 sm:px-0">
          <Button
            size="lg"
            onClick={ctaAction}
            className="gap-2.5 text-sm font-semibold px-10 h-13 sm:h-14 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] shadow-lg shadow-[hsl(var(--gold-oxide)/0.2)] w-full sm:w-auto min-h-[48px] rounded-lg"
          >
            {t("hero.cta_start")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })}
            className="gap-2.5 text-sm h-13 sm:h-14 w-full sm:w-auto border-border/60 text-muted-foreground hover:bg-accent/8 min-h-[48px] rounded-lg"
          >
            <Eye className="h-4 w-4" />
            {t("hero.cta_mechanism")}
          </Button>
        </div>
      </div>

      {/* Extraction engine visual */}
      <div className="relative max-w-4xl mx-auto px-3 sm:px-4 pb-16 sm:pb-28">
        <ExtractionEngine />
      </div>
    </section>
  );
}
