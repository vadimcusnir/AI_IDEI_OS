/**
 * CostPreviewBadge — Inline cost estimate shown in the input zone
 * when the system detects a high-cost intent before submission.
 */
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CostPreviewBadgeProps {
  estimatedCredits: number;
  balance: number;
  visible: boolean;
}

export function CostPreviewBadge({ estimatedCredits, balance, visible }: CostPreviewBadgeProps) {
  if (!visible || estimatedCredits <= 0) return null;

  const insufficient = balance < estimatedCredits;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro font-mono font-medium border transition-all",
        insufficient
          ? "bg-destructive/10 border-destructive/20 text-destructive"
          : "bg-muted/50 border-border/50 text-muted-foreground"
      )}
    >
      <Coins className="h-3 w-3" />
      <span>~{estimatedCredits} N</span>
      {insufficient && (
        <span className="text-nano opacity-70">
          (need {estimatedCredits - balance} more)
        </span>
      )}
    </div>
  );
}
