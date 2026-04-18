/**
 * CountUpStat — Single animated metric. Used inside LandingProofBand.
 */
import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  target: number;
  label: string;
}

export function CountUpStat({ target, label }: Props) {
  const { ref, value } = useCountUp({ target });

  return (
    <div ref={ref as any} className="text-center group">
      <p className="text-4xl sm:text-5xl font-mono font-bold text-gold tracking-tight leading-none tabular-nums group-hover:scale-105 transition-transform duration-300">
        {value.toLocaleString()}
      </p>
      <p className="text-eyebrow font-mono tracking-[0.2em] text-muted-foreground mt-3">{label}</p>
    </div>
  );
}
