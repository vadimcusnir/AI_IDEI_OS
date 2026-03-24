import { motion } from "framer-motion";
import { OutputGalaxy } from "./OutputGalaxy";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function LandingOutputGalaxy() {
  const { t } = useTranslation("landing");

  return (
    <section id="outputs" className="py-28 sm:py-40 border-y border-border/50 relative" aria-labelledby="outputs-heading">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--gold-oxide)/0.012)] to-transparent pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-14 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] uppercase text-[hsl(var(--gold-oxide))] mb-6 block">{t("output_galaxy.label")}</span>
          <h2 id="outputs-heading" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.01em] text-foreground mb-6 leading-[1.15]">{t("output_galaxy.title")}</h2>
          <p className="text-[15px] text-muted-foreground max-w-[440px] mx-auto leading-[1.75]">{t("output_galaxy.subtitle")}</p>
        </motion.div>
        <OutputGalaxy />
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-12 text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-[hsl(var(--gold-oxide)/0.6)]">
          {t("output_galaxy.footer")}
        </motion.p>
      </div>
    </section>
  );
}
