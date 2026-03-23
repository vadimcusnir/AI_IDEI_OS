import { useSearchParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Coins, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import confetti from "canvas-confetti";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status") || (params.get("session_id") ? "success" : "cancel");
  const { balance } = useCreditBalance();

  useEffect(() => {
    if (status === "success") {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [status]);

  if (status === "success") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
        <SEOHead title="Plată confirmată — AI-IDEI" description="Contul tău a fost alimentat cu succes." />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="max-w-md w-full text-center space-y-6"
        >
          {/* Animated check */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className="mx-auto h-20 w-20 rounded-full bg-status-validated/10 flex items-center justify-center"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
            >
              <CheckCircle2 className="h-10 w-10 text-status-validated" />
            </motion.div>
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Plată confirmată!</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Contul tău a fost alimentat cu succes. NEURONS-ii vor fi disponibili imediat.
            </p>
          </div>

          {/* Balance display */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border"
          >
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Sold curent:</span>
            <span className="text-lg font-bold font-mono">{balance.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">NEURONS</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Button
              onClick={() => navigate("/services")}
              className="gap-2 h-11 px-6"
            >
              <Sparkles className="h-4 w-4" />
              Întoarce-te la Servicii
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/credits")}
              className="gap-2 text-sm"
            >
              <Coins className="h-3.5 w-3.5" />
              Vezi balanța
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Cancel / default
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
      <SEOHead title="Plată anulată — AI-IDEI" description="Plata a fost anulată. Niciun fond nu a fost retras." />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="mx-auto h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Plată anulată</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nu a fost retras niciun fond din contul tău. Poți încerca din nou oricând.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => navigate("/pricing")}
            className="gap-2 h-11 px-6"
          >
            <RotateCcw className="h-4 w-4" />
            Încearcă din nou
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/services")}
            className="gap-2 text-sm"
          >
            Întoarce-te la Servicii
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
