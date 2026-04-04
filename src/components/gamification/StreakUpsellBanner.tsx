import { useGamification } from "@/hooks/useGamification";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useNavigate } from "react-router-dom";
import { Flame, Gift, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STREAK_REWARDS = [
  { days: 3, bonus: 50, label: "3-day streak" },
  { days: 7, bonus: 150, label: "7-day streak" },
  { days: 14, bonus: 400, label: "14-day streak" },
  { days: 30, bonus: 1000, label: "30-day streak" },
];

const XP_MILESTONES = [
  { xp: 500, bonus: 100, label: "Explorer" },
  { xp: 2000, bonus: 300, label: "Practitioner" },
  { xp: 5000, bonus: 750, label: "Expert" },
  { xp: 10000, bonus: 2000, label: "Master" },
];

export function StreakUpsellBanner() {
  const { xp, streak, loading } = useGamification();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();

  if (loading) return null;

  const currentStreak = streak.current_streak;
  const nextStreakReward = STREAK_REWARDS.find(r => r.days > currentStreak);
  const nextXPMilestone = XP_MILESTONES.find(m => m.xp > xp.total_xp);
  const isLowBalance = balance < 500;

  if (!nextStreakReward && !nextXPMilestone && !isLowBalance) return null;

  return (
    <div className="space-y-2">
      {/* Streak progress */}
      {nextStreakReward && currentStreak > 0 && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <Flame className="h-4 w-4 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">
              {currentStreak}-day streak — {nextStreakReward.days - currentStreak} more days for{" "}
              <span className="text-amber-600 font-bold">+{nextStreakReward.bonus}N bonus</span>
            </p>
          </div>
        </div>
      )}

      {/* XP milestone */}
      {nextXPMilestone && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-primary/20 bg-primary/5">
          <Gift className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">
              {nextXPMilestone.xp - xp.total_xp} XP to{" "}
              <Badge variant="secondary" className="text-[9px] h-4 px-1">
                {nextXPMilestone.label}
              </Badge>{" "}
              — earn <span className="text-primary font-bold">+{nextXPMilestone.bonus}N</span>
            </p>
          </div>
        </div>
      )}

      {/* Low balance scarcity upsell */}
      {isLowBalance && (
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg border",
          balance < 100
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-card"
        )}>
          <Zap className={cn("h-4 w-4 shrink-0", balance < 100 ? "text-destructive" : "text-muted-foreground")} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">
              {balance < 100 ? "Credits almost depleted" : "Running low on credits"} —{" "}
              <span className="font-mono">{balance}N</span> remaining
            </p>
          </div>
          <Button
            variant={balance < 100 ? "destructive" : "outline"}
            size="sm"
            className="h-7 text-[10px] gap-1 shrink-0"
            onClick={() => navigate("/pricing")}
          >
            Top Up <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
