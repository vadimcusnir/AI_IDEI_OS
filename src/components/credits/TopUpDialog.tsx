import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Coins, Plus, Zap, Sparkles, Crown, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const PACKAGES = [
  { key: "micro", neurons: 1000, price: 2, icon: Coins, label: "Micro", popular: false },
  { key: "starter", neurons: 5500, price: 11, icon: Zap, label: "Starter", popular: false },
  { key: "standard", neurons: 10000, price: 20, icon: Sparkles, label: "Standard", popular: true },
  { key: "growth", neurons: 23500, price: 47, icon: Crown, label: "Growth", popular: false },
  { key: "scale", neurons: 46000, price: 92, icon: Crown, label: "Scale", popular: false },
];

interface TopUpDialogProps {
  onSuccess: () => void;
}

export function TopUpDialog({ onSuccess }: TopUpDialogProps) {
  const { user } = useAuth();
  const { t } = useTranslation(["common", "errors"]);
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const topup = searchParams.get("topup");
    const sessionId = searchParams.get("session_id");
    if (topup === "success" && sessionId) {
      verifyPayment(sessionId);
      searchParams.delete("topup");
      searchParams.delete("neurons");
      searchParams.delete("session_id");
      setSearchParams(searchParams, { replace: true });
    } else if (topup === "cancelled") {
      toast.info(t("errors:payment_cancelled"));
      searchParams.delete("topup");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-topup", {
        body: { session_id: sessionId },
      });
      if (error) throw new Error(error.message);
      if (data?.already_processed) {
        toast.info(t("errors:payment_already_processed"));
      } else {
        toast.success(t("common:topup_success", { neurons: data?.neurons_added ?? "" }));
      }
      onSuccess();
    } catch (err: any) {
      toast.error(t("errors:payment_error", { message: err.message || "" }));
    }
  };

  const handleTopUp = async (packageKey: string) => {
    if (!user) return;
    setProcessing(packageKey);

    try {
      const { data, error } = await supabase.functions.invoke("create-topup-checkout", {
        body: { package_key: packageKey },
      });

      if (error) throw new Error(error.message || t("errors:checkout_error"));
      if (!data?.url) throw new Error(t("errors:checkout_url_missing"));

      window.open(data.url, "_blank");
      setOpen(false);
      toast.info(t("common:complete_payment_hint"));
    } catch (err: any) {
      toast.error(t("errors:complete_payment_error", { message: err.message || "" }));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          {t("common:top_up")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{t("common:topup_neurons_title")}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-4">
          {t("common:topup_stripe_desc")}
        </p>
        <div className="space-y-2">
          {PACKAGES.map(pkg => {
            const Icon = pkg.icon;
            const isProcessing = processing === pkg.key;
            return (
              <button
                key={pkg.key}
                onClick={() => handleTopUp(pkg.key)}
                disabled={processing !== null}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                  pkg.popular
                    ? "border-primary/40 bg-primary/5 hover:border-primary/60"
                    : "border-border bg-card hover:border-primary/30",
                  isProcessing && "opacity-60 pointer-events-none"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  pkg.popular ? "bg-primary/10" : "bg-muted"
                )}>
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Icon className={cn("h-5 w-5", pkg.popular ? "text-primary" : "text-muted-foreground")} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{pkg.label}</span>
                    {pkg.popular && (
                      <span className="text-nano font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        {t("common:popular")}
                      </span>
                    )}
                  </div>
                  <p className="text-micro text-muted-foreground mt-0.5">
                    {pkg.neurons.toLocaleString()} NEURONS
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold font-mono">${pkg.price}</span>
                  <p className="text-nano text-muted-foreground">
                    ${(pkg.price / pkg.neurons * 1000).toFixed(0)}/1K
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
          <p className="text-micro text-muted-foreground/60 text-center">
            {t("common:topup_stripe_footer")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}