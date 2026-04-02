import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { FadeInView } from "@/components/motion/PageTransition";
import { SectionSigil } from "./SectionSigil";

interface Props {
  ctaAction: () => void;
}

export function LandingFinalCTA({ ctaAction }: Props) {
  const { t } = useTranslation("landing");

  return (
    <section className="relative overflow-hidden py-36 sm:py-48" aria-label="Get started">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[180px]" />
      </div>
      <div className="relative max-w-2xl mx-auto px-5 sm:px-6 text-center">
        <FadeInView>
          <SectionSigil className="mb-12" />
          <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold tracking-[-0.01em] text-foreground mb-7 leading-[1.1]">
            {t("final_cta.title_line1")}
            <br />
            <span className="text-[hsl(var(--gold-oxide))]">{t("final_cta.title_line2")}</span>
          </h2>
          <p className="text-[15px] text-muted-foreground mb-16 max-w-[420px] mx-auto leading-[1.75]">
            {t("final_cta.subtitle")}
          </p>
        </FadeInView>
        <FadeInView delay={0.15}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-12">
            <Button size="lg" onClick={ctaAction} className="cta-glow gap-2.5 px-10 h-[52px] sm:h-14 min-h-[48px] bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] font-semibold shadow-lg shadow-[hsl(var(--gold-oxide)/0.18)] w-full sm:w-auto rounded-lg transition-all duration-200">
              {t("final_cta.cta_start")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })} className="gap-2.5 h-[52px] sm:h-14 min-h-[48px] w-full sm:w-auto border-border/50 text-muted-foreground hover:bg-accent/8 hover:border-[hsl(var(--gold-oxide)/0.3)] rounded-lg transition-all duration-200">
              <Eye className="h-4 w-4" />
              {t("final_cta.cta_inside")}
            </Button>
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
            {t("final_cta.tagline")}
          </p>
        </FadeInView>
      </div>
    </section>
  );
}
