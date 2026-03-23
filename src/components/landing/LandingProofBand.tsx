import { useTranslation } from "react-i18next";

export function LandingProofBand() {
  const { t } = useTranslation("landing");
  const stats = t("proof_band.stats", { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="border-y border-border py-6 sm:py-10" aria-label="Key statistics">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl sm:text-3xl font-mono font-bold text-[hsl(var(--gold-oxide))]">{stat.value}</p>
              <p className="text-xs sm:text-sm font-mono tracking-[0.12em] text-muted-foreground mt-2">{stat.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}