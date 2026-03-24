import { motion } from "framer-motion";
import { OutputGalaxy } from "./OutputGalaxy";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function LandingOutputGalaxy() {
  const { t } = useTranslation("landing");

  return (
    <section id="outputs" className="py-24 sm:py-36 border-y border-border/60 relative" aria-labelledby="outputs-heading">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--gold-oxide)/0.015)] to-transparent pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-10 sm:mb-12">
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("output_galaxy.label")}</span>
          <h2 id="outputs-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">{t("output_galaxy.title")}</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-[1.7]">{t("output_galaxy.subtitle")}</p>
        </motion.div>
        <OutputGalaxy />
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-10 text-[11px] font-mono tracking-[0.15em] uppercase text-[hsl(var(--gold-oxide)/0.7)]">
          {t("output_galaxy.footer")}
        </motion.p>
      </div>
    </section>
  );
}
