import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { LeaderboardWidget } from "@/components/gamification/LeaderboardWidget";
import { DailyChallenges } from "@/components/gamification/DailyChallenges";
import { AchievementGallery } from "@/components/gamification/AchievementGallery";
import { TeamChallenges } from "@/components/gamification/TeamChallenges";
import { XPActivityFeed } from "@/components/gamification/XPActivityFeed";
import { RankTimeline } from "@/components/gamification/RankTimeline";
import { StreakCalendar } from "@/components/gamification/StreakCalendar";
import { ControlledSection } from "@/components/ControlledSection";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  Trophy, Flame, Zap, Medal, Award,
  Loader2,
} from "lucide-react";

export default function GamificationPage() {
  const { user } = useAuth();
  const { xp, streak, loading, tierMultiplier } = useGamification();
  const { t } = useTranslation("pages");

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t("gamification.title")}</h1>
              <p className="text-micro text-muted-foreground">{t("gamification.subtitle")}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {tierMultiplier > 1 && (
                <Badge variant="outline" className="text-nano border-primary/30 text-primary">
                  {tierMultiplier}x XP Boost
                </Badge>
              )}
              <Badge className="text-micro bg-primary/10 text-primary border-0">
                Level {xp.level} — {xp.rank_name}
              </Badge>
            </div>
          </div>

          {/* XP Progress + Streak Calendar row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <XPProgressBar />
            <StreakCalendar />
          </div>

          {/* Daily Challenges + Team Challenges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <ControlledSection elementId="gamification.daily_challenges">
              <DailyChallenges />
            </ControlledSection>
            <ControlledSection elementId="gamification.team_challenges">
              <TeamChallenges />
            </ControlledSection>
          </div>

          {/* XP Activity + Rank Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <XPActivityFeed />
            <RankTimeline />
          </div>

          {/* Achievement Gallery */}
          <ControlledSection elementId="gamification.achievements">
            <div className="mb-6">
              <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Award className="h-3 w-3" /> {t("gamification.achievement_gallery")}
              </h2>
              <AchievementGallery />
            </div>
          </ControlledSection>

          {/* Leaderboard */}
          <ControlledSection elementId="gamification.leaderboard">
            <div className="mb-6">
              <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Medal className="h-3 w-3" /> {t("gamification.leaderboard")}
              </h2>
              <LeaderboardWidget />
            </div>
          </ControlledSection>
        </div>
      </div>
    </PageTransition>
  );
}
