/**
 * Transcribe CTA — YouTube transcript feature highlight.
 */
import { ArrowRight, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FadeInView } from "@/components/motion/PageTransition";

export function LandingTranscribeCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16">
      <FadeInView className="max-w-3xl mx-auto px-5 sm:px-6">
        <div className="relative rounded-xl border border-[hsl(var(--ivory-dim)/0.1)] bg-[hsl(var(--obsidian-light)/0.4)] p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[hsl(var(--signal-red)/0.04)] rounded-full blur-[80px]" />
          <div className="relative shrink-0 w-14 h-14 rounded-xl bg-[hsl(var(--signal-red)/0.1)] flex items-center justify-center">
            <Youtube className="h-7 w-7 text-[hsl(var(--signal-red)/0.8)]" />
          </div>
          <div className="relative flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-[hsl(var(--ivory))] mb-2">
              YouTube → Transcript in 2 seconds
            </h3>
            <p className="text-sm text-[hsl(var(--ivory-dim)/0.6)] leading-relaxed mb-4 sm:mb-0">
              Paste a YouTube link, download the full transcript. First one free.
            </p>
          </div>
          <Button
            onClick={() => navigate("/transcribe")}
            size="sm"
            className="relative gap-2 text-sm h-11 min-h-[44px] px-6 bg-[hsl(var(--signal-red)/0.15)] hover:bg-[hsl(var(--signal-red)/0.25)] text-[hsl(var(--ivory))] border border-[hsl(var(--signal-red)/0.25)] shrink-0"
          >
            Try Transcribe
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </FadeInView>
    </section>
  );
}
