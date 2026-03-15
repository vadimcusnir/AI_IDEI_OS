import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { LeaderboardWidget } from "@/components/gamification/LeaderboardWidget";
import { DailyChallenges } from "@/components/gamification/DailyChallenges";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Trophy, Star, Flame, Zap, Award, Target, Medal,
  Loader2, CheckCircle2, Lock,
} from "lucide-react";

interface Achievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: {
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    category: string;
  };
}

interface XPEvent {
  id: string;
  amount: number;
  source: string;
  source_id: string | null;
  created_at: string;
}

export default function GamificationPage() {
  const { user } = useAuth();
  const { xp, streak, loading } = useGamification();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentXP, setRecentXP] = useState<XPEvent[]>([]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from("user_achievements").select("*, achievements(*)").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
      supabase.from("xp_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]).then(([achRes, xpRes]) => {
      if (achRes.data) setAchievements(achRes.data as unknown as Achievement[]);
      if (xpRes.data) setRecentXP(xpRes.data as XPEvent[]);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Gamification — AI-IDEI" description="Track your XP, level, streaks, achievements, and daily challenges." />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold tracking-tight">Gamification</h1>
              <p className="text-[10px] text-muted-foreground">XP, levels, streaks, achievements, and daily challenges</p>
            </div>
            <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-0">
              Level {xp.level} — {xp.rank_name}
            </Badge>
          </div>

          {/* XP Progress */}
          <div className="mb-6">
            <XPProgressBar />
          </div>

          {/* Daily Challenges */}
          <div className="mb-6">
            <DailyChallenges />
          </div>

          {/* Two columns: Achievements + Leaderboard */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Achievements */}
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Award className="h-3 w-3" /> Achievements ({achievements.length})
              </h2>
              {achievements.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Lock className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">No achievements unlocked yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {achievements.slice(0, 8).map(a => (
                    <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 bg-card border border-border rounded-lg">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{a.achievement?.name || "Achievement"}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{a.achievement?.description || ""}</p>
                      </div>
                      <span className="text-[9px] font-bold text-primary shrink-0">+{a.achievement?.xp_reward || 0} XP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Medal className="h-3 w-3" /> Leaderboard
              </h2>
              <LeaderboardWidget />
            </div>
          </div>

          {/* Recent XP Activity */}
          {recentXP.length > 0 && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Recent XP Activity
              </h2>
              <div className="space-y-1">
                {recentXP.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border">
                    <Zap className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-xs flex-1">{ev.source}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {new Date(ev.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">+{ev.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
