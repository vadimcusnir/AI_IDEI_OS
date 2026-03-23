import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { HomePricingSection } from "@/components/home/HomePricingSection";
import { HomeStatsRow } from "@/components/home/HomeStatsRow";
import { HomeQuickActions } from "@/components/home/HomeQuickActions";
import { HomeRecentItems } from "@/components/home/HomeRecentItems";
import { HomeRightSidebar } from "@/components/home/HomeRightSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { GuidedTooltip } from "@/components/onboarding/GuidedTooltip";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { PageTransition } from "@/components/motion/PageTransition";
import { ControlledSection } from "@/components/ControlledSection";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";

interface RecentNeuron {
  id: number;
  number: number;
  title: string;
  status: string;
  updated_at: string;
}

interface RecentJob {
  id: string;
  worker_type: string;
  status: string;
  created_at: string;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  const [neurons, setNeurons] = useState<RecentNeuron[]>([]);
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [totalNeurons, setTotalNeurons] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) { setLoading(false); return; }
    loadData();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  const loadData = async () => {
    const wsId = currentWorkspace!.id;
    const [neuronsRes, jobsRes, episodesRes, neuronsCount, jobsCount] = await Promise.all([
      supabase.from("neurons").select("id, number, title, status, updated_at")
        .eq("workspace_id", wsId).order("updated_at", { ascending: false }).limit(5),
      supabase.from("neuron_jobs").select("id, worker_type, status, created_at")
        .eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(5),
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
    ]);

    setNeurons(neuronsRes.data as RecentNeuron[] || []);
    setJobs(jobsRes.data as RecentJob[] || []);
    setTotalNeurons(neuronsCount.count ?? 0);
    setTotalEpisodes(episodesRes.count ?? 0);
    setTotalJobs(jobsCount.count ?? 0);
    setLoading(false);
  };

  useOnboardingRedirect();

  if (authLoading || wsLoading || loading) {
    return <HomeSkeleton />;
  }

  const isNewUser = neurons.length === 0 && jobs.length === 0;

  return (
    <PageTransition>
    <div className="flex-1 overflow-auto">
      <WelcomeModal />
      <GuidedTooltip
        tourId="home"
        steps={[
          { target: "[data-tour='upload']", title: t("home.quick_actions.upload"), description: t("home.tour_upload_desc", "Start here — add a podcast, video, or text to begin extracting knowledge."), position: "bottom" },
          { target: "[data-tour='neurons']", title: t("home.recent_neurons"), description: t("home.tour_neurons_desc", "Extracted atomic knowledge units appear here. Each neuron is reusable forever."), position: "bottom" },
          { target: "[data-tour='services']", title: t("home.quick_actions.run_service"), description: t("home.tour_services_desc", "Run services to transform neurons into professional deliverables."), position: "bottom" },
        ]}
      />
      <SEOHead title={`${t("home.cockpit")} — AI-IDEI`} description={t("home.cockpit_desc")} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5">
            {isNewUser ? t("home.welcome") : t("home.cockpit")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
            {isNewUser ? t("home.welcome_desc") : t("home.cockpit_desc")}
          </p>
        </motion.section>

        {/* KPI Stats */}
        <HomeStatsRow
          totalNeurons={totalNeurons}
          totalEpisodes={totalEpisodes}
          totalJobs={totalJobs}
          balance={balance}
          onDataRefresh={loadData}
        />

        {/* Pricing */}
        <ControlledSection elementId="home.pricing_section">
          <HomePricingSection />
        </ControlledSection>

        {/* Quick Actions */}
        <HomeQuickActions />

        {/* Onboarding */}
        <OnboardingChecklist />

        {/* Instant Action Surface */}
        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.45 }}
        >
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {isNewUser ? t("home.instant_action_new", "Start here — paste a link and let AI do the rest") : t("home.instant_action", "Quick Analyze")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              {t("home.instant_action_desc", "Paste a URL, drop a file, or type text. The system will transcribe, extract neurons, and build your knowledge graph automatically.")}
            </p>
          </div>
          <InstantActionSurface onComplete={loadData} compact />
        </motion.section>

        {/* First Service CTA */}
        {totalNeurons > 0 && totalJobs === 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-accent/5 p-6 sm:p-8 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.08),transparent_70%)]" />
            <div className="relative">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-bold mb-2">{t("home.first_service_title", "Run your first AI service")}</h2>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto leading-relaxed">
                {t("home.first_service_desc", "You have {{count}} neuron(s). Use them to generate articles, strategies, and more.", { count: totalNeurons })}
              </p>
              <Button onClick={() => navigate("/services")} size="default" className="gap-2 px-6">
                {t("onboarding.steps.execute_action")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.section>
        )}

        {/* Main Content Grid */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          <HomeRecentItems neurons={neurons} jobs={jobs} />
          <HomeRightSidebar totalNeurons={totalNeurons} />
        </motion.section>
      </div>
    </div>
    </PageTransition>
  );
}
