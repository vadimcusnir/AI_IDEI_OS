import { ArrowRight, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";

export function LandingTranscribeCTA() {
  const navigate = useNavigate();
  const { t } = useTranslation("landing");

  return (
    <section className="py-20 sm:py-28" aria-label="YouTube transcription">
      <FadeInView className="max-w-3xl mx-auto px-5 sm:px-6">
        <div className="relative rounded-xl border border-border/50 bg-card p-9 sm:p-12 flex flex-col sm:flex-row items-center gap-8 sm:gap-14 overflow-hidden landing-card group">
          <div className="absolute top-0 right-0 w-56 h-56 bg-[hsl(var(--signal-red)/0.03)] rounded-full blur-[120px] pointer-events-none group-hover:bg-[hsl(var(--signal-red)/0.05)] transition-colors duration-500" />
          <div className="relative shrink-0 w-16 h-16 rounded-xl bg-[hsl(var(--signal-red)/0.07)] flex items-center justify-center group-hover:bg-[hsl(var(--signal-red)/0.12)] group-hover:scale-105 transition-all duration-300">
            <Youtube className="h-8 w-8 text-[hsl(var(--signal-red))]" />
          </div>
          <div className="relative flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-foreground mb-3">{t("transcribe_cta.title")}</h3>
            <p className="text-sm text-muted-foreground leading-[1.7] mb-5 sm:mb-0">{t("transcribe_cta.desc")}</p>
          </div>
          <Button
            onClick={() => navigate("/extractor")}
            size="sm"
            className="relative gap-2 text-sm h-11 min-h-[44px] px-7 bg-[hsl(var(--signal-red)/0.1)] hover:bg-[hsl(var(--signal-red)/0.18)] text-foreground border border-[hsl(var(--signal-red)/0.2)] shrink-0 rounded-lg transition-all duration-200"
          >
            {t("transcribe_cta.button")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </FadeInView>
    </section>
  );
}
