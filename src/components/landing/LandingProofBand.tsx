import { useTranslation } from "react-i18next";
import { FadeInView } from "@/components/motion/PageTransition";

export function LandingProofBand() {
  const { t } = useTranslation("landing");
  const stats = t("proof_band.stats", { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="border-y border-border/50 py-12 sm:py-16 bg-card/40" aria-label="Key statistics">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-14">
          {stats.map((stat, i) => (
            <FadeInView key={i} delay={i * 0.08}>
              <div className="text-center group">
                <p className="text-4xl sm:text-5xl font-mono font-bold text-[hsl(var(--gold-oxide))] tracking-[-0.02em] leading-none group-hover:scale-105 transition-transform duration-300">{stat.value}</p>
                <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-muted-foreground mt-3 uppercase">{stat.label}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
