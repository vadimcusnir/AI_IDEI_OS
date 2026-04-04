import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { FadeInView } from "@/components/motion/PageTransition";
import { SectionSigil } from "./SectionSigil";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

interface Props {
  ctaAction: () => void;
}

export function LandingFinalCTA({ ctaAction }: Props) {
  const { t } = useTranslation("landing");

  return (
    <section className="relative overflow-hidden py-32 sm:py-48" aria-label="Get started">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold/[0.04] rounded-full blur-[180px]" />
      </div>
      <ContentBoundary width="narrow" className="relative text-center">
        <FadeInView>
          <SectionSigil className="mb-12" />
          <h2 className="text-h2 text-foreground mb-8 leading-tight">
            {t("final_cta.title_line1")}
            <br />
            <span className="text-gold">{t("final_cta.title_line2")}</span>
          </h2>
          <p className="text-body text-muted-foreground mb-16 max-w-md mx-auto leading-relaxed">
            {t("final_cta.subtitle")}
          </p>
        </FadeInView>
        <FadeInView delay={0.15}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
            <Button size="lg" onClick={ctaAction} className="cta-canon cta-glow gap-2.5 px-10 h-12 sm:h-14 bg-gold hover:bg-gold-dim text-obsidian font-semibold shadow-lg shadow-gold/18 w-full sm:w-auto rounded-lg transition-all duration-200">
              {t("final_cta.cta_start")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })} className="cta-canon gap-2.5 h-12 sm:h-14 w-full sm:w-auto border-border/50 text-muted-foreground hover:bg-accent/8 hover:border-gold/30 rounded-lg transition-all duration-200">
              <Eye className="h-4 w-4" />
              {t("final_cta.cta_inside")}
            </Button>
          </div>
          <p className="text-eyebrow font-mono tracking-[0.2em] text-muted-foreground">
            {t("final_cta.tagline")}
          </p>
        </FadeInView>
      </ContentBoundary>
    </section>
  );
}
