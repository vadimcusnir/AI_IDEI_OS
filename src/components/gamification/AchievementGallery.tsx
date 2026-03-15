import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain, Star, Flame, Zap, Trophy, Target, Medal, Award,
  CheckCircle2, Lock, Eye, EyeOff,
} from "lucide-react";

interface RegistryAchievement {
  id: string;
  name: string;
  name_ro: string;
  description: string;
  description_ro: string;
  category: string;
  tier: string;
  xp_reward: number;
  icon: string;
  hidden: boolean;
}

interface UnlockedAchievement {
  achievement_key: string;
  unlocked_at: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  activation: { label: "Activation", icon: Zap },
  mastery: { label: "Mastery", icon: Trophy },
  consistency: { label: "Consistency", icon: Flame },
  social: { label: "Social", icon: Medal },
  quality: { label: "Quality", icon: Star },
  resilience: { label: "Resilience", icon: Target },
  hidden: { label: "Hidden", icon: EyeOff },
};

const TIER_COLORS: Record<string, string> = {
  bronze: "from-amber-700/20 to-amber-600/10 border-amber-600/30",
  silver: "from-slate-400/20 to-slate-300/10 border-slate-400/30",
  gold: "from-yellow-500/20 to-yellow-400/10 border-yellow-500/30",
};

const TIER_BADGE: Record<string, string> = {
  bronze: "bg-amber-700/10 text-amber-700 border-amber-700/20",
  silver: "bg-slate-400/10 text-slate-500 border-slate-400/20",
  gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

export function AchievementGallery() {
  const { user } = useAuth();
  const [registry, setRegistry] = useState<RegistryAchievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [unlockedDates, setUnlockedDates] = useState<Map<string, string>>(new Map());
  const [filter, setFilter] = useState<string>("all");
  const [showHidden, setShowHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [regRes, unlRes] = await Promise.all([
        supabase.from("achievements_registry").select("*").order("category").order("tier"),
        user
          ? supabase.from("user_achievements").select("achievement_key, unlocked_at").eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      if (regRes.data) setRegistry(regRes.data as unknown as RegistryAchievement[]);
      if (unlRes.data) {
        const keys = new Set((unlRes.data as any[]).map((a) => a.achievement_key));
        setUnlocked(keys);
        const dates = new Map((unlRes.data as any[]).map((a) => [a.achievement_key, a.unlocked_at]));
        setUnlockedDates(dates);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return null;

  const categories = Object.keys(CATEGORY_LABELS);

  const filtered = registry.filter((a) => {
    if (filter !== "all" && a.category !== filter) return false;
    if (a.hidden && !unlocked.has(a.id) && !showHidden) return false;
    return true;
  });

  const unlockedCount = registry.filter((a) => unlocked.has(a.id)).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">{unlockedCount}/{registry.length} Unlocked</span>
        </div>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {showHidden ? "Hide secret" : "Show secret"}
        </button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          )}
        >
          All
        </button>
        {categories.map((cat) => {
          const { label, icon: Icon } = CATEGORY_LABELS[cat];
          const count = registry.filter((a) => a.category === cat).length;
          if (cat === "hidden" && !showHidden) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                filter === cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              )}
            >
              <Icon className="h-2.5 w-2.5" />
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((ach) => {
          const isUnlocked = unlocked.has(ach.id);
          const isHiddenLocked = ach.hidden && !isUnlocked;
          const date = unlockedDates.get(ach.id);

          return (
            <div
              key={ach.id}
              className={cn(
                "relative flex items-start gap-2.5 p-3 rounded-xl border bg-gradient-to-br transition-all",
                isUnlocked
                  ? TIER_COLORS[ach.tier] || "border-border"
                  : "border-border/50 opacity-50 grayscale"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                isUnlocked ? "bg-primary/10" : "bg-muted"
              )}>
                {isHiddenLocked ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : isUnlocked ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs font-semibold truncate">
                    {isHiddenLocked ? "???" : ach.name}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("text-[8px] px-1 py-0 h-3.5 shrink-0", TIER_BADGE[ach.tier])}
                  >
                    {ach.tier}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {isHiddenLocked ? "Discover this hidden achievement" : ach.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-primary">+{ach.xp_reward} XP</span>
                  {date && (
                    <span className="text-[8px] text-muted-foreground">
                      {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Lock className="h-6 w-6 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No achievements in this category</p>
        </div>
      )}
    </div>
  );
}
