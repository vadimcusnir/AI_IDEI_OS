import { useTranslation } from "react-i18next";
import { FadeInView } from "@/components/motion/PageTransition";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

export function LandingProofBand() {
  const { t } = useTranslation("landing");
  const stats = t("proof_band.stats", { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="border-y border-border/50 py-12 sm:py-16 bg-card/40" aria-label="Key statistics">
      <ContentBoundary width="default">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((stat, i) => (
            <FadeInView key={i} delay={i * 0.08}>
              <div className="text-center group">
                <p className="text-4xl sm:text-5xl font-mono font-bold text-gold tracking-tight leading-none group-hover:scale-105 transition-transform duration-300">{stat.value}</p>
                <p className="text-eyebrow font-mono tracking-[0.2em] text-muted-foreground mt-3">{stat.label}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </ContentBoundary>
    </section>
  );
}
