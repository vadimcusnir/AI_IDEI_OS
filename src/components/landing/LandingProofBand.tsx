import { useTranslation } from "react-i18next";

export function LandingProofBand() {
  const { t } = useTranslation("landing");
  const stats = t("proof_band.stats", { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="border-y border-border/50 py-10 sm:py-14 bg-card/40" aria-label="Key statistics">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-14">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl sm:text-5xl font-mono font-bold text-[hsl(var(--gold-oxide))] tracking-[-0.02em] leading-none">{stat.value}</p>
              <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-muted-foreground mt-3 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
