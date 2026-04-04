import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coins, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface NeuronBundleUpsellProps {
  neuronsSpent: number;
  currentBalance: number;
  className?: string;
}

const BUNDLES = [
  { neurons: 1000, price: 2, label: "Micro" },
  { neurons: 5500, price: 11, label: "Starter" },
  { neurons: 10000, price: 20, label: "Standard" },
  { neurons: 23500, price: 47, label: "Growth" },
];

export function NeuronBundleUpsell({ neuronsSpent, currentBalance, className }: NeuronBundleUpsellProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  // Recommend a bundle based on recent spend
  const recommendedBundle = BUNDLES.find(b => b.neurons >= neuronsSpent * 3) || BUNDLES[2];
  const savingsPerNeuron = ((0.002 - (recommendedBundle.price / recommendedBundle.neurons)) / 0.002 * 100).toFixed(0);

  const isLowBalance = currentBalance < neuronsSpent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={cn(
        "mt-4 p-4 rounded-xl border",
        isLowBalance
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold mb-0.5">
            {isLowBalance
              ? t("upsell.low_balance_title", { defaultValue: "Running low on NEURONS" })
              : t("upsell.continue_title", { defaultValue: "Keep the momentum going" })}
          </p>
          <p className="text-micro text-muted-foreground mb-3">
            {t("upsell.spend_context", {
              defaultValue: "You just used {{spent}}N. The {{bundle}} pack ({{neurons}}N) covers ~{{runs}} more runs.",
              spent: neuronsSpent,
              bundle: recommendedBundle.label,
              neurons: recommendedBundle.neurons.toLocaleString(),
              runs: Math.floor(recommendedBundle.neurons / neuronsSpent),
            })}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              className="text-xs gap-1.5 h-7"
              onClick={() => navigate("/credits")}
            >
              <Coins className="h-3 w-3" />
              {t("upsell.topup_cta", {
                defaultValue: "Get {{neurons}}N — ${{price}}",
                neurons: recommendedBundle.neurons.toLocaleString(),
                price: recommendedBundle.price,
              })}
            </Button>
            {Number(savingsPerNeuron) > 0 && (
              <span className="text-nano font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">
                {t("upsell.save", { defaultValue: "Save {{pct}}%", pct: savingsPerNeuron })}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
