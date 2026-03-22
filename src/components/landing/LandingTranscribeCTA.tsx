/**
 * Transcribe CTA — YouTube transcript feature highlight.
 */
import { motion } from "framer-motion";
import { ArrowRight, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function LandingTranscribeCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={0} variants={fadeUp} className="max-w-3xl mx-auto px-5 sm:px-6">
        <div className="relative rounded-xl border border-[hsl(var(--ivory-dim)/0.08)] bg-[hsl(var(--obsidian-light)/0.4)] p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[hsl(var(--signal-red)/0.04)] rounded-full blur-[80px]" />
          <div className="relative shrink-0 w-14 h-14 rounded-xl bg-[hsl(var(--signal-red)/0.08)] flex items-center justify-center">
            <Youtube className="h-7 w-7 text-[hsl(var(--signal-red)/0.7)]" />
          </div>
          <div className="relative flex-1 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--ivory)/0.9)] mb-2">
              YouTube → Transcript in 2 seconds
            </h3>
            <p className="text-xs text-[hsl(var(--ivory-dim)/0.5)] leading-relaxed mb-4 sm:mb-0">
              Paste a YouTube link, download the full transcript. First one free.
            </p>
          </div>
          <Button
            onClick={() => navigate("/transcribe")}
            size="sm"
            className="relative gap-2 text-xs h-10 px-6 bg-[hsl(var(--signal-red)/0.15)] hover:bg-[hsl(var(--signal-red)/0.25)] text-[hsl(var(--ivory)/0.9)] border border-[hsl(var(--signal-red)/0.2)] shrink-0"
          >
            Try Transcribe
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
