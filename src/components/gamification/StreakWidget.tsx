import { useGamification } from "@/hooks/useGamification";
import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export function StreakWidget() {
  const { streak, loading } = useGamification();

  if (loading) return null;

  const days = streak.current_streak;
  const flameColor = days >= 30
    ? "text-destructive"
    : days >= 8
    ? "text-semantic-amber"
    : days > 0
    ? "text-semantic-blue"
    : "text-muted-foreground/40";

  const isGrace = streak.grace_period_used && days > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all",
            "hover:bg-accent/50",
            isGrace && "ring-1 ring-amber-400/50 bg-amber-500/5"
          )}
        >
          <Flame className={cn("h-4 w-4 shrink-0", flameColor, days > 0 && "animate-pulse")} />
          <span className={cn(
            "text-xs font-bold tabular-nums",
            days > 0 ? flameColor : "text-muted-foreground/40"
          )}>
            {days}
          </span>
          {streak.freeze_tokens > 0 && (
            <span className="flex items-center gap-0.5 ml-0.5">
              <Snowflake className="h-2.5 w-2.5 text-sky-500" />
              <span className="text-nano font-bold text-sky-500">{streak.freeze_tokens}</span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Flame className={cn("h-5 w-5", flameColor)} />
            <div>
              <p className="text-sm font-bold">{days}-day streak</p>
              {isGrace && (
                <p className="text-nano text-amber-500 font-medium">⚠ Grace period active</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-micro">
            <div className="bg-muted/50 rounded-md px-2 py-1.5">
              <p className="text-muted-foreground">Current</p>
              <p className="font-bold text-sm">{days} days</p>
            </div>
            <div className="bg-muted/50 rounded-md px-2 py-1.5">
              <p className="text-muted-foreground">Longest</p>
              <p className="font-bold text-sm">{streak.longest_streak} days</p>
            </div>
          </div>

          {streak.freeze_tokens > 0 && (
            <div className="flex items-center gap-1.5 text-micro text-sky-600">
              <Snowflake className="h-3 w-3" />
              <span>{streak.freeze_tokens} freeze token{streak.freeze_tokens !== 1 ? "s" : ""} available</span>
            </div>
          )}

          <p className="text-nano text-muted-foreground/70 italic">
            {days >= 30
              ? "🔥 You're on fire! Legendary streak!"
              : days >= 7
              ? "💪 Great consistency! Keep it up!"
              : days > 0
              ? "🌱 Building momentum..."
              : "Start a streak with any daily action"}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
