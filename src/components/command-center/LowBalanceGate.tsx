/**
 * LowBalanceGate — Auto-triggered modal when balance hits 0.
 * Single CTA: Upgrade to Pro.
 * No analysis paralysis — one action only.
 */
import { motion } from "framer-motion";
import { AlertTriangle, Rocket, Zap, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LowBalanceGateProps {
  balance: number;
  onDismiss: () => void;
  /** Optional: cost that triggered the gate */
  requiredCredits?: number;
}

export function LowBalanceGate({ balance, onDismiss, requiredCredits }: LowBalanceGateProps) {
  const navigate = useNavigate();

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
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Neurons Insuficienți</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Balanță: <span className="font-mono font-bold text-destructive">{balance} N</span>
              {requiredCredits && (
                <> • Necesar: <span className="font-mono font-bold text-foreground">{requiredCredits} N</span></>
              )}
            </p>
            {deficit > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Deficit: <span className="font-mono font-bold text-destructive">{deficit} N</span>
              </p>
            )}
          </div>
        </div>

        {/* Primary CTA */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            className="w-full h-12 text-sm font-bold gap-2"
            onClick={() => { navigate("/credits"); onDismiss(); }}
          >
            <Rocket className="h-4 w-4" />
            Upgrade to PRO — $47/lună
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            10.000 NEURONS + 25% discount execuție
          </p>

          {/* Quick top-up for users who just need a bit more */}
          <Button
            variant="outline"
            className="w-full h-10 text-xs gap-2"
            onClick={() => { navigate("/credits"); onDismiss(); }}
          >
            <Coins className="h-3.5 w-3.5" />
            Top-up rapid — de la $2
          </Button>

          <button
            onClick={onDismiss}
            className="w-full text-center text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
          >
            Continuă fără credite
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
