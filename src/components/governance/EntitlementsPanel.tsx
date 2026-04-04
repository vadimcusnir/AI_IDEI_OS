/**
 * EntitlementsPanel — Displays user's computed entitlements and tier level.
 */
import { useEntitlements } from "@/hooks/useEntitlements";
import { Loader2, Shield, Zap, Clock, Flame, Crown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG = {
  L1: { label: "User", color: "text-muted-foreground", bg: "bg-muted/20", icon: Shield },
  L2: { label: "Builder", color: "text-sky-400", bg: "bg-sky-500/10", icon: Zap },
  L3: { label: "Operator", color: "text-amber-400", bg: "bg-amber-500/10", icon: Flame },
  L4: { label: "Orchestrator", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Crown },
};

export function EntitlementsPanel() {
  const { level, nota2, tenure, burned, cusnirOs, flags, loading, recompute } = useEntitlements();

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const cfg = LEVEL_CONFIG[level];
  const Icon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Level badge */}
      <div className={cn("flex items-center gap-3 p-3 rounded-lg border border-border/20", cfg.bg)}>
        <div className="h-10 w-10 rounded-lg bg-background/50 flex items-center justify-center">
          <Icon className={cn("h-5 w-5", cfg.color)} />
        </div>
        <div>
          <p className={cn("text-sm font-bold", cfg.color)}>{cfg.label}</p>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Level {level}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={recompute} className="ml-auto h-7 w-7 p-0">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "NOTA2", value: nota2.toLocaleString(), icon: Shield },
          { label: "Tenure", value: `${tenure} mo`, icon: Clock },
          { label: "Burned", value: burned.toLocaleString(), icon: Flame },
          { label: "Cusnir_OS", value: cusnirOs ? "✓ Active" : "Locked", icon: Crown },
        ].map(({ label, value, icon: MetricIcon }) => (
          <div key={label} className="border border-border/15 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <MetricIcon className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{label}</span>
            </div>
            <p className="text-xs font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Feature gates */}
      {Object.keys(flags).length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1.5">Feature Gates</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(flags).map(([key, val]) => (
              <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-muted/30 text-muted-foreground">
                {key.replace(/_/g, " ")}: {String(val)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
