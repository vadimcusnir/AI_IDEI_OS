import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Zap, Layers, Server, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceItem } from "./ServiceCard";
import { LEVEL_META, TIER_COLORS } from "./ServiceCard";

interface ServiceDetailDrawerProps {
  service: ServiceItem | null;
  open: boolean;
  onClose: () => void;
}

export function ServiceDetailDrawer({ service, open, onClose }: ServiceDetailDrawerProps) {
  if (!service) return null;
  const meta = LEVEL_META[service.service_level as keyof typeof LEVEL_META];
  const Icon = meta?.icon || Zap;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted">
              <Icon className={cn("h-5 w-5", meta?.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base leading-tight">{service.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-[9px] h-4.5 px-1.5 border", TIER_COLORS[service.score_tier] || TIER_COLORS.C)}>
                  Tier {service.score_tier}
                </Badge>
                <Badge variant="outline" className="text-[9px] h-4.5 px-1.5">
                  {service.service_level}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 pt-2">
          {/* Cost section */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cost</p>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="text-lg font-bold font-mono">{service.neurons_cost_min}–{service.neurons_cost_max}</span>
              <span className="text-xs text-muted-foreground">NEURONS</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              ≈ ${(service.neurons_cost_min * 0.01).toFixed(2)}–${(service.neurons_cost_max * 0.01).toFixed(2)} USD
            </p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Domain", value: service.domain },
              { label: "Category", value: service.category },
              { label: "Complexity", value: service.complexity },
              { label: "Output", value: service.output_type },
            ].map(item => (
              <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                <p className="text-xs font-medium truncate">{item.value || "—"}</p>
              </div>
            ))}
          </div>

          {/* Intent */}
          {service.intent && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Intent / Axis</p>
              <p className="text-xs text-foreground/80">{service.intent}</p>
            </div>
          )}

          {/* CTA */}
          <Button className="w-full gap-2" size="lg">
            <Play className="h-4 w-4" />
            Execute Service
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
