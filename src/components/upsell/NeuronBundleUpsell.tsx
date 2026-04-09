/**
 * NeuronBundleUpsell — Contextual upsell shown after service execution
 * when user's balance drops below threshold.
 * Anchors perceived value to the cost just spent.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Zap, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NeuronBundleUpsellProps {
  balance: number;
  creditsJustSpent: number;
  className?: string;
  onDismiss?: () => void;
}

const QUICK_BUNDLES = [
  { key: "micro", neurons: 1000, price: 2, label: "Quick top-up" },
  { key: "standard", neurons: 10000, price: 20, label: "Best value", popular: true },
  { key: "growth", neurons: 23500, price: 47, label: "Power user" },
];

export function NeuronBundleUpsell({ balance, creditsJustSpent, className, onDismiss }: NeuronBundleUpsellProps) {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState<string | null>(null);

  // Only show if balance is low relative to recent spend
  const runsRemaining = creditsJustSpent > 0 ? Math.floor(balance / creditsJustSpent) : 999;
  if (runsRemaining > 5) return null;

  const handleBuy = async (packageKey: string) => {
    setProcessing(packageKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-topup-checkout", {
        body: { package_key: packageKey },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Checkout failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className={cn(
      "relative rounded-xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3",
      className
    )}>
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1">
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            {runsRemaining <= 1
              ? "Running low on NEURONS"
              : `~${runsRemaining} runs remaining`}
          </p>
          <p className="text-micro text-muted-foreground">
            Top up to keep your pipeline running
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_BUNDLES.map((pkg) => (
          <button
            key={pkg.key}
            onClick={() => handleBuy(pkg.key)}
            disabled={!!processing}
            className={cn(
              "relative flex flex-col items-center rounded-lg border p-3 transition-all hover:border-primary/40",
              pkg.popular ? "border-primary/30 bg-primary/[0.05]" : "border-border"
            )}
          >
            {pkg.popular && (
              <Badge className="absolute -top-1.5 text-nano px-1.5 py-0">Best</Badge>
            )}
            <span className="text-base font-bold font-mono">${pkg.price}</span>
            <span className="text-nano text-muted-foreground">{pkg.neurons.toLocaleString()}N</span>
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-micro text-muted-foreground h-7 gap-1"
        onClick={() => navigate("/pricing")}
      >
        View all plans & packages <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
