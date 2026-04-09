/**
 * ServiceUpsellBanner — Compact banner for service detail pages.
 * Shows if an upgrade path exists for the current service category.
 */
import { useServiceGapDetection } from "@/hooks/useServiceGapDetection";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  currentSlug: string;
  currentLevel: "L3" | "L2" | "L1";
  className?: string;
}

export function ServiceUpsellBanner({ currentSlug, currentLevel, className }: Props) {
  const { data } = useServiceGapDetection();
  const navigate = useNavigate();

  if (!data || currentLevel === "L1") return null;

  // Find an upsell from current level to the next
  const targetLevel = currentLevel === "L3" ? "L2" : "L1";
  const upsell = data.upsells.find(u => u.from_level === currentLevel && u.to_level === targetLevel);

  if (!upsell) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5",
      className
    )}>
      <TrendingUp className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          Get the full <span className="text-primary font-bold">{upsell.to_name}</span>{" "}
          {targetLevel === "L2" ? "Pack" : "Master System"}
          {upsell.savings_pct > 0 && (
            <> — <span className="text-primary">save {upsell.savings_pct}%</span></>
          )}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1"
        onClick={() => navigate(`/services/${upsell.to_slug}`)}
      >
        Upgrade <ArrowUpRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
