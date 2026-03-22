import { motion } from "framer-motion";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtractionEngine } from "./ExtractionEngine";
import { RefObject } from "react";

interface Props {
  heroRef: RefObject<HTMLDivElement | null>;
  ctaAction: () => void;
}

export function LandingHero({ heroRef, ctaAction }: Props) {
  return (
    <section ref={heroRef} className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[hsl(var(--gold-oxide)/0.03)] blur-[200px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-16 sm:pt-28 md:pt-36 pb-6 sm:pb-12 text-center">
        <p className="text-[11px] sm:text-xs font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.8)] mb-6 sm:mb-8">
          KNOWLEDGE EXTRACTION ENGINE
        </p>

        <h1 className="heading-1 mb-5 sm:mb-6 px-1 text-[hsl(var(--ivory))]">
          The closest thing to a{" "}
          <span className="text-[hsl(var(--gold-oxide))]">magic button</span>
          {" "}for copywriting and marketing
        </h1>

        <p className="text-base sm:text-lg text-[hsl(var(--ivory-dim)/0.75)] leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-12 px-2">
          Turn one rough idea into persuasive copy, stronger offers, content assets, and real marketing execution with practical AI frameworks, prompts, and assistants built for real work.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4 sm:px-0">
          <Button size="lg" onClick={ctaAction} className="gap-2 text-sm px-10 h-12 sm:h-14 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))] font-semibold shadow-lg shadow-[hsl(var(--gold-oxide)/0.15)] w-full sm:w-auto min-h-[44px]">
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 text-sm h-12 sm:h-14 w-full sm:w-auto border-[hsl(var(--ivory-dim)/0.2)] text-[hsl(var(--ivory-dim)/0.8)] hover:bg-[hsl(var(--ivory-dim)/0.05)] min-h-[44px]">
            <Eye className="h-4 w-4" />
            See the Mechanism
          </Button>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-2 sm:px-4 pb-12 sm:pb-24">
        <ExtractionEngine />
      </div>
    </section>
  );
}
