import { useState, useEffect, useCallback, useMemo } from "react";
import { GenericPageSkeleton } from "@/components/skeletons/GenericPageSkeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Network, BarChart3, Search, AlertTriangle, Brain, Radar, Zap,
} from "lucide-react";
import { ControlledSection } from "@/components/ControlledSection";
import { PageTransition } from "@/components/motion/PageTransition";
import { KnowledgeGraph } from "@/components/intelligence/KnowledgeGraph";
import { StatsOverview } from "@/components/intelligence/StatsOverview";
import { DuplicateMergePanel } from "@/components/neurons/DuplicateMergePanel";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { GraphAnalysisPanel } from "@/components/intelligence/GraphAnalysisPanel";
import { SemanticSearchPanel } from "@/components/knowledge/SemanticSearchPanel";
import { AdvancedSearch } from "@/components/intelligence/AdvancedSearch";
import { IntelligenceProfiles } from "@/components/intelligence/IntelligenceProfiles";
import { PatternDashboard } from "@/components/intelligence/PatternDashboard";
import { GitMerge } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Stats {
  totalNeurons: number;
  draftNeurons: number;
  publishedNeurons: number;
  totalEpisodes: number;
  analyzedEpisodes: number;
  creditsBalance: number;
  creditsSpent: number;
  creditsEarned: number;
  categories: Record<string, number>;
  lifecycles: Record<string, number>;
  recentActivity: { date: string; count: number }[];
}

export default function Intelligence() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("graph");

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) { setLoading(false); return; }
    loadStats();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  const loadStats = async () => {
    const wsId = currentWorkspace!.id;
    const [neuronsRes, episodesRes, creditsRes] = await Promise.all([
      supabase.from("neurons").select("id, status, content_category, lifecycle, created_at").eq("workspace_id", wsId),
      supabase.from("episodes").select("id, status, created_at").eq("workspace_id", wsId),
      supabase.from("user_credits").select("*").eq("user_id", user!.id).maybeSingle(),
    ]);

    const neurons = neuronsRes.data || [];
    const episodes = episodesRes.data || [];
    const credits = creditsRes.data;

    const categories: Record<string, number> = {};
    const lifecycles: Record<string, number> = {};
    neurons.forEach((n: any) => {
      if (n.content_category) categories[n.content_category] = (categories[n.content_category] || 0) + 1;
      if (n.lifecycle) lifecycles[n.lifecycle] = (lifecycles[n.lifecycle] || 0) + 1;
    });

    const now = new Date();
    const recentActivity: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = neurons.filter((n: any) => n.created_at.startsWith(dateStr)).length;
      recentActivity.push({ date: dateStr, count });
    }

    setStats({
      totalNeurons: neurons.length,
      draftNeurons: neurons.filter((n: any) => n.status === "draft").length,
      publishedNeurons: neurons.filter((n: any) => n.status === "published").length,
      totalEpisodes: episodes.length,
      analyzedEpisodes: episodes.filter((e: any) => e.status === "analyzed").length,
      creditsBalance: credits?.balance ?? 0,
      creditsSpent: credits?.total_spent ?? 0,
      creditsEarned: credits?.total_earned ?? 0,
      categories,
      lifecycles,
      recentActivity,
    });
    setLoading(false);
  };

  if (authLoading || wsLoading || loading) {
    return <GenericPageSkeleton />;
  }

  if (!stats) return null;

  return (
    <PageTransition>
    <div className="flex-1 overflow-auto">
      <SEOHead title="Intelligence — AI-IDEI" description="Knowledge graph, stats overview, semantic search, and graph intelligence." />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              {t("intelligence.title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("intelligence.subtitle")}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="h-9 w-full sm:w-auto flex-wrap">
            <TabsTrigger value="graph" className="text-xs gap-1 sm:gap-1.5 flex-1 sm:flex-none px-2 sm:px-3">
              <Network className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t("intelligence.tab_graph")}</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs gap-1 sm:gap-1.5 flex-1 sm:flex-none px-2 sm:px-3">
              <Search className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Search</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs gap-1 sm:gap-1.5 flex-1 sm:flex-none px-2 sm:px-3">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs gap-1 sm:gap-1.5 flex-1 sm:flex-none px-2 sm:px-3">
              <BarChart3 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t("intelligence.tab_analytics")}</span>
            </TabsTrigger>
            <TabsTrigger value="dedup" className="text-xs gap-1 sm:gap-1.5 flex-1 sm:flex-none px-2 sm:px-3">
              <GitMerge className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t("intelligence.tab_dedup")}</span>
            </TabsTrigger>
            <TabsTrigger value="profiles" className="text-xs gap-1 sm:gap-1.5 flex-1 sm:flex-none px-2 sm:px-3">
              <Brain className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Profiles</span>
            </TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs gap-1 sm:gap-1.5 flex-1 sm:flex-none px-2 sm:px-3">
              <Zap className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Patterns</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="mt-0">
            <ControlledSection elementId="intelligence.graph">
              <PremiumGate requiredTier="pro" featureName="Knowledge Graph">
                <KnowledgeGraph />
              </PremiumGate>
            </ControlledSection>
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <ControlledSection elementId="intelligence.search">
              <div className="space-y-6">
                <SemanticSearchPanel />
                <AdvancedSearch />
              </div>
            </ControlledSection>
          </TabsContent>

          <TabsContent value="analysis" className="mt-0">
            <ControlledSection elementId="intelligence.analysis">
              <PremiumGate requiredTier="pro" featureName="Graph Analysis">
                <GraphAnalysisPanel />
              </PremiumGate>
            </ControlledSection>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <ControlledSection elementId="intelligence.stats">
              <StatsOverview stats={stats} />
            </ControlledSection>
          </TabsContent>

          <TabsContent value="dedup" className="mt-0">
            <ControlledSection elementId="intelligence.dedup">
              <PremiumGate requiredTier="pro" featureName="Deduplication">
                <DuplicateMergePanel />
              </PremiumGate>
            </ControlledSection>
          </TabsContent>

          <TabsContent value="profiles" className="mt-0">
            <ControlledSection elementId="intelligence.profiles">
              <IntelligenceProfiles />
            </ControlledSection>
          </TabsContent>

          <TabsContent value="patterns" className="mt-0">
            <ControlledSection elementId="intelligence.patterns">
              <PremiumGate requiredTier="pro" featureName="Pattern Detection">
                <PatternDashboard />
              </PremiumGate>
            </ControlledSection>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </PageTransition>
  );
}
