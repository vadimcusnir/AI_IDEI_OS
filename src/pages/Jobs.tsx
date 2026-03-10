import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Loader2, Clock, CheckCircle2, XCircle,
  Play, ChevronRight, Sparkles, AlertCircle,
  Search, X, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  neuron_id: number;
  worker_type: string;
  status: string;
  input: any;
  result: any;
  created_at: string;
  completed_at: string | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "În așteptare" },
  running: { icon: Play, color: "text-primary", label: "Rulează" },
  completed: { icon: CheckCircle2, color: "text-status-validated", label: "Finalizat" },
  failed: { icon: XCircle, color: "text-destructive", label: "Eșuat" },
};

type StatusFilter = "all" | "pending" | "running" | "completed" | "failed";

export default function Jobs() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    fetchJobs();
    const channel = supabase
      .channel("jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "neuron_jobs" }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("neuron_jobs")
      .select("*")
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
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Istoric Execuții</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {jobs.length} job-uri
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Finalizate</p>
            <span className="text-2xl font-bold font-mono text-status-validated">{completedCount}</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Eșuate</p>
            <span className="text-2xl font-bold font-mono text-destructive">{failedCount}</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Active</p>
            <span className="text-2xl font-bold font-mono text-primary">{runningCount}</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Durată medie</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{avgDuration}</span>
              <span className="text-[10px] text-muted-foreground">sec</span>
            </div>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5 flex-wrap">
            {([
              { value: "all" as StatusFilter, label: "Toate" },
              { value: "completed" as StatusFilter, label: "Finalizate" },
              { value: "running" as StatusFilter, label: "Active" },
              { value: "failed" as StatusFilter, label: "Eșuate" },
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
              placeholder="Caută job..."
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
                <p className="text-sm text-muted-foreground mb-1">Niciun job încă</p>
                <p className="text-[10px] text-muted-foreground/60 mb-6">Rulează un serviciu pentru a crea primul job.</p>
                <Button onClick={() => navigate("/services")} className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Servicii AI
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">Niciun rezultat pentru filtrul selectat</p>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setStatusFilter("all"); setSearch(""); }}>
                  Șterge filtrele
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(job => {
              const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
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
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                      job.status === "completed" ? "bg-status-validated/10" :
                      job.status === "failed" ? "bg-destructive/10" :
                      job.status === "running" ? "bg-primary/10" : "bg-muted"
                    )}>
                      <StatusIcon className={cn("h-3.5 w-3.5", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{job.worker_type.replace(/_/g, " ")}</span>
                        <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full", cfg.color, "bg-current/10")}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(job.created_at).toLocaleString("ro-RO")}
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
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Rezultat</p>
                          <pre className="text-[11px] font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {typeof job.result === "object" && job.result.content
                              ? job.result.content
                              : JSON.stringify(job.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      {job.status === "failed" && (
                        <div className="flex items-center gap-2 mt-2 text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            {(job.result as any)?.error || "Job eșuat"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
