import { ArrowRight, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";

export function LandingTranscribeCTA() {
  const navigate = useNavigate();
  const { t } = useTranslation("landing");

  return (
    <section className="py-14 sm:py-20" aria-label="YouTube transcription">
      <FadeInView className="max-w-3xl mx-auto px-5 sm:px-6">
        <div className="relative rounded-xl border border-border/60 bg-card p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 sm:gap-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(var(--signal-red)/0.03)] rounded-full blur-[100px] pointer-events-none" />
          <div className="relative shrink-0 w-16 h-16 rounded-xl bg-[hsl(var(--signal-red)/0.08)] flex items-center justify-center">
            <Youtube className="h-8 w-8 text-[hsl(var(--signal-red))]" />
          </div>
          <div className="relative flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-foreground mb-2.5">{t("transcribe_cta.title")}</h3>
            <p className="text-sm text-muted-foreground leading-[1.7] mb-5 sm:mb-0">{t("transcribe_cta.desc")}</p>
          </div>
          <Button
            onClick={() => navigate("/extractor")}
            size="sm"
            className="relative gap-2 text-sm h-11 min-h-[44px] px-7 bg-[hsl(var(--signal-red)/0.12)] hover:bg-[hsl(var(--signal-red)/0.2)] text-foreground border border-[hsl(var(--signal-red)/0.25)] shrink-0 rounded-lg"
          >
            {t("transcribe_cta.button")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </FadeInView>
    </section>
  );
}
