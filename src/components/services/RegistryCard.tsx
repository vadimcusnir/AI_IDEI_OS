import { Zap, Layers, Server, Coins, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RegistryServiceItem {
  id: string;
  name: string;
  service_level: string;
  category: string;
  intent: string;
  neurons_cost_min: number;
  neurons_cost_max: number;
  score_tier: string;
  complexity: string;
  output_type: string;
  domain: string;
  is_active: boolean;
}

export const LEVEL_META = {
  OTOS: { label: "Action", desc: "Quick Actions", icon: Zap, color: "text-info" },
  MMS: { label: "System", desc: "Execution Systems", icon: Layers, color: "text-amber-500" },
  LCSS: { label: "Program", desc: "Growth Programs", icon: Server, color: "text-purple-500" },
} as const;

export const TIER_COLORS: Record<string, string> = {
  S: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  A: "bg-info/15 text-info border-blue-500/30",
  B: "bg-muted text-muted-foreground border-border",
  C: "bg-muted/50 text-muted-foreground/70 border-border/50",
};

interface RegistryCardProps {
  service: RegistryServiceItem;
  onClick?: (service: RegistryServiceItem) => void;
}

export function RegistryCard({ service: s, onClick }: RegistryCardProps) {
  const meta = LEVEL_META[s.service_level as keyof typeof LEVEL_META];
  const Icon = meta?.icon || Zap;

  return (
    <div
      onClick={() => onClick?.(s)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer group",
        "border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]"
      )}
    >
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-muted">
        <Icon className={cn("h-4 w-4", meta?.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{s.name}</span>
          <Badge variant="outline" className={cn("text-nano h-4 px-1 shrink-0 border", TIER_COLORS[s.score_tier] || TIER_COLORS.C)}>
            {s.score_tier}
          </Badge>
        </div>
        {s.category && (
          <span className="text-nano text-muted-foreground truncate block mt-0.5 max-w-[300px]">{s.category}</span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="flex items-center gap-0.5 text-xs font-semibold text-primary">
            <Coins className="h-3 w-3" />
            <span className="font-mono">
              {s.neurons_cost_min === s.neurons_cost_max
                ? `${s.neurons_cost_min}N`
                : `${s.neurons_cost_min}–${s.neurons_cost_max}N`}
            </span>
          </div>
          <span className="text-nano text-muted-foreground/60">{s.complexity} · {s.output_type}</span>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}
