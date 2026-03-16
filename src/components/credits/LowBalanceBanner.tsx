import { useNavigate } from "react-router-dom";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { AlertTriangle, Coins, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function LowBalanceBanner() {
  const { user } = useAuth();
  const { balance, loading } = useCreditBalance();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<number | null>(null);

  if (!user || loading) return null;

  const severity =
    balance <= 20 ? "critical" :
    balance <= 50 ? "warning" :
    balance <= 100 ? "info" : null;

  if (!severity || dismissed === severity.length) return null;

  // Allow dismissing once per session per severity
  const storageKey = `low_balance_dismissed_${severity}`;
  if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) return null;

  const config = {
    critical: {
      bg: "bg-destructive/10 border-destructive/30",
      text: "text-destructive",
      icon: "text-destructive",
      label: "Credite aproape epuizate!",
      cta: "Reîncarcă acum",
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      icon: "text-amber-500",
      label: "Credite scăzute",
      cta: "Top-up",
    },
    info: {
      bg: "bg-primary/5 border-primary/20",
      text: "text-primary",
      icon: "text-primary",
      label: "Credite în scădere",
      cta: "Vezi balanța",
    },
  }[severity];

  const handleDismiss = () => {
    sessionStorage.setItem(storageKey, "1");
    setDismissed(Date.now());
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className={cn("flex items-center gap-2 px-3 py-2 border-b text-xs", config.bg)}>
            <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0", config.icon)} />
            <span className={cn("font-medium", config.text)}>{config.label}</span>
            <span className="text-muted-foreground">
              — <span className="font-mono font-semibold">{balance}</span> NEURONS
            </span>
            <div className="flex-1" />
            <button
              onClick={() => navigate("/credits")}
              className={cn("flex items-center gap-1 font-semibold hover:underline", config.text)}
            >
              {config.cta} <ArrowRight className="h-3 w-3" />
            </button>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground/50 hover:text-muted-foreground ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
