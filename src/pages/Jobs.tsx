import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Clock, CheckCircle2, XCircle,
  Play, ChevronRight, Sparkles, AlertCircle,
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
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  running: { icon: Play, color: "text-primary", label: "Running" },
  completed: { icon: CheckCircle2, color: "text-status-validated", label: "Completed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
};

export default function Jobs() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    fetchJobs();

    // Realtime subscription for job updates
    const channel = supabase
      .channel("jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "neuron_jobs" }, () => {
        fetchJobs();
      })
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

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img src={logo} alt="ai-idei.com" className="h-5 w-5" />
          <span className="text-sm font-serif">Jobs</span>
          <span className="text-[9px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
            Execution Log
          </span>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/services")}>
          <Sparkles className="h-3.5 w-3.5" />
          Run Service
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-serif">Job History</h1>
          <span className="text-xs text-muted-foreground">{jobs.length} jobs</span>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="h-10 w-10 opacity-20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No jobs yet.</p>
            <p className="text-xs text-muted-foreground/60 mb-6">Run a service to create your first job.</p>
            <Button onClick={() => navigate("/services")} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Browse Services
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => {
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
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <StatusIcon className={cn("h-4 w-4 shrink-0", cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{job.worker_type.replace(/_/g, " ")}</span>
                        <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full", cfg.color, "bg-current/10")}>
                          {cfg.label}
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
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Result</p>
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
                            {(job.result as any)?.error || "Job failed"}
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
