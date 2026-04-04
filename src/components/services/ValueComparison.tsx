/**
 * ValueComparison — AI vs Manual comparison table.
 * Forces decision through contrast.
 */
import { motion } from "framer-motion";
import { Check, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS = [
  { metric: "Timp per proiect", manual: "40-80 ore", ai: "< 2 minute", advantage: "2400x" },
  { metric: "Outputs generate", manual: "3-5 manual", ai: "50+ automat", advantage: "10x" },
  { metric: "Cost per output", manual: "$50-200", ai: "$0.14", advantage: "350x" },
  { metric: "Consistență calitate", manual: "Variabilă", ai: "Deterministă", advantage: "∞" },
  { metric: "Scalabilitate", manual: "Liniară", ai: "Instantanee", advantage: "∞" },
];

export function ValueComparison() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold tracking-tight">AI vs. Manual</h2>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 text-micro font-bold uppercase tracking-wider bg-muted/50 px-4 py-2.5">
          <span className="text-muted-foreground">Metric</span>
          <span className="text-muted-foreground text-center">Manual</span>
          <span className="text-primary text-center">AI-IDEI</span>
          <span className="text-muted-foreground text-right">Avantaj</span>
        </div>

        {/* Rows */}
        {ROWS.map((row, i) => (
          <div
            key={row.metric}
            className={cn(
              "grid grid-cols-4 px-4 py-2.5 text-xs items-center",
              i % 2 === 0 ? "bg-card" : "bg-card/50"
            )}
          >
            <span className="font-medium text-foreground">{row.metric}</span>
            <span className="text-center text-muted-foreground flex items-center justify-center gap-1">
              <X className="h-3 w-3 text-destructive/50" />
              {row.manual}
            </span>
            <span className="text-center text-primary font-semibold flex items-center justify-center gap-1">
              <Check className="h-3 w-3 text-primary" />
              {row.ai}
            </span>
            <span className="text-right font-mono font-bold text-primary/80">{row.advantage}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
