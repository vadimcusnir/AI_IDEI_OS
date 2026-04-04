import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";
import { Star, Zap, Trophy, Flame, Crown, Gem } from "lucide-react";

const RANKS = [
  { name: "Novice", level: 1, icon: Star, xp: 0 },
  { name: "Apprentice", level: 2, icon: Star, xp: 100 },
  { name: "Creator", level: 3, icon: Zap, xp: 400 },
  { name: "Artisan", level: 5, icon: Zap, xp: 1600 },
  { name: "Expert", level: 7, icon: Trophy, xp: 3600 },
  { name: "Master", level: 10, icon: Trophy, xp: 8100 },
  { name: "Virtuoso", level: 15, icon: Flame, xp: 19600 },
  { name: "Legend", level: 20, icon: Crown, xp: 36100 },
];

export function RankTimeline() {
  const { xp } = useGamification();

  const currentRankIdx = RANKS.findIndex(
    (r, i) => i === RANKS.length - 1 || xp.total_xp < RANKS[i + 1].xp
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
        <Gem className="h-3 w-3" /> Rank Progression
      </h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-3">
          {RANKS.map((rank, i) => {
            const isReached = i <= currentRankIdx;
            const isCurrent = i === currentRankIdx;
            const Icon = rank.icon;

            return (
              <div key={rank.name} className="flex items-center gap-3 relative">
                {/* Node */}
                <div
                  className={cn(
                    "h-[30px] w-[30px] rounded-full flex items-center justify-center shrink-0 z-10 border-2",
                    isCurrent
                      ? "bg-primary border-primary text-primary-foreground"
                      : isReached
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-muted border-border text-muted-foreground/40"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Label */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isCurrent ? "text-primary" : isReached ? "text-foreground" : "text-muted-foreground/50"
                      )}
                    >
                      {rank.name}
                    </span>
                    <span className="text-nano text-muted-foreground">Lv.{rank.level}+</span>
                    {isCurrent && (
                      <span className="text-nano font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-nano text-muted-foreground">
                    {rank.xp.toLocaleString()} XP
                  </span>
                </div>

                {/* Progress to next */}
                {isCurrent && i < RANKS.length - 1 && (
                  <span className="text-nano text-muted-foreground">
                    {(RANKS[i + 1].xp - xp.total_xp).toLocaleString()} XP to {RANKS[i + 1].name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
