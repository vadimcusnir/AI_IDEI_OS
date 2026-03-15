import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { LeaderboardWidget } from "@/components/gamification/LeaderboardWidget";
import { DailyChallenges } from "@/components/gamification/DailyChallenges";
import { AchievementGallery } from "@/components/gamification/AchievementGallery";
import { TeamChallenges } from "@/components/gamification/TeamChallenges";
import { ControlledSection } from "@/components/ControlledSection";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Trophy, Flame, Zap, Medal, Award,
  Loader2,
} from "lucide-react";

export default function GamificationPage() {
  const { user } = useAuth();
  const { xp, streak, loading } = useGamification();

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
          <ControlledSection elementId="gamification.daily_challenges">
            <div className="mb-6">
              <DailyChallenges />
            </div>
          </ControlledSection>

          {/* Team Challenges */}
          <ControlledSection elementId="gamification.team_challenges">
            <div className="mb-6">
              <TeamChallenges />
            </div>
          </ControlledSection>

          {/* Achievement Gallery */}
          <ControlledSection elementId="gamification.achievements">
            <div className="mb-6">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Award className="h-3 w-3" /> Achievement Gallery
              </h2>
              <AchievementGallery />
            </div>
          </ControlledSection>

          {/* Leaderboard */}
          <ControlledSection elementId="gamification.leaderboard">
            <div className="mb-6">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Medal className="h-3 w-3" /> Leaderboard
              </h2>
              <LeaderboardWidget />
            </div>
          </ControlledSection>
        </div>
      </div>
    </PageTransition>
  );
}
