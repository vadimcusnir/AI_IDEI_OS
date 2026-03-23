import { useNavigate } from "react-router-dom";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Zap, Sparkles, Crown, ArrowRight, Check, Coins, Gift,
} from "lucide-react";

const TOP_UP_PACKAGES = [
  { key: "starter", neurons: 1100, price: 11, icon: Zap },
  { key: "standard", neurons: 2000, price: 20, icon: Sparkles, popular: true },
  { key: "growth", neurons: 4700, price: 47, icon: Crown },
];

export function HomePricingSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const { subscribed, tier } = useSubscription();

  if (!user) return null;

  // Already subscribed — show a minimal "manage" nudge instead
  if (subscribed) return null;

  const isLowBalance = balance < 200;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            {isLowBalance ? "Reîncarcă NEURONS" : "Planuri & Top-up"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLowBalance
              ? "Balanța ta e scăzută. Alege un pachet pentru a continua."
              : "Deblocheaz toate serviciile AI cu un plan sau top-up."}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/credits")}>
          Toate opțiunile <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Top-up packages row */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {TOP_UP_PACKAGES.map(pkg => {
          const Icon = pkg.icon;
          return (
            <button
              key={pkg.key}
              onClick={() => navigate("/credits")}
              className={cn(
                "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border transition-all hover:shadow-md",
                pkg.popular
                  ? "border-primary/40 bg-primary/5 hover:border-primary ring-1 ring-primary/15"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              {pkg.popular && (
                <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary text-primary-foreground -mt-1">
                  Popular
                </span>
              )}
              <div className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center",
                pkg.popular ? "bg-primary/15" : "bg-muted"
              )}>
                <Icon className={cn("h-4.5 w-4.5", pkg.popular ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <span className="text-sm font-bold font-mono block">{pkg.neurons.toLocaleString()}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">NEURONS</span>
              </div>
              <span className="text-base font-bold font-mono">${pkg.price}</span>
            </button>
          );
        })}
      </div>

      {/* Subscription CTA */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.06),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Pro Plan</h3>
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                Salvează 35%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              5.000 NEURONS/lună, toate serviciile AI, Knowledge Graph, suport prioritar.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              {["Extracție nelimitată", "Suport prioritar", "Knowledge Graph"].map(f => (
                <span key={f} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Check className="h-2.5 w-2.5 text-primary shrink-0" /> {f}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">$20</span>
              <span className="text-[10px] text-muted-foreground">/lună</span>
            </div>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/credits")}>
              Abonează-te <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Balance indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Coins className="h-3 w-3" />
        <span>Balanța curentă: <span className="font-mono font-semibold text-foreground">{balance}</span> NEURONS</span>
        {balance >= 500 && <span className="text-primary ml-1">✓ Sănătos</span>}
      </div>
    </motion.section>
  );
}
