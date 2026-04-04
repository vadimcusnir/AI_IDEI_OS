import { useGamification } from "@/hooks/useGamification";
import { Progress } from "@/components/ui/progress";
import { Flame, Star, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const RANK_ICONS: Record<string, React.ElementType> = {
  Novice: Star,
  Apprentice: Star,
  Creator: Zap,
  Artisan: Zap,
  Expert: Trophy,
  Master: Trophy,
  Virtuoso: Flame,
  Legend: Flame,
};

export function XPProgressBar({ compact = false }: { compact?: boolean }) {
  const { xp, streak, loading, xpForNextLevel, levelProgress, tierMultiplier } = useGamification();

  if (loading) return null;

  const RankIcon = RANK_ICONS[xp.rank_name] || Star;
  const xpToNext = xpForNextLevel - xp.total_xp;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <RankIcon className="h-3 w-3 text-primary" />
          <span className="text-micro font-bold">Lv.{xp.level}</span>
        </div>
        <Progress value={levelProgress} className="h-1.5 flex-1 max-w-[80px]" />
        {streak.current_streak > 0 && (
          <div className="flex items-center gap-0.5">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-micro font-bold text-orange-500">{streak.current_streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header: Rank + Level */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            "bg-primary/10 border border-primary/20"
          )}>
            <RankIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">{xp.rank_name}</p>
            <p className="text-micro text-muted-foreground">Level {xp.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold font-mono text-primary">{xp.total_xp.toLocaleString()}</p>
          <p className="text-nano text-muted-foreground">TOTAL XP</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-nano text-muted-foreground">Level {xp.level}</span>
          <span className="text-nano text-muted-foreground">Level {xp.level + 1}</span>
        </div>
        <Progress value={levelProgress} className="h-2" />
        <p className="text-nano text-muted-foreground mt-1 text-center">
          {xpToNext.toLocaleString()} XP to next level
        </p>
      </div>

      {/* Streak + Daily + Tier Boost */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Flame className={cn("h-3.5 w-3.5", streak.current_streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
          <span className="text-xs font-medium">
            {streak.current_streak > 0 ? `${streak.current_streak}-day streak` : "No streak"}
          </span>
          {streak.longest_streak > 0 && streak.longest_streak !== streak.current_streak && (
            <span className="text-nano text-muted-foreground">(best: {streak.longest_streak})</span>
          )}
        </div>
        <div className="text-right flex items-center gap-2">
          {tierMultiplier > 1 && (
            <span className="text-nano font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {tierMultiplier}x XP
            </span>
          )}
          <span className="text-nano text-muted-foreground">Today: {xp.daily_xp_earned}/200 XP</span>
        </div>
      </div>
    </div>
  );
}
