import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Coins, Zap, Sparkles, Crown, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const PACKAGES = [
  { key: "starter", neurons: 5500, price: 11, icon: Zap, label: "Starter" },
  { key: "standard", neurons: 10000, price: 20, icon: Sparkles, label: "Standard", popular: true },
  { key: "growth", neurons: 23500, price: 47, icon: Crown, label: "Growth" },
];

interface InlineTopUpProps {
  needed?: number;
  balance?: number;
  onDismiss?: () => void;
  compact?: boolean;
}

export function InlineTopUp({ needed, balance = 0, onDismiss, compact = false }: InlineTopUpProps) {
  const { t } = useTranslation(["common", "errors", "pages"]);
  const { user } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);

  const deficit = needed ? Math.max(0, needed - balance) : 0;

  const handleTopUp = async (packageKey: string) => {
    if (!user) return;
    setProcessing(packageKey);

    try {
      const { data, error } = await supabase.functions.invoke("create-topup-checkout", {
        body: { package_key: packageKey },
      });

      if (error) throw new Error(error.message || "Error creating checkout session");
      if (!data?.url) throw new Error("Checkout URL not received");

      window.open(data.url, "_blank");
      toast.info(t("pages:credits.topup_complete_payment"));
    } catch (err: any) {
      toast.error(err.message || t("errors:generic"));
    } finally {
      setProcessing(null);
    }
  };

  // Find recommended package (first one that covers the deficit)
  const recommended = PACKAGES.find(p => p.neurons >= deficit) || PACKAGES[PACKAGES.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Warning header */}
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Insufficient NEURONS</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {needed ? (
              <>You need <span className="font-mono font-semibold text-foreground">{needed}</span> but only have <span className="font-mono font-semibold text-foreground">{balance}</span>. Top up to continue.</>
            ) : (
              <>Your balance is too low to run this analysis. Top up to continue.</>
            )}
          </p>
        </div>
      </div>

      {/* Package options */}
      <div className={cn("gap-2", compact ? "flex" : "grid grid-cols-3")}>
        {PACKAGES.map(pkg => {
          const Icon = pkg.icon;
          const isProcessing = processing === pkg.key;
          const isRecommended = pkg.key === recommended.key;
          const coversDeficit = pkg.neurons >= deficit;

          return (
            <button
              key={pkg.key}
              onClick={() => handleTopUp(pkg.key)}
              disabled={processing !== null}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center relative",
                isRecommended
                  ? "border-primary/50 bg-primary/5 hover:border-primary ring-1 ring-primary/20"
                  : coversDeficit
                    ? "border-border bg-card hover:border-primary/30"
                    : "border-border bg-card/50 hover:border-border",
                isProcessing && "opacity-60 pointer-events-none"
              )}
            >
              {isRecommended && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-nano font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  Best
                </span>
              )}
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                isRecommended ? "bg-primary/15" : "bg-muted"
              )}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Icon className={cn("h-4 w-4", isRecommended ? "text-primary" : "text-muted-foreground")} />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold block">{pkg.neurons.toLocaleString()}</span>
                <span className="text-nano text-muted-foreground">NEURONS</span>
              </div>
              <span className="text-sm font-bold font-mono">${pkg.price}</span>
            </button>
          );
        })}
      </div>

      {/* Balance indicator + dismiss */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
          <Coins className="h-3 w-3" />
          <span>Current: <span className="font-mono font-semibold">{balance}</span> NEURONS</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-micro text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            Dismiss
          </button>
        )}
      </div>
    </motion.div>
  );
}
