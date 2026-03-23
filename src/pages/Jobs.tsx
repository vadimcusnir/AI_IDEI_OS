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
import { Search, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ListPageSkeleton } from "@/components/skeletons/ListPageSkeleton";
import { JobsGuide } from "@/components/jobs/JobsGuide";
import { JobCard, type Job } from "@/components/jobs/JobCard";
import { JobStats } from "@/components/jobs/JobStats";

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
      .select("id, neuron_id, worker_type, status, input, result, error_message, created_at, completed_at, retry_count, max_retries, progress, current_step, depth")
      .eq("workspace_id", currentWorkspace!.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setJobs(data as unknown as Job[]);
    if (error) toast.error(t("jobs.failed_to_load"));
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let list = jobs;
    if (statusFilter !== "all") list = list.filter(j => j.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j => j.worker_type.toLowerCase().includes(q));
    }
    return list;
  }, [jobs, statusFilter, search]);

  const completedCount = jobs.filter(j => j.status === "completed").length;
  const failedCount = jobs.filter(j => j.status === "failed").length;
  const runningCount = jobs.filter(j => j.status === "running" || j.status === "pending").length;
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
        <SEOHead title="Jobs — AI-IDEI" description="Track AI service execution history, status and results." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight">{t("jobs.title")}</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                {t("jobs.count", { count: jobs.length })}
              </span>
            </div>
          </div>

          <JobsGuide />

          <JobStats
            completedCount={completedCount}
            failedCount={failedCount}
            runningCount={runningCount}
            avgDuration={avgDuration}
          />

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
                    "px-2 py-1 rounded text-[10px] font-medium transition-colors",
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
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="h-8 w-8 opacity-20 mx-auto mb-3" />
              {jobs.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-1">{t("jobs.no_jobs")}</p>
                  <p className="text-[10px] text-muted-foreground/60 mb-6">{t("jobs.no_jobs_hint")}</p>
                  <Button onClick={() => navigate("/services")} className="gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    {t("jobs.ai_services")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">{t("jobs.no_filter_results")}</p>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => { setStatusFilter("all"); setSearch(""); }}>
                    {t("jobs.clear_filters")}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(job => (
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
    </PageTransition>
    </TooltipProvider>
  );
}
