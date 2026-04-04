import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2, Copy, ExternalLink, Eye, Lock, RotateCcw, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { UnlockArtifactButton } from "@/components/artifacts/UnlockArtifactButton";
import { CapitalizeActions } from "@/components/artifacts/CapitalizeActions";
import { PostExecutionRecommendations } from "@/components/services/PostExecutionRecommendations";

interface JobDetail {
  id: string;
  worker_type: string;
  status: string;
  input: any;
  result: any;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  retry_count: number;
  max_retries: number;
  progress?: number;
  current_step?: string;
}

interface ArtifactItem {
  id: string;
  title: string;
  artifact_type: string;
  content: string;
  preview_content: string | null;
  is_locked: boolean;
  created_at: string;
  format: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "În așteptare", color: "bg-muted text-muted-foreground", icon: Clock },
  running: { label: "Se execută", color: "bg-primary/15 text-primary", icon: Loader2 },
  completed: { label: "Finalizat", color: "bg-emerald-500/15 text-emerald-600", icon: CheckCircle },
  failed: { label: "Eșuat", color: "bg-destructive/15 text-destructive", icon: XCircle },
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id || !user) return;
    fetchJob();

    const channel = supabase
      .channel(`job-${id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "neuron_jobs",
        filter: `id=eq.${id}`,
      }, () => fetchJob())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  const fetchJob = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("neuron_jobs")
      .select("id, worker_type, status, input, result, error_message, created_at, completed_at, retry_count, max_retries")
      .eq("id", id)
      .single();

    if (data) {
      setJob(data as JobDetail);
      // Fetch artifacts for this job
      const { data: arts } = await supabase
        .from("artifacts")
        .select("id, title, artifact_type, content, preview_content, is_locked, created_at, format")
        .eq("job_id", id)
        .order("created_at", { ascending: false });

      if (arts) setArtifacts(arts as ArtifactItem[]);
    }
    setLoading(false);
  };

  const getProgress = () => {
    if (!job) return 0;
    if (job.status === "completed") return 100;
    if (job.status === "failed") return 100;
    if (job.status === "running") return job.progress || 60;
    return 0;
  };

  const getETA = () => {
    if (!job || job.status !== "running") return null;
    const elapsed = Date.now() - new Date(job.created_at).getTime();
    const estimated = elapsed / (getProgress() / 100);
    const remaining = Math.max(0, estimated - elapsed);
    if (remaining < 60000) return `~${Math.ceil(remaining / 1000)}s`;
    return `~${Math.ceil(remaining / 60000)}min`;
  };

  const statusCfg = STATUS_CONFIG[job?.status || "pending"] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    );
  }

  if (!job) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Job not found</p>
          <Button variant="ghost" onClick={() => navigate("/jobs")} className="mt-4">← Înapoi la Jobs</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <SEOHead title={`Job ${job.id.slice(0, 8)}`} description="Job execution detail" />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">
              {(job.input as any)?.service_name || job.worker_type}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">{job.id.slice(0, 12)}...</p>
          </div>
          <Badge className={cn("text-[10px]", statusCfg.color)}>
            <StatusIcon className={cn("h-3 w-3 mr-1", job.status === "running" && "animate-spin")} />
            {statusCfg.label}
          </Badge>
        </div>

        {/* Progress */}
        {(job.status === "running" || job.status === "pending") && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progres</span>
              {getETA() && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> ETA: {getETA()}
                </span>
              )}
            </div>
            <Progress value={getProgress()} className="h-2" />
            <div className="text-[10px] text-muted-foreground font-mono space-y-1">
              {job.status === "running" && (
                <>
                  <p>▸ Analizez conținutul input...</p>
                  <p>▸ Extrag pattern-uri și structuri...</p>
                  <p className="text-primary">▸ Generez output profesional...</p>
                </>
              )}
              {job.status === "pending" && <p>▸ În coadă — se așteaptă slot disponibil...</p>}
            </div>
          </div>
        )}

        {/* Error + Actions */}
        {job.status === "failed" && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
            {job.error_message && (
              <>
                <p className="text-sm text-destructive font-medium">Eroare</p>
                <p className="text-xs text-muted-foreground mt-1">{job.error_message}</p>
              </>
            )}
            {job.retry_count > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Retry: {job.retry_count}/{job.max_retries}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={async () => {
                  const { error } = await supabase.from("neuron_jobs")
                    .update({ status: "pending", error_message: null, completed_at: null, retry_count: (job.retry_count || 0) + 1 })
                    .eq("id", job.id);
                  if (error) { toast.error("Retry failed"); return; }
                  toast.success("Job re-queued for retry");
                  fetchJob();
                }}
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Cancel running/pending jobs */}
        {(job.status === "running" || job.status === "pending") && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 text-xs"
              onClick={async () => {
                const { error } = await supabase.from("neuron_jobs")
                  .update({ status: "failed", error_message: "Cancelled by user", completed_at: new Date().toISOString() })
                  .eq("id", job.id);
                if (error) { toast.error("Cancel failed"); return; }
                // Release reserved credits
                await supabase.rpc("release_neurons", {
                  _user_id: user!.id,
                  _amount: (job.input as any)?.credits_cost || 0,
                  _description: `Cancelled job ${job.id.slice(0, 8)}`,
                });
                toast.success("Job cancelled — credits returned");
                fetchJob();
              }}
            >
              <Ban className="h-3 w-3" />
              Cancel & Refund
            </Button>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Creat", value: new Date(job.created_at).toLocaleString("ro-RO") },
            { label: "Finalizat", value: job.completed_at ? new Date(job.completed_at).toLocaleString("ro-RO") : "—" },
            { label: "Tip", value: job.worker_type },
            { label: "Nivel", value: (job.input as any)?.service_level || "—" },
          ].map(item => (
            <div key={item.label} className="bg-muted/30 rounded-lg p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
              <p className="text-xs font-medium truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Artifacts (Output) */}
        {artifacts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Rezultate ({artifacts.length})</h2>
            {artifacts.map(art => {
              const isUnlocked = showFull[art.id] || !art.is_locked;
              const displayContent = isUnlocked
                ? art.content
                : (art.preview_content || (art.content ?? "").slice(0, Math.floor((art.content ?? "").length * 0.2)));

              return (
                <div key={art.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px]">{art.artifact_type}</Badge>
                      <span className="text-sm font-medium truncate">{art.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {art.is_locked && !showFull[art.id] && (
                        <Badge variant="outline" className="text-[8px] gap-1">
                          <Lock className="h-2.5 w-2.5" /> Preview 20%
                        </Badge>
                      )}
                       <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => {
                          navigator.clipboard.writeText(isUnlocked ? art.content : displayContent);
                          toast.success("Copiat!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {isUnlocked && (
                        <CapitalizeActions
                          artifactId={art.id}
                          title={art.title}
                          content={art.content}
                          artifactType={art.artifact_type}
                        />
                      )}
                    </div>
                  </div>

                  <div className="p-4 relative">
                    <div className={cn(
                      "text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto",
                      !isUnlocked && "max-h-[200px] overflow-hidden"
                    )}>
                      {displayContent}
                    </div>

                    {/* Lock overlay */}
                    {art.is_locked && !showFull[art.id] && (
                      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card to-transparent flex items-end justify-center pb-4">
                        <UnlockArtifactButton
                          artifactId={art.id}
                          onUnlocked={() => setShowFull(prev => ({ ...prev, [art.id]: true }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Result JSON (fallback) */}
        {job.result && artifacts.length === 0 && (
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Result</p>
            <pre className="text-xs font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {typeof job.result === "string" ? job.result : JSON.stringify(job.result, null, 2)}
            </pre>
          </div>
        )}

        {/* Post-execution recommendations */}
        {job.status === "completed" && (
          <PostExecutionRecommendations
            serviceKey={(job.input as any)?.service_key || job.worker_type}
            serviceCategory={(job.input as any)?.service_category}
            lastOutput={typeof job.result === "string" ? job.result : JSON.stringify(job.result, null, 2)}
            lastGoal={(job.input as any)?.goal || ""}
            onChainService={(chainKey, prefill) => {
              navigate(`/run/${chainKey}`, { state: { prefillInput: prefill.input, prefillGoal: prefill.goal } });
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}
