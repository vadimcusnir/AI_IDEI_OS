import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TeamChallenge {
  id: string;
  title: string;
  description: string;
  goal_value: number;
  current_value: number;
  xp_reward: number;
  neurons_reward: number;
  ends_at: string;
  my_contribution: number;
}

export function TeamChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<TeamChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: raw } = await supabase
        .from("team_challenges")
        .select("*")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString())
        .order("ends_at");

      if (!raw || raw.length === 0) { setLoading(false); return; }

      // Get user's contributions
      const ids = raw.map((c: any) => c.id);
      const { data: contribs } = await supabase
        .from("team_challenge_contributions")
        .select("challenge_id, amount")
        .eq("user_id", user.id)
        .in("challenge_id", ids);

      const contribMap = new Map<string, number>();
      (contribs || []).forEach((c: any) => {
        contribMap.set(c.challenge_id, (contribMap.get(c.challenge_id) || 0) + c.amount);
      });

      setChallenges(raw.map((c: any) => ({
        ...c,
        my_contribution: contribMap.get(c.id) || 0,
      })));
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading || challenges.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Users className="h-3 w-3" /> Team Challenges
      </h3>
      {challenges.map((c) => {
        const pct = Math.min(100, Math.round((c.current_value / c.goal_value) * 100));
        const completed = c.current_value >= c.goal_value;

        return (
          <Card key={c.id} className={completed ? "border-primary/30 bg-primary/5" : ""}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {completed ? (
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium">{c.title}</span>
                </div>
                <div className="flex gap-1">
                  {c.xp_reward > 0 && (
                    <Badge variant="outline" className="text-nano px-1 py-0">+{c.xp_reward} XP</Badge>
                  )}
                  {c.neurons_reward > 0 && (
                    <Badge variant="outline" className="text-nano px-1 py-0 border-primary text-primary">
                      +{c.neurons_reward} N
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-micro text-muted-foreground mb-2">{c.description}</p>
              <div className="flex items-center gap-2 mb-1">
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="text-nano font-medium">{c.current_value}/{c.goal_value}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-nano text-muted-foreground">
                  Your contribution: {c.my_contribution}
                </span>
                <span className="text-nano text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(c.ends_at), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
