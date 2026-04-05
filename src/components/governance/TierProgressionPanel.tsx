/**
 * TierProgressionPanel — Displays L1-L4 progression with real backend data.
 */
import { useTierProgression } from "@/hooks/useTierProgression";
import { Loader2, Check, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TIERS = [
  { key: "L1", label: "User", desc: "Default tier — basic access" },
  { key: "L2", label: "Builder", desc: "Active subscriber with 1+ month tenure" },
  { key: "L3", label: "Operator", desc: "Pro/VIP with 3+ months and 500+ neurons burned" },
  { key: "L4", label: "Orchestrator", desc: "VIP with 11 months loyalty + 100 NOTA2" },
];

const TIER_COLORS: Record<string, string> = {
  L1: "text-muted-foreground",
  L2: "text-sky-400",
  L3: "text-amber-400",
  L4: "text-emerald-400",
};

export function TierProgressionPanel() {
  const { currentLevel, nextLevel, canAdvance, requirements, met, loading, refresh } = useTierProgression();

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const currentIdx = TIERS.findIndex(t => t.key === currentLevel);

  return (
    <div className="space-y-4">
      {/* Progression line */}
      <div className="flex items-center gap-1">
        {TIERS.map((tier, i) => {
          const isActive = tier.key === currentLevel;
          const isPast = i < currentIdx;
          const isFuture = i > currentIdx;
          return (
            <div key={tier.key} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                isActive ? "border-primary bg-primary/10 text-primary" :
                isPast ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                "border-border/20 bg-muted/10 text-muted-foreground/30"
              )}>
                {isPast ? <Check className="h-3.5 w-3.5" /> : isFuture ? <Lock className="h-3 w-3" /> : tier.key}
              </div>
              {i < TIERS.length - 1 && (
                <div className={cn("flex-1 h-0.5 rounded", isPast ? "bg-emerald-500/30" : "bg-border/15")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Tier cards */}
      <div className="space-y-2">
        {TIERS.map((tier, i) => {
          const isActive = tier.key === currentLevel;
          const isPast = i < currentIdx;
          const isNext = tier.key === nextLevel && nextLevel !== currentLevel;

          return (
            <div key={tier.key} className={cn(
              "border rounded-lg p-3 transition-all",
              isActive ? "border-primary/30 bg-primary/5" :
              isPast ? "border-emerald-500/15 bg-emerald-500/5 opacity-60" :
              "border-border/10 opacity-50"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-xs font-bold", TIER_COLORS[tier.key])}>{tier.key}</span>
                <span className="text-xs font-semibold">{tier.label}</span>
                {isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-auto">CURRENT</span>}
                {isNext && canAdvance && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 ml-auto">READY</span>}
              </div>
              <p className="text-[10px] text-muted-foreground/50 mb-2">{tier.desc}</p>

              {/* Requirements for next tier */}
              {isNext && Object.keys(requirements).length > 0 && (
                <div className="space-y-1 mt-2">
                  {Object.entries(requirements).map(([key, val]) => {
                    const isMet = (met as Record<string, boolean>)[key];
                    return (
                      <div key={key} className="flex items-center gap-2 text-[10px]">
                        {isMet ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground/30" />
                        )}
                        <span className={cn(isMet ? "text-emerald-400" : "text-muted-foreground/50")}>
                          {key.replace(/_/g, " ")}: {String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button size="sm" variant="ghost" onClick={refresh} className="text-[10px] h-7">
        <ArrowRight className="h-3 w-3 mr-1" /> Refresh Progression
      </Button>
    </div>
  );
}
