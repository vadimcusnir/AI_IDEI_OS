/**
 * ServicePricingBreakdown — Shows real cost economics.
 * cost/output, savings with Pro, ROI clarity.
 */
import { motion } from "framer-motion";
import { Coins, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ServicePricingBreakdownProps {
  userTier: string;
  compact?: boolean;
}

const TIERS = [
  { key: "free", label: "Free", discount: 0, monthly: "0", neurons: "500 bonus" },
  { key: "core", label: "Core", discount: 10, monthly: "$11", neurons: "2.000 N" },
  { key: "pro", label: "Pro", discount: 25, monthly: "$47", neurons: "10.000 N" },
  { key: "elite", label: "Elite", discount: 40, monthly: "$128", neurons: "30.000 N" },
];

export function ServicePricingBreakdown({ userTier, compact }: ServicePricingBreakdownProps) {
  const navigate = useNavigate();

  // Example: average service = 200 NEURONS
  const avgCost = 200;
  const costPerNeuron = 0.002;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-ai-accent" />
        <h2 className="text-sm font-bold tracking-tight">Economie reală</h2>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Cost mediu/serviciu", value: `${avgCost} N`, sub: `~$${(avgCost * costPerNeuron).toFixed(2)}` },
          { label: "Outputs/serviciu", value: "50+", sub: "deliverables" },
          { label: "Cost/output", value: "$0.14", sub: "vs $50-200 manual" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-mono font-bold text-foreground">{m.value}</p>
            <p className="text-micro text-muted-foreground mt-0.5">{m.sub}</p>
            <p className="text-nano text-muted-foreground/60 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tier savings */}
      {!compact && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-4 text-nano font-bold uppercase tracking-wider bg-muted/50 px-3 py-2">
            <span>Plan</span>
            <span className="text-center">Preț</span>
            <span className="text-center">Discount execuție</span>
            <span className="text-right">NEURONS</span>
          </div>
          {TIERS.map((t, i) => {
            const isCurrentTier = t.key === userTier;
            return (
              <div
                key={t.key}
                className={`grid grid-cols-4 px-3 py-2 text-xs items-center ${
                  isCurrentTier ? "bg-primary/5 border-l-2 border-primary" : i % 2 === 0 ? "bg-card" : "bg-card/50"
                }`}
              >
                <span className="font-medium flex items-center gap-1.5">
                  {t.key === "elite" && <Crown className="h-3 w-3 text-amber-500" />}
                  {t.label}
                  {isCurrentTier && (
                    <span className="text-nano bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">TU</span>
                  )}
                </span>
                <span className="text-center text-muted-foreground">{t.monthly}</span>
                <span className="text-center font-semibold text-primary">
                  {t.discount > 0 ? `-${t.discount}%` : "—"}
                </span>
                <span className="text-right font-mono">{t.neurons}</span>
              </div>
            );
          })}
        </div>
      )}

      {userTier === "free" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs gap-2"
          onClick={() => navigate("/credits")}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Upgrade pentru discount la execuție
          <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </motion.section>
  );
}
