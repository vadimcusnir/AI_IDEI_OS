/**
 * LowBalanceGate — Auto-triggered modal when balance hits 0.
 * Single CTA: Upgrade to Pro.
 */
import { motion } from "framer-motion";
import { AlertTriangle, Rocket, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface LowBalanceGateProps {
  balance: number;
  onDismiss: () => void;
  requiredCredits?: number;
}

export function LowBalanceGate({ balance, onDismiss, requiredCredits }: LowBalanceGateProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  if (balance > 0 && (!requiredCredits || balance >= requiredCredits)) return null;

  const deficit = requiredCredits ? requiredCredits - balance : -balance;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {t("low_balance_title", { defaultValue: "Insufficient Neurons" })}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("balance_label", { defaultValue: "Balance" })}: <span className="font-mono font-bold text-destructive">{balance} N</span>
              {requiredCredits && (
                <> • {t("required_label", { defaultValue: "Required" })}: <span className="font-mono font-bold text-foreground">{requiredCredits} N</span></>
              )}
            </p>
            {deficit > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("deficit_label", { defaultValue: "Deficit" })}: <span className="font-mono font-bold text-destructive">{deficit} N</span>
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <Button
            className="w-full h-12 text-sm font-bold gap-2"
            onClick={() => { navigate("/credits"); onDismiss(); }}
          >
            <Rocket className="h-4 w-4" />
            {t("upgrade_pro_cta", { defaultValue: "Upgrade to PRO — $47/mo" })}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            {t("pro_benefits", { defaultValue: "10,000 NEURONS + 25% execution discount" })}
          </p>

          <Button
            variant="outline"
            className="w-full h-10 text-xs gap-2"
            onClick={() => { navigate("/credits"); onDismiss(); }}
          >
            <Coins className="h-3.5 w-3.5" />
            {t("topup_cta", { defaultValue: "Quick top-up — from $2" })}
          </Button>

          <button
            onClick={onDismiss}
            className="w-full text-center text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
          >
            {t("continue_without", { defaultValue: "Continue without credits" })}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
