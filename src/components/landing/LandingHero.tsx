import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagicButton } from "./MagicButton";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  heroRef: RefObject<HTMLDivElement | null>;
  ctaAction: () => void;
}

type Stats = { neurons: number; episodes: number; services: number; articles: number };
const FALLBACK: Stats = { neurons: 402, episodes: 46, services: 142, articles: 12 };

export function LandingHero({ heroRef, ctaAction }: Props) {
  const { t } = useTranslation("landing");
  const reduced = useReducedMotion();
  const [stats, setStats] = useState<Stats>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_public_landing_stats");
      if (!error && data && !cancelled) setStats(data as Stats);
    })();
    return () => { cancelled = true; };
  }, []);

  const fadeUp = reduced
    ? {}
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  const trustLine = t("hero.trust_template", {
    neurons: stats.neurons.toLocaleString(),
    episodes: stats.episodes.toLocaleString(),
    services: stats.services.toLocaleString(),
  });

  return (
    <section ref={heroRef} className="relative overflow-hidden" aria-label="Hero">
      {/* Layered ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-[55%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-gold/5 blur-[180px]" />
        <div className="absolute bottom-0 left-[30%] w-[350px] h-[250px] rounded-full bg-gold/[0.025] blur-[140px]" />
      </div>

      <ContentBoundary width="default" className="relative pt-24 sm:pt-36 md:pt-44 pb-16 sm:pb-24 text-center">
        {/* Eyebrow */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-eyebrow font-mono tracking-[0.35em] text-gold mb-8 sm:mb-10"
        >
          {t("hero.tagline")}
        </motion.p>

        {/* H1 — short, anchored */}
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-h1 text-foreground mb-6"
        >
          {t("hero.title_prefix")}{" "}
          <MagicButton className="text-gold">{t("hero.title_highlight")}</MagicButton>
          {" "}{t("hero.title_suffix")}
        </motion.h1>

        {/* Subtitle — quantified */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-body sm:text-body-lg text-muted-foreground leading-relaxed max-w-[40rem] mx-auto mb-10 sm:mb-12 px-2"
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* CTA hierarchy — primary filled, secondary text-link */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col items-center justify-center gap-5 mb-8 px-4 sm:px-0"
        >
          <Button
            size="lg"
            onClick={ctaAction}
            className="cta-canon cta-glow gap-2.5 text-sm font-semibold px-12 h-14 bg-gold hover:bg-gold-dim text-obsidian shadow-xl shadow-gold/25 w-full sm:w-auto rounded-lg transition-all duration-200"
          >
            {t("hero.cta_start")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })}
            className="text-sm text-muted-foreground hover:text-gold underline underline-offset-4 decoration-gold/30 hover:decoration-gold transition-colors duration-200 focus-ring rounded"
          >
            {t("hero.cta_mechanism")}
          </button>
        </motion.div>

        {/* Trust line — live metrics */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-eyebrow font-mono tracking-[0.18em] text-muted-foreground/70 tabular-nums"
        >
          {trustLine}
        </motion.p>
      </ContentBoundary>
    </section>
  );
}
