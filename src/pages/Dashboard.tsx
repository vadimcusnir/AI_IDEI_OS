import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Brain, Coins, FileAudio, TrendingUp,
  Layers, Activity, Zap, Clock, BarChart3, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { motion } from "framer-motion";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { PageTransition } from "@/components/motion/PageTransition";
import { ControlledSection } from "@/components/ControlledSection";
import { useTranslation } from "react-i18next";
import { FlowTip } from "@/components/onboarding/FlowTip";

interface DashboardData {
  neurons: { total: number; draft: number; published: number; thisWeek: number };
  episodes: { total: number; analyzed: number; pending: number };
  credits: { balance: number; spent: number; earned: number };
  jobs: { total: number; completed: number; failed: number; avgDuration: number };
  artifacts: { total: number; thisWeek: number };
  categories: Record<string, number>;
  weeklyActivity: { date: string; neurons: number; jobs: number }[];
  recentJobs: { id: string; worker_type: string; status: string; created_at: string }[];
  pipeline: { uploaded: number; transcribed: number; analyzed: number; serviced: number };
}

export default function Dashboard() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  const loadDashboard = async () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const wsId = currentWorkspace!.id;

    const [neuronsRes, episodesRes, creditsRes, jobsRes, artifactsRes] = await Promise.all([
      supabase.from("neurons").select("id, status, content_category, created_at").eq("workspace_id", wsId),
      supabase.from("episodes").select("id, status").eq("workspace_id", wsId),
      supabase.from("user_credits").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("neuron_jobs").select("id, worker_type, status, created_at, completed_at").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(50),
      supabase.from("artifacts").select("id, created_at").eq("workspace_id", wsId),
    ]);

    const neurons = neuronsRes.data || [];
    const episodes = episodesRes.data || [];
    const credits = creditsRes.data;
    const jobs = jobsRes.data || [];
    const artifacts = artifactsRes.data || [];

    const categories: Record<string, number> = {};
    neurons.forEach((n: any) => {
      if (n.content_category) categories[n.content_category] = (categories[n.content_category] || 0) + 1;
    });

    const thisWeekNeurons = neurons.filter((n: any) => new Date(n.created_at) >= weekAgo).length;

    const completedJobs = jobs.filter((j: any) => j.status === "completed");
    const avgDuration = completedJobs.length > 0
      ? completedJobs.reduce((sum: number, j: any) => {
          if (!j.completed_at) return sum;
          return sum + (new Date(j.completed_at).getTime() - new Date(j.created_at).getTime()) / 1000;
        }, 0) / completedJobs.length
      : 0;

    const weeklyActivity: { date: string; neurons: number; jobs: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      weeklyActivity.push({
        date: dateStr,
        neurons: neurons.filter((n: any) => n.created_at.startsWith(dateStr)).length,
        jobs: jobs.filter((j: any) => j.created_at.startsWith(dateStr)).length,
      });
    }

    const episodesByStatus = (status: string) => episodes.filter((e: any) => e.status === status).length;
    const artifactsThisWeek = artifacts.filter((a: any) => new Date(a.created_at) >= weekAgo).length;

    setData({
      neurons: {
        total: neurons.length,
        draft: neurons.filter((n: any) => n.status === "draft").length,
        published: neurons.filter((n: any) => n.status === "published").length,
        thisWeek: thisWeekNeurons,
      },
      episodes: { total: episodes.length, analyzed: episodesByStatus("analyzed"), pending: episodesByStatus("uploaded") + episodesByStatus("transcribed") },
      credits: { balance: credits?.balance ?? 0, spent: credits?.total_spent ?? 0, earned: credits?.total_earned ?? 0 },
      jobs: {
        total: jobs.length,
        completed: completedJobs.length,
        failed: jobs.filter((j: any) => j.status === "failed").length,
        avgDuration: Math.round(avgDuration),
      },
      artifacts: { total: artifacts.length, thisWeek: artifactsThisWeek },
      categories,
      weeklyActivity,
      recentJobs: jobs.slice(0, 5) as any[],
      pipeline: {
        uploaded: episodes.length,
        transcribed: episodesByStatus("transcribed") + episodesByStatus("analyzed"),
        analyzed: episodesByStatus("analyzed"),
        serviced: artifacts.length,
      },
    });
    setLoading(false);
  };

  if (authLoading || wsLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  const maxActivity = Math.max(...data.weeklyActivity.map(d => d.neurons + d.jobs), 1);

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  };

  return (
    <PageTransition>
    <div className="flex-1">
      <SEOHead title="Dashboard — AI-IDEI" description="Full analytics dashboard: neurons, jobs, credits, pipeline status." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Flow guidance */}
        <FlowTip
          tipId="dashboard-welcome"
          variant="info"
          title="Your command center"
          description="This dashboard shows your neurons, credits, jobs and pipeline progress at a glance. Upload content to see your stats grow."
          action={{ label: "Upload content", route: "/extractor" }}
          show={data.neurons.total === 0}
          className="mb-4"
        />
        <FlowTip
          tipId="dashboard-pipeline-hint"
          variant="next-step"
          title="Your pipeline is active!"
          description="You have content uploaded. Head to the Extractor to generate neurons from your transcripts."
          action={{ label: "Go to Extractor", route: "/extractor" }}
          show={data.neurons.total > 0 && data.pipeline.analyzed === 0}
          className="mb-4"
        />

        {/* KPI Row */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
          <motion.div variants={fadeUp}><KPI icon={Brain} label={t("dashboard.neurons")} value={data.neurons.total} sub={t("dashboard.this_week", { count: data.neurons.thisWeek })} /></motion.div>
          <motion.div variants={fadeUp}><KPI icon={Zap} label={t("dashboard.jobs_run")} value={data.jobs.total} sub={t("dashboard.jobs_completed", { count: data.jobs.completed })} /></motion.div>
          <motion.div variants={fadeUp}><KPI icon={Coins} label={t("dashboard.balance")} value={data.credits.balance} sub="NEURONS" color="text-status-validated" /></motion.div>
          <motion.div variants={fadeUp}><KPI icon={TrendingUp} label={t("dashboard.spent")} value={data.credits.spent} sub={t("dashboard.of_earned", { earned: data.credits.earned })} color="text-destructive" /></motion.div>
          <motion.div variants={fadeUp} className="col-span-2 sm:col-span-1"><KPI icon={Layers} label={t("dashboard.artifacts")} value={data.artifacts.total} sub={t("dashboard.this_week", { count: data.artifacts.thisWeek })} /></motion.div>
        </motion.div>

        {/* Pipeline Progress */}
        <ControlledSection elementId="dashboard.pipeline">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> {t("dashboard.pipeline_progress")}
          </h3>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {[
              { label: t("dashboard.upload"), value: data.pipeline.uploaded, icon: FileAudio },
              { label: t("dashboard.transcribe"), value: data.pipeline.transcribed, icon: Layers },
              { label: t("dashboard.extract"), value: data.pipeline.analyzed, icon: Brain },
              { label: t("dashboard.deliver"), value: data.pipeline.serviced, icon: Sparkles },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <div className="flex-1 text-center">
                  <step.icon className={cn("h-4 w-4 mx-auto mb-1", step.value > 0 ? "text-primary" : "text-muted-foreground/30")} />
                  <p className="text-base sm:text-lg font-bold font-mono">{step.value}</p>
                  <p className="text-nano text-muted-foreground">{step.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className={cn("h-0.5 w-3 sm:w-6 rounded-full shrink-0", step.value > 0 ? "bg-primary/40" : "bg-muted")} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
        </ControlledSection>

        {/* Activity Chart + Credit Gauge */}
        <ControlledSection elementId="dashboard.activity_credits">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Activity */}
          <div className="sm:col-span-2 bg-card border border-border rounded-xl p-4">
            <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> {t("dashboard.activity_7d")}
            </h3>
            <div className="flex items-end gap-1 h-24">
              {data.weeklyActivity.map((day, i) => {
                const total = day.neurons + day.jobs;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: 80 }}>
                      <div
                        className="w-full max-w-[24px] bg-primary/30 rounded-t"
                        style={{ height: `${Math.max((day.jobs / maxActivity) * 80, day.jobs > 0 ? 3 : 0)}px` }}
                      />
                      <div
                        className="w-full max-w-[24px] bg-primary rounded-t"
                        style={{ height: `${Math.max((day.neurons / maxActivity) * 80, day.neurons > 0 ? 3 : 0)}px`, marginTop: -1 }}
                      />
                    </div>
                    <span className="text-nano text-muted-foreground">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: "narrow" })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-nano text-muted-foreground"><span className="w-2 h-2 rounded bg-primary inline-block" /> {t("dashboard.neurons")}</span>
              <span className="flex items-center gap-1 text-nano text-muted-foreground"><span className="w-2 h-2 rounded bg-primary/30 inline-block" /> Jobs</span>
            </div>
          </div>

          {/* Credit Gauge */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
            <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("dashboard.credit_economy")}</h3>
            <div className="text-center py-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono">{data.credits.balance}</span>
              <p className="text-micro text-muted-foreground mt-0.5">{t("dashboard.neurons_available")}</p>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${data.credits.earned > 0 ? (data.credits.balance / data.credits.earned) * 100 : 100}%` }}
              />
            </div>
            <Button variant="outline" size="sm" className="text-xs mt-2 w-full" onClick={() => navigate("/credits")}>
              {t("dashboard.view_ledger")}
            </Button>
          </div>
        </motion.div>
        </ControlledSection>

        {/* Categories + Status */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {Object.keys(data.categories).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> {t("dashboard.categories")}
              </h3>
              <div className="space-y-1.5">
                {Object.entries(data.categories)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-micro capitalize truncate">{cat.replace("_", " ")}</span>
                      <span className="text-xs font-mono font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" /> {t("dashboard.system_status")}
            </h3>
            <div className="space-y-2">
              <StatusRow label={t("dashboard.neurons")} value={data.neurons.total} detail={`${data.neurons.draft} ${t("dashboard.draft")} · ${data.neurons.published} ${t("dashboard.published")}`} />
              <StatusRow label="Episodes" value={data.episodes.total} detail={`${data.episodes.analyzed} ${t("dashboard.analyzed")}`} />
              <StatusRow label="Jobs" value={data.jobs.total} detail={`${data.jobs.failed} ${t("dashboard.failed")}`} />
              {data.jobs.avgDuration > 0 && (
                <StatusRow label={t("dashboard.avg_duration")} value={data.jobs.avgDuration} detail={t("dashboard.seconds")} />
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Jobs */}
        {data.recentJobs.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {t("dashboard.recent_jobs")}
              </h3>
              <Button variant="ghost" size="sm" className="text-micro h-6" onClick={() => navigate("/jobs")}>{t("dashboard.view_all")}</Button>
            </div>
            <div className="space-y-1">
              {data.recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between py-1.5">
                  <span className="text-xs truncate flex-1">{job.worker_type.replace(/-/g, " ")}</span>
                  <span className={cn(
                    "text-nano font-mono uppercase px-1.5 py-0.5 rounded",
                    job.status === "completed" ? "bg-status-validated/15 text-status-validated" :
                    job.status === "failed" ? "bg-destructive/15 text-destructive" :
                    "bg-muted text-muted-foreground"
                  )}>{job.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <ControlledSection elementId="dashboard.quick_actions">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.4 }} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
          {[
            { label: t("dashboard.quick_new_neuron"), icon: Brain, path: "/n/new" },
            { label: t("dashboard.quick_extractor"), icon: FileAudio, path: "/extractor" },
            { label: t("dashboard.quick_services"), icon: Sparkles, path: "/services" },
            { label: t("dashboard.quick_intelligence"), icon: BarChart3, path: "/intelligence" },
          ].map(action => (
            <motion.button
              key={action.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-micro font-medium">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
        </ControlledSection>
      </div>
    </div>
    </PageTransition>
  );
}

function KPI({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number; sub?: string; color?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card border border-border rounded-xl p-3 hover:shadow-md hover:border-primary/20 transition-all cursor-default"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold font-mono", color)}>{value}</p>
      {sub && <p className="text-nano text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

function StatusRow({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-micro text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-xs font-mono font-bold">{value}</span>
        <span className="text-nano text-muted-foreground ml-1">{detail}</span>
      </div>
    </div>
  );
}
