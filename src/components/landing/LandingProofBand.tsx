import { useTranslation } from "react-i18next";

export function LandingProofBand() {
  const { t } = useTranslation("landing");
  const stats = t("proof_band.stats", { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="border-y border-border/60 py-8 sm:py-12 bg-card/30" aria-label="Key statistics">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-mono font-bold text-[hsl(var(--gold-oxide))] tracking-tight">{stat.value}</p>
              <p className="text-[11px] sm:text-xs font-mono tracking-[0.15em] text-muted-foreground mt-2.5 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
