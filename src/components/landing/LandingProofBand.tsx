/**
 * Proof Band — stat counters. No motion on numbers.
 */

const STATS = [
  { value: "50+", label: "Deliverables per upload" },
  { value: "12", label: "Output families" },
  { value: "∞", label: "Knowledge reuse" },
  { value: "<2min", label: "Idea to asset" },
];

export function LandingProofBand() {
  return (
    <section className="border-y border-border py-6 sm:py-10" aria-label="Key statistics">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-mono font-bold text-[hsl(var(--gold-oxide))]">{stat.value}</p>
              <p className="text-xs sm:text-sm font-mono tracking-[0.12em] text-muted-foreground mt-2">{stat.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
