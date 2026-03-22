import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { WhatsNewWidget } from "@/components/home/WhatsNewWidget";
import { TrendingIdeasWidget } from "@/components/home/TrendingIdeasWidget";
import { HomePricingSection } from "@/components/home/HomePricingSection";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Upload, Brain, Sparkles, Briefcase, Coins, ArrowRight,
  Clock, Plus, Zap, TrendingUp, FileText, Youtube, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PipelineIndicator } from "@/components/PipelineIndicator";
import { IMFPipelineLauncher } from "@/components/pipeline/IMFPipelineLauncher";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { LeaderboardWidget } from "@/components/gamification/LeaderboardWidget";
import { DailyChallenges } from "@/components/gamification/DailyChallenges";
import { TopUpDialog } from "@/components/credits/TopUpDialog";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";
import { motion } from "framer-motion";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { GuidedTooltip } from "@/components/onboarding/GuidedTooltip";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { PageTransition } from "@/components/motion/PageTransition";
import { ControlledSection } from "@/components/ControlledSection";

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

  const QUICK_ACTIONS = [
    {
      label: t("home.quick_actions.transcribe"),
      desc: t("home.quick_actions.transcribe_desc"),
      icon: Youtube,
      path: "/transcribe",
      gradient: "from-destructive/15 to-destructive/5",
    },
    {
      label: t("home.quick_actions.upload"),
      desc: t("home.quick_actions.upload_desc"),
      icon: Upload,
      path: "/extractor",
      gradient: "from-primary/15 to-primary/5",
    },
    {
      label: t("home.quick_actions.new_neuron"),
      desc: t("home.quick_actions.new_neuron_desc"),
      icon: Plus,
      path: "/n/new",
      gradient: "from-primary/10 to-accent/5",
    },
    {
      label: t("home.quick_actions.run_service"),
      desc: t("home.quick_actions.run_service_desc"),
      icon: Sparkles,
      path: "/services",
      gradient: "from-accent/15 to-primary/5",
    },
    {
      label: t("home.quick_actions.view_jobs"),
      desc: t("home.quick_actions.view_jobs_desc"),
      icon: Briefcase,
      path: "/jobs",
      gradient: "from-muted to-card",
    },
  ];

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

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  };

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

        {/* ═══════════ SCROLL 1: HERO — Welcome + Stats ═══════════ */}
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-1.5">
            {isNewUser ? t("home.welcome") : t("home.cockpit")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
            {isNewUser ? t("home.welcome_desc") : t("home.cockpit_desc")}
          </p>
        </motion.section>

        {/* ═══════════ SCROLL 2: KPI Stats Row ═══════════ */}
        <ControlledSection elementId="home.stats_row">
        <motion.section variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.div variants={fadeUp}><StatCard icon={Brain} label={t("admin.neurons", "Neurons")} value={totalNeurons} /></motion.div>
          <motion.div variants={fadeUp}><StatCard icon={FileText} label={t("admin.episodes", "Episodes")} value={totalEpisodes} /></motion.div>
          <motion.div variants={fadeUp}><StatCard icon={Zap} label={t("admin.jobs", "Jobs")} value={totalJobs} /></motion.div>
          <motion.div variants={fadeUp}>
            <div className="rounded-xl p-4 border border-primary/20 bg-primary/5 h-full flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("credits.title", "Credits")}</span>
              </div>
              <p className="text-xl font-bold font-mono text-primary mb-2">{balance.toLocaleString()}</p>
              <TopUpDialog onSuccess={loadData} />
            </div>
          </motion.div>
        </motion.section>
        </ControlledSection>

        {/* ═══════════ SCROLL 3: Pricing & Conversion ═══════════ */}
        <ControlledSection elementId="home.pricing_section">
          <HomePricingSection />
        </ControlledSection>

        {/* ═══════════ SCROLL 4: Quick Actions ═══════════ */}
        <ControlledSection elementId="home.quick_actions">
        <motion.section variants={stagger} initial="hidden" animate="visible">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{t("home.quick_actions_title", "Quick Actions")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(action => (
              <motion.button
                key={action.label}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.path)}
                data-tour={action.path === "/extractor" ? "upload" : action.path === "/neurons" ? "neurons" : action.path === "/services" ? "services" : undefined}
                className={cn(
                  "group relative flex flex-col items-start gap-3 p-4 rounded-xl border border-border",
                  "bg-gradient-to-br hover:border-primary/30 hover:shadow-lg transition-all duration-200",
                  action.gradient
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-background/80 border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-sm transition-all">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight mb-0.5">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{action.desc}</p>
                </div>
                <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </motion.button>
            ))}
          </div>
        </motion.section>
        </ControlledSection>

        {/* ═══════════ SCROLL 4: Onboarding ═══════════ */}
        <OnboardingChecklist />

        {/* ═══════════ SCROLL 5: Instant Action Surface ═══════════ */}
        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.45 }}
        >
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-serif font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {isNewUser ? t("home.instant_action_new", "Start here — paste a link and let AI do the rest") : t("home.instant_action", "Quick Analyze")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              {t("home.instant_action_desc", "Paste a URL, drop a file, or type text. The system will transcribe, extract neurons, and build your knowledge graph automatically.")}
            </p>
          </div>
          <InstantActionSurface onComplete={loadData} compact />
        </motion.section>

        {/* ═══════════ SCROLL 6: First Service CTA ═══════════ */}
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
              <h2 className="text-lg sm:text-xl font-serif font-bold mb-2">{t("home.first_service_title", "Run your first AI service")}</h2>
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

        {/* ═══════════ SCROLL 7: Main Content Grid ═══════════ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          {/* Left column: Recent items */}
          <div className="lg:col-span-2 space-y-5">
            {/* Recent Neurons */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5" /> {t("home.recent_neurons")}
                </h3>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/neurons")}>
                  {t("common:view_all", "All")} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              {neurons.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <Brain className="h-6 w-6 text-primary/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t("home.no_neurons")}</p>
                  <p className="text-xs text-muted-foreground/60 mb-3">{t("home.first_step_desc")}</p>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/extractor")}>
                    <Upload className="h-3.5 w-3.5" />
                    {t("home.open_extractor")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {neurons.map(n => (
                    <button
                      key={n.id}
                      onClick={() => navigate(`/n/${n.number}`)}
                      className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    >
                      <span className="text-sm truncate flex-1 group-hover:text-primary transition-colors">{n.title}</span>
                      <span className={cn(
                        "text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ml-3 shrink-0",
                        n.status === "published" ? "bg-primary/10 text-primary" :
                        "bg-muted text-muted-foreground"
                      )}>{n.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Jobs */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> {t("home.recent_jobs")}
                </h3>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/jobs")}>
                  {t("common:view_all", "All")} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t("home.no_jobs")}</p>
                  <p className="text-xs text-muted-foreground/60 mb-3">{t("home.no_jobs_hint", "Run an AI service to generate deliverables")}</p>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/services")}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("home.browse_services", "Browse Services")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {jobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className="text-sm truncate flex-1">{job.worker_type.replace(/-/g, " ")}</span>
                      <span className={cn(
                        "text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ml-3 shrink-0",
                        job.status === "completed" ? "bg-primary/10 text-primary" :
                        job.status === "failed" ? "bg-destructive/15 text-destructive" :
                        "bg-muted text-muted-foreground"
                      )}>{job.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Gamification + Pipeline + What's New */}
          <div className="space-y-5">
            {/* XP Progress */}
            <XPProgressBar />

            {/* Daily Challenges */}
            <DailyChallenges />

            {/* IMF Pipeline Launcher */}
            {totalNeurons > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                  <Layers className="h-3.5 w-3.5" /> {t("home.imf_pipeline", "Knowledge Multiplication")}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">{t("home.imf_pipeline_desc", "Run the full extraction pipeline on a neuron to generate 50+ deliverables automatically.")}</p>
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

            {/* Leaderboard */}
            <LeaderboardWidget />

            {/* Trending Ideas */}
            <TrendingIdeasWidget />

            {/* What's New */}
            <WhatsNewWidget />
          </div>
        </motion.section>
      </div>
    </div>
    </PageTransition>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType; label: string; value: number; highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-xl p-4 border transition-all duration-200 h-full cursor-default",
        highlight
          ? "bg-primary/5 border-primary/20 hover:shadow-md hover:shadow-primary/5"
          : "bg-card border-border hover:shadow-md hover:border-border/80"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", highlight ? "text-primary" : "text-muted-foreground")} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold font-mono", highlight && "text-primary")}>{value.toLocaleString()}</p>
    </motion.div>
  );
}
