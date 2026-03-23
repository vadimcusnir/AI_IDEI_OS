/**
 * HomeRightSidebar — Right column widgets (XP, Challenges, Pipeline, Activity, etc.)
 */
import { useTranslation } from "react-i18next";
import { Layers, TrendingUp } from "lucide-react";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { LeaderboardWidget } from "@/components/gamification/LeaderboardWidget";
import { DailyChallenges } from "@/components/gamification/DailyChallenges";
import { PipelineIndicator } from "@/components/PipelineIndicator";
import { IMFPipelineLauncher } from "@/components/pipeline/IMFPipelineLauncher";
import { MemoryIntelligenceCard } from "@/components/memory/MemoryIntelligenceCard";
import { ActivityTimeline } from "@/components/home/ActivityTimeline";
import { TrendingIdeasWidget } from "@/components/home/TrendingIdeasWidget";
import { WhatsNewWidget } from "@/components/home/WhatsNewWidget";

interface HomeRightSidebarProps {
  totalNeurons: number;
}

export function HomeRightSidebar({ totalNeurons }: HomeRightSidebarProps) {
  const { t } = useTranslation("pages");

  return (
    <div className="space-y-5">
      {/* XP Progress */}
      <XPProgressBar />

      {/* Daily Challenges */}
      <DailyChallenges />

      {/* Activity Timeline */}
      <ActivityTimeline />

      {/* IMF Pipeline Launcher */}
      {totalNeurons > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
            <Layers className="h-3.5 w-3.5" /> {t("home.imf_pipeline", "Knowledge Multiplication")}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t("home.imf_pipeline_desc", "Run the full extraction pipeline on a neuron to generate 50+ deliverables automatically.")}
          </p>
          <IMFPipelineLauncher />
        </div>
      )}

      {/* Pipeline Progress */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="h-3.5 w-3.5" /> {t("navigation:pipeline", "Pipeline")}
        </h3>
        <PipelineIndicator />
      </div>

      {/* Memory Intelligence */}
      <MemoryIntelligenceCard />

      {/* Leaderboard */}
      <LeaderboardWidget />

      {/* Trending Ideas */}
      <TrendingIdeasWidget />

      {/* What's New */}
      <WhatsNewWidget />
    </div>
  );
}
