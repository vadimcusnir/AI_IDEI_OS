import { useState, useEffect, useMemo } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Search, X, Sparkles, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ListPageSkeleton } from "@/components/skeletons/ListPageSkeleton";
import { JobCard, type Job } from "@/components/jobs/JobCard";
import { JobStats } from "@/components/jobs/JobStats";
import { ProductionMonitorCard } from "@/components/jobs/ProductionMonitorCard";
import { motion } from "framer-motion";

type StatusFilter = "all" | "pending" | "running" | "completed" | "failed";

export default function Jobs() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) { setLoading(false); return; }
    fetchJobs();
    const channel = supabase
      .channel("jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "neuron_jobs" }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading, wsLoading, currentWorkspace]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("neuron_jobs")
      .select("id, neuron_id, worker_type, status, input, result, error_message, created_at, completed_at, retry_count, max_retries, priority, progress, current_step, total_steps, queue_position, estimated_remaining_seconds")
      .eq("workspace_id", currentWorkspace!.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setJobs(data as unknown as Job[]);
    if (error) toast.error(t("jobs.failed_to_load"));
    setLoading(false);
  };

  const activeJobs = useMemo(() =>
    jobs.filter(j => j.status === "running" || j.status === "pending"),
    [jobs]
  );

  const recentCompleted = useMemo(() =>
    jobs.filter(j => {
      if (j.status !== "completed") return false;
      const completedAt = j.completed_at ? new Date(j.completed_at).getTime() : 0;
      return Date.now() - completedAt < 30 * 60 * 1000; // last 30 min
    }),
    [jobs]
  );

  const historyJobs = useMemo(() => {
    let list = jobs.filter(j => {
      if (activeJobs.some(a => a.id === j.id)) return false;
      if (recentCompleted.some(r => r.id === j.id)) return false;
      return true;
    });
    if (statusFilter !== "all") list = list.filter(j => j.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j => j.worker_type.toLowerCase().includes(q));
    }
    return list;
  }, [jobs, activeJobs, recentCompleted, statusFilter, search]);

  const completedCount = jobs.filter(j => j.status === "completed").length;
  const failedCount = jobs.filter(j => j.status === "failed").length;
  const runningCount = activeJobs.length;
  const avgDuration = useMemo(() => {
    const durations = jobs
      .filter(j => j.completed_at)
      .map(j => (new Date(j.completed_at!).getTime() - new Date(j.created_at).getTime()) / 1000);
    return durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  }, [jobs]);

  if (authLoading || wsLoading || loading) {
    return <ListPageSkeleton columns={1} />;
  }

  return (
    <TooltipProvider>
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Production Monitor — AI-IDEI" description="Monitor your AI production jobs in real-time." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Production Monitor</h1>
                <p className="text-micro text-muted-foreground">
                  Monitorizează producția AI în timp real
                </p>
              </div>
            </div>
            {runningCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-micro font-semibold text-primary">
                  {runningCount} active
                </span>
              </div>
            )}
          </div>

          <JobStats
            completedCount={completedCount}
            failedCount={failedCount}
            runningCount={runningCount}
            avgDuration={avgDuration}
          />

          {/* ═══ ACTIVE PRODUCTIONS ═══ */}
          {(activeJobs.length > 0 || recentCompleted.length > 0) && (
            <div className="mb-6 space-y-3">
              {activeJobs.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Producții Active
                  </span>
                </div>
              )}
              {activeJobs.map(job => (
                <ProductionMonitorCard key={job.id} job={job} />
              ))}

              {recentCompleted.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-2">
                    <span className="h-2 w-2 rounded-full bg-status-validated" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Finalizate Recent
                    </span>
                  </div>
                  {recentCompleted.map(job => (
                    <ProductionMonitorCard key={job.id} job={job} />
                  ))}
                </>
              )}
            </div>
          )}

          {/* ═══ HISTORY ═══ */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Istoric Producții</h2>
              <span className="text-micro text-muted-foreground font-mono">
                {historyJobs.length} jobs
              </span>
            </div>

            {/* Filters + Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5 flex-wrap">
                {([
                  { value: "all" as StatusFilter, label: t("jobs.filter_all") },
                  { value: "completed" as StatusFilter, label: t("jobs.filter_completed") },
                  { value: "running" as StatusFilter, label: t("jobs.filter_active") },
                  { value: "failed" as StatusFilter, label: t("jobs.filter_failed") },
                ]).map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      "px-2 py-1 rounded text-micro font-medium transition-colors",
                      statusFilter === f.value ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 flex-1 sm:max-w-[200px]">
                <Search className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("jobs.search_placeholder")}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Job list */}
            {historyJobs.length === 0 && jobs.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="h-8 w-8 opacity-20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">{t("jobs.no_jobs")}</p>
                <p className="text-micro text-muted-foreground/60 mb-6">{t("jobs.no_jobs_hint")}</p>
                <Button onClick={() => navigate("/services")} className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  {t("jobs.ai_services")}
                </Button>
              </div>
            ) : historyJobs.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground mb-2">{t("jobs.no_filter_results")}</p>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setStatusFilter("all"); setSearch(""); }}>
                  {t("jobs.clear_filters")}
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {historyJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isExpanded={expandedJob === job.id}
                    onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    onRefresh={fetchJobs}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
    </TooltipProvider>
  );
}
