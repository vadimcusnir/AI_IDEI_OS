import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Layers, Sparkles, Zap, Rocket, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  brain: Brain, layers: Layers, sparkles: Sparkles,
  zap: Zap, rocket: Rocket, trophy: Trophy,
};

export function AchievementsBadges({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const targetId = userId || user?.id;

  useEffect(() => {
    if (!targetId) return;
    supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", targetId)
      .order("unlocked_at", { ascending: false })
      .then(({ data }) => {
        setAchievements((data as Achievement[]) || []);
        setLoading(false);
      });
  }, [targetId]);

  if (loading || achievements.length === 0) return null;

  const totalXP = achievements.reduce((s, a) => s + a.xp_reward, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Realizări
        </h3>
        <span className="text-micro font-bold text-primary">{totalXP} XP</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {achievements.map((a) => {
          const Icon = ICON_MAP[a.icon] || Trophy;
          return (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                "bg-primary/5 border border-primary/10",
                "hover:bg-primary/10 transition-colors cursor-default"
              )}
              title={a.description}
            >
              <Icon className="h-3 w-3 text-primary" />
              <span className="text-micro font-medium">{a.title}</span>
              <span className="text-nano text-muted-foreground">+{a.xp_reward}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
