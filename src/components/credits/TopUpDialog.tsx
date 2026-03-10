import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Coins, Plus, Zap, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const PACKAGES = [
  { neurons: 500, price: 5, icon: Zap, label: "Starter", popular: false },
  { neurons: 1000, price: 10, icon: Sparkles, label: "Standard", popular: true },
  { neurons: 5000, price: 47, icon: Crown, label: "Pro", popular: false },
];

interface TopUpDialogProps {
  onSuccess: () => void;
}

export function TopUpDialog({ onSuccess }: TopUpDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);

  const handleTopUp = async (neurons: number) => {
    if (!user) return;
    setProcessing(neurons);

    try {
      // Insert top-up transaction
      const { error: txError } = await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: neurons,
        type: "topup",
        description: `TOPUP: +${neurons} NEURONS`,
      });
      if (txError) throw txError;

      // Update balance
      const { data: current } = await supabase
        .from("user_credits")
        .select("balance, total_earned")
        .eq("user_id", user.id)
        .maybeSingle();

      if (current) {
        const { error: updateError } = await supabase
          .from("user_credits")
          .update({
            balance: current.balance + neurons,
            total_earned: current.total_earned + neurons,
          })
          .eq("user_id", user.id);
        if (updateError) throw updateError;
      }

      toast.success(`+${neurons} NEURONS adăugați cu succes!`);
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Eroare la încărcare: " + (err.message || "Încearcă din nou"));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Top-up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Încarcă NEURONS</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-4">
          Alege un pachet pentru a-ți reîncărca balanța de credite.
        </p>
        <div className="space-y-2">
          {PACKAGES.map(pkg => {
            const Icon = pkg.icon;
            const isProcessing = processing === pkg.neurons;
            return (
              <button
                key={pkg.neurons}
                onClick={() => handleTopUp(pkg.neurons)}
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
                  <Icon className={cn("h-5 w-5", pkg.popular ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{pkg.label}</span>
                    {pkg.popular && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {pkg.neurons.toLocaleString()} NEURONS
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold font-mono">${pkg.price}</span>
                  <p className="text-[9px] text-muted-foreground">
                    ${(pkg.price / pkg.neurons * 1000).toFixed(0)}/1K
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
          Creditele sunt adăugate instant în cont.
        </p>
      </DialogContent>
    </Dialog>
  );
}
