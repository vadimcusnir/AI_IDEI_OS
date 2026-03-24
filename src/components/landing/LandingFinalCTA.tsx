import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Props {
  ctaAction: () => void;
}

export function LandingFinalCTA({ ctaAction }: Props) {
  const { t } = useTranslation("landing");

  return (
    <section className="relative overflow-hidden py-28 sm:py-40" aria-label="Get started">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[hsl(var(--gold-oxide)/0.04)] rounded-full blur-[200px]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6 leading-[1.15]">
          {t("final_cta.title_line1")}
          <br />
          <span className="text-[hsl(var(--gold-oxide))]">{t("final_cta.title_line2")}</span>
        </h2>
        <p className="text-base text-muted-foreground mb-14 max-w-md mx-auto leading-[1.7]">
          {t("final_cta.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
          <Button size="lg" onClick={ctaAction} className="gap-2.5 px-10 h-13 sm:h-14 min-h-[48px] bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] font-semibold shadow-lg shadow-[hsl(var(--gold-oxide)/0.2)] w-full sm:w-auto rounded-lg">
            {t("final_cta.cta_start")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })} className="gap-2.5 h-13 sm:h-14 min-h-[48px] w-full sm:w-auto border-border/60 text-muted-foreground hover:bg-accent/8 rounded-lg">
            <Eye className="h-4 w-4" />
            {t("final_cta.cta_inside")}
          </Button>
        </div>
        <p className="text-[11px] sm:text-xs font-mono tracking-[0.15em] uppercase text-muted-foreground">
          {t("final_cta.tagline")}
        </p>
      </div>
    </section>
  );
}
