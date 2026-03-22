import { motion, MotionValue } from "framer-motion";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtractionEngine } from "./ExtractionEngine";
import { RefObject } from "react";

interface Props {
  heroRef: RefObject<HTMLDivElement | null>;
  heroOpacity: MotionValue<number>;
  ctaAction: () => void;
}

export function LandingHero({ heroRef, heroOpacity, ctaAction }: Props) {
  return (
    <section ref={heroRef} className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[hsl(var(--gold-oxide)/0.03)] blur-[200px]" />
      </div>

      <motion.div style={{ opacity: heroOpacity }} className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-20 sm:pt-28 md:pt-36 pb-8 sm:pb-12 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-[10px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.7)] mb-8"
        >
          KNOWLEDGE EXTRACTION ENGINE
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="heading-1 mb-6 px-2 text-[hsl(var(--ivory))]"
        >
          The closest thing to a{" "}
          <span className="text-[hsl(var(--gold-oxide))]">magic button</span>
          {" "}for copywriting and marketing
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-sm sm:text-base text-[hsl(var(--ivory-dim)/0.7)] leading-relaxed max-w-2xl mx-auto mb-12"
        >
          Turn one rough idea into persuasive copy, stronger offers, content assets, and real marketing execution with practical AI frameworks, prompts, and assistants built for real work.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16"
        >
          <Button size="lg" onClick={ctaAction} className="gap-2 text-sm px-10 h-12 sm:h-14 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))] font-semibold shadow-lg shadow-[hsl(var(--gold-oxide)/0.15)] w-full sm:w-auto">
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 text-sm h-12 sm:h-14 w-full sm:w-auto border-[hsl(var(--ivory-dim)/0.15)] text-[hsl(var(--ivory-dim)/0.7)] hover:bg-[hsl(var(--ivory-dim)/0.05)]">
            <Eye className="h-4 w-4" />
            See the Mechanism
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="relative max-w-4xl mx-auto px-4 pb-16 sm:pb-24"
      >
        <ExtractionEngine />
      </motion.div>
    </section>
  );
}
