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
import {
  Loader2, Clock, CheckCircle2, XCircle,
  Play, ChevronRight, Sparkles, AlertCircle,
  Search, X, BarChart3, HelpCircle, Info,
  ChevronDown, ChevronUp, FileAudio, Brain,
  ArrowRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ListPageSkeleton } from "@/components/skeletons/ListPageSkeleton";

interface Job {
  id: string;
  neuron_id: number;
  worker_type: string;
  status: string;
  input: any;
  result: any;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  retry_count: number;
  max_retries: number;
}

const STATUS_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground" },
  running: { icon: Play, color: "text-primary" },
  completed: { icon: CheckCircle2, color: "text-status-validated" },
  failed: { icon: XCircle, color: "text-destructive" },
};

type StatusFilter = "all" | "pending" | "running" | "completed" | "failed";

/* ── Educational guide component ── */
function JobsGuide() {
  const { t } = useTranslation("pages");
  const [open, setOpen] = useState(() => {
    return localStorage.getItem("jobs_guide_dismissed") !== "true";
  });

  const dismiss = () => {
    setOpen(false);
    localStorage.setItem("jobs_guide_dismissed", "true");
  };

  const statusKeys = ["pending", "running", "completed", "failed"] as const;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-primary/15 bg-primary/5 mb-6 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t("jobs.guide_title")}</p>
              <p className="text-[10px] text-muted-foreground">{t("jobs.guide_subtitle")}</p>
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("jobs.guide_desc")}
            </p>

            {/* Pipeline visualization */}
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {[
                { icon: FileAudio, label: t("jobs.step_upload"), desc: t("jobs.step_upload_desc") },
                { icon: Brain, label: t("jobs.step_extract"), desc: t("jobs.step_extract_desc") },
                { icon: Zap, label: t("jobs.step_process"), desc: t("jobs.step_process_desc") },
                { icon: Sparkles, label: t("jobs.step_deliver"), desc: t("jobs.step_deliver_desc") },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/30 mx-0.5" />}
                  <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
                    <step.icon className="h-3 w-3 text-primary/60" />
                    <div>
                      <p className="text-[9px] font-semibold">{step.label}</p>
                      <p className="text-[8px] text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status legend */}
            <div className="grid grid-cols-2 gap-2">
              {statusKeys.map(key => {
                const si = STATUS_ICONS[key] || STATUS_ICONS.pending;
                const Icon = si.icon;
                return (
                  <div key={key} className="flex items-start gap-2 bg-card border border-border rounded-lg p-2.5">
                    <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", si.color)} />
                    <div>
                      <p className="text-[10px] font-semibold">{t(`jobs.status_${key}`)}</p>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">{t(`jobs.status_${key}_desc`)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={dismiss}>
                {t("jobs.guide_dismiss")}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function Jobs() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !user || !currentWorkspace) return;
    fetchJobs();
    const channel = supabase
      .channel("jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "neuron_jobs" }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading, currentWorkspace]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("neuron_jobs")
      .select("id, neuron_id, worker_type, status, input, result, error_message, created_at, completed_at, retry_count, max_retries")
      .eq("workspace_id", currentWorkspace!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setJobs(data as Job[]);
    if (error) toast.error("Failed to load jobs");
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

  // Stats
  const completedCount = jobs.filter(j => j.status === "completed").length;
  const failedCount = jobs.filter(j => j.status === "failed").length;
  const runningCount = jobs.filter(j => j.status === "running" || j.status === "pending").length;
  const avgDuration = useMemo(() => {
    const durations = jobs
      .filter(j => j.completed_at)
      .map(j => (new Date(j.completed_at!).getTime() - new Date(j.created_at).getTime()) / 1000);
    return durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  }, [jobs]);

  if (authLoading || loading) {
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

          {/* Educational guide */}
          <JobsGuide />

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: t("jobs.stat_completed"), value: completedCount, color: "text-status-validated", tip: t("jobs.stat_completed_tip") },
              { label: t("jobs.stat_failed"), value: failedCount, color: "text-destructive", tip: t("jobs.stat_failed_tip") },
              { label: t("jobs.stat_active"), value: runningCount, color: "text-primary", tip: t("jobs.stat_active_tip") },
              { label: t("jobs.stat_avg_duration"), value: avgDuration, color: "", tip: t("jobs.stat_avg_duration_tip"), suffix: "sec" },
            ].map(stat => (
              <Tooltip key={stat.label}>
                <TooltipTrigger asChild>
                  <div className="bg-card border border-border rounded-xl p-4 cursor-default">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-2xl font-bold font-mono", stat.color)}>{stat.value}</span>
                      {stat.suffix && <span className="text-[10px] text-muted-foreground">{stat.suffix}</span>}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-[10px]">{stat.tip}</TooltipContent>
              </Tooltip>
            ))}
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
              {filtered.map(job => {
                const si = STATUS_ICONS[job.status] || STATUS_ICONS.pending;
                const StatusIcon = si.icon;
                const statusLabel = t(`jobs.status_${job.status}`);
                const statusDesc = t(`jobs.status_${job.status}_desc`);
                const isExpanded = expandedJob === job.id;
                const duration = job.completed_at
                  ? Math.round((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / 1000)
                  : null;

                return (
                  <div key={job.id} className="border border-border rounded-xl bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                            job.status === "completed" ? "bg-status-validated/10" :
                            job.status === "failed" ? "bg-destructive/10" :
                            job.status === "running" ? "bg-primary/10" : "bg-muted"
                          )}>
                            <StatusIcon className={cn("h-3.5 w-3.5", si.color)} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-[10px] max-w-[200px]">{statusDesc}</TooltipContent>
                      </Tooltip>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{job.worker_type.replace(/_/g, " ")}</span>
                          <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full", si.color, "bg-current/10")}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                          </span>
                          {duration !== null && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {duration}s
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-muted-foreground/50">
                            N#{job.neuron_id}
                          </span>
                          {job.retry_count > 0 && (
                            <span className="text-[9px] text-destructive/60">
                              retry {job.retry_count}/{job.max_retries}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border">
                        {job.input && Object.keys(job.input).length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Input</p>
                            <pre className="text-[11px] font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(job.input, null, 2)}
                            </pre>
                          </div>
                        )}
                        {job.result && Object.keys(job.result).length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("jobs.result_label")}</p>
                            <pre className="text-[11px] font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {typeof job.result === "object" && job.result.content
                                ? job.result.content
                                : JSON.stringify(job.result, null, 2)}
                            </pre>
                          </div>
                        )}
                        {job.status === "failed" && (
                          <div className="flex items-start gap-2 mt-2 bg-destructive/5 border border-destructive/15 rounded-lg p-3">
                            <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-destructive font-medium">
                              {job.error_message || (job.result as any)?.error || t("jobs.job_failed_label")}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {job.retry_count >= job.max_retries
                                  ? t("jobs.retries_exhausted")
                                  : t("jobs.retries_remaining", { current: job.retry_count, max: job.max_retries })}
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Quick actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {job.status === "failed" && job.retry_count < job.max_retries && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={async () => {
                                const { data, error } = await supabase.rpc("retry_failed_job", { _job_id: job.id });
                                if (error || !data) toast.error(t("jobs.retry_failed"));
                                else { toast.success(t("jobs.job_rescheduled")); fetchJobs(); }
                              }}
                            >
                              <Play className="h-3 w-3" /> {t("jobs.retry")}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => navigate(`/n/${job.neuron_id}`)}
                          >
                            <Brain className="h-3 w-3" /> {t("jobs.view_neuron")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
    </TooltipProvider>
  );
}
