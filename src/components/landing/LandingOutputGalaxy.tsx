import { motion } from "framer-motion";
import { OutputGalaxy } from "./OutputGalaxy";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

export function LandingOutputGalaxy() {
  const { t } = useTranslation("landing");
  const reduced = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: reduced ? 0 : 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: reduced ? 0 : 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
  };

  return (
    <section id="outputs" className="py-32 sm:py-44 border-y border-border/50 relative" aria-labelledby="outputs-heading">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--gold-oxide)/0.015)] to-transparent pointer-events-none" />
      <ContentBoundary width="default" className="relative">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-16 sm:mb-20">
          <span className="text-eyebrow font-mono tracking-[0.35em] text-[hsl(var(--gold-oxide))] mb-6 block">{t("output_galaxy.label")}</span>
          <h2 id="outputs-heading" className="text-h2 text-foreground mb-6">{t("output_galaxy.title")}</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto leading-relaxed">{t("output_galaxy.subtitle")}</p>
        </motion.div>
        <OutputGalaxy />
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-12 text-eyebrow font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide)/0.6)]">
          {t("output_galaxy.footer")}
        </motion.p>
      </ContentBoundary>
    </section>
  );
}
