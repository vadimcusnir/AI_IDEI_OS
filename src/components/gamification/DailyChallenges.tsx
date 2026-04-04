import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Challenge {
  id: string;
  title: string;
  description: string;
  goal_metric: string;
  goal_value: number;
  xp_reward: number;
  progress?: { current_value: number; completed: boolean };
}

export function DailyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: rawChallenges } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("active_date", today)
        .eq("is_active", true);

      if (!rawChallenges || rawChallenges.length === 0) { setLoading(false); return; }

      const challengeIds = rawChallenges.map((c: any) => c.id);
      const { data: progress } = await supabase
        .from("challenge_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("challenge_id", challengeIds);

      const progressMap = new Map((progress || []).map((p: any) => [p.challenge_id, p]));

      setChallenges(rawChallenges.map((c: any) => ({
        ...c,
        progress: progressMap.get(c.id) || { current_value: 0, completed: false },
      })));
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading || challenges.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
        <Target className="h-3 w-3" /> Daily Challenges
      </h3>
      <div className="space-y-3">
        {challenges.map((c) => {
          const pct = Math.min(100, Math.round((c.progress!.current_value / c.goal_value) * 100));
          return (
            <div key={c.id} className={cn(
              "p-3 rounded-lg border",
              c.progress!.completed ? "bg-primary/5 border-primary/20" : "border-border"
            )}>
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {c.progress!.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={cn("text-xs font-medium", c.progress!.completed && "line-through text-muted-foreground")}>
                    {c.title}
                  </span>
                </div>
                <span className="text-nano font-bold text-primary">+{c.xp_reward} XP</span>
              </div>
              <p className="text-micro text-muted-foreground mb-2">{c.description}</p>
              <div className="flex items-center gap-2">
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="text-nano text-muted-foreground">
                  {c.progress!.current_value}/{c.goal_value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
