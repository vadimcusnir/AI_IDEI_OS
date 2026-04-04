import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import {
  Zap, Loader2, Play, Coins, Clock, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  steps: any[];
  trigger_event: string;
  is_active: boolean;
}

interface PipelineRun {
  id: string;
  pipeline_id: string;
  status: string;
  steps_completed: number;
  total_steps: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface Props {
  neuronId?: number;
  episodeId?: string;
  onComplete?: () => void;
}

export function IMFPipelineLauncher({ neuronId, episodeId, onComplete }: Props) {
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [costEstimates, setCostEstimates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    loadPipelines();
    loadRuns();

    // Realtime subscription for run progress
    const channel = supabase
      .channel("imf-runs")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "imf_pipeline_runs",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const run = payload.new as PipelineRun;
        setRuns(prev => {
          const idx = prev.findIndex(r => r.id === run.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = run;
            return updated;
          }
          return [run, ...prev];
        });
        if (run.status === "completed") {
          toast.success("Pipeline completat!", { description: "Toate livrabilele au fost generate." });
          onComplete?.();
        }
        if (run.status === "failed") {
          toast.error("Pipeline eșuat", { description: run.error_message || "Eroare necunoscută" });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadPipelines = async () => {
    const { data } = await supabase
      .from("imf_pipelines")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setPipelines((data as Pipeline[]) || []);
    setLoading(false);

    // Estimate costs
    if (data) {
      const allServiceKeys = new Set<string>();
      for (const p of data) {
        const steps = Array.isArray(p.steps) ? p.steps : [];
        for (const s of steps) {
          const step = s as Record<string, unknown>;
          if (step.service_key) allServiceKeys.add(step.service_key as string);
        }
      }
      if (allServiceKeys.size > 0) {
        const { data: services } = await supabase
          .from("service_catalog")
          .select("service_key, credits_cost")
          .in("service_key", [...allServiceKeys]);
        const costMap = new Map((services || []).map((s: any) => [s.service_key, s.credits_cost]));
        const estimates: Record<string, number> = {};
        for (const p of data) {
          const steps = Array.isArray(p.steps) ? p.steps : [];
          estimates[p.id] = steps.reduce((sum: number, s: any) =>
            sum + (costMap.get(s.service_key) || 0), 0);
        }
        setCostEstimates(estimates);
      }
    }
  };

  const loadRuns = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("imf_pipeline_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10);
    setRuns((data as PipelineRun[]) || []);
  };

  const launchPipeline = async (pipeline: Pipeline) => {
    if (!user) return;
    const cost = costEstimates[pipeline.id] || 0;
    if (cost > 0 && balance < cost) {
      toast.error("Credite insuficiente", {
        description: `Necesar: ${cost} NEURONS. Balanța ta: ${balance}`,
      });
      return;
    }

    setLaunching(pipeline.id);
    try {
      const { data, error } = await supabase.functions.invoke("run-pipeline", {
        body: {
          pipeline_id: pipeline.id,
          neuron_id: neuronId,
          trigger_data: { episode_id: episodeId, neuron_id: neuronId },
        },
      });
      if (error) throw error;
      toast.success("Pipeline lansat!", { description: `${pipeline.name} — ${(data as any)?.total_steps || 0} pași` });
      loadRuns();
    } catch (e: any) {
      toast.error("Eroare la lansare", { description: e.message });
    } finally {
      setLaunching(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Available Pipelines */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <Zap className="h-3 w-3" /> Pipeline-uri IMF disponibile
        </h3>

        {pipelines.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg">
            Niciun pipeline activ. Configurează pipeline-uri din Admin Dashboard.
          </div>
        ) : (
          <div className="space-y-2">
            {pipelines.map(pipeline => {
              const steps = Array.isArray(pipeline.steps) ? pipeline.steps : [];
              const cost = costEstimates[pipeline.id] || 0;
              const isExpanded = expanded === pipeline.id;
              const isLaunching = launching === pipeline.id;
              const canAfford = balance >= cost;

              return (
                <div key={pipeline.id} className="border border-border rounded-lg bg-card overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pipeline.name}</p>
                      <p className="text-micro text-muted-foreground truncate">
                        {steps.length} pași · {pipeline.trigger_event}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {cost > 0 && (
                        <Badge variant="outline" className={cn(
                          "text-micro",
                          !canAfford && "border-destructive text-destructive"
                        )}>
                          <Coins className="h-2.5 w-2.5 mr-0.5" /> {cost}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => launchPipeline(pipeline)}
                        disabled={isLaunching || !canAfford}
                        className="h-7 text-xs gap-1"
                      >
                        {isLaunching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        Lansează
                      </Button>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : pipeline.id)}
                        className="text-muted-foreground hover:text-foreground p-1"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-border pt-2">
                      {pipeline.description && (
                        <p className="text-xs text-muted-foreground mb-2">{pipeline.description}</p>
                      )}
                      <div className="space-y-1">
                        {steps.map((step: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-dense">
                            <span className="text-muted-foreground/50 font-mono w-4">{i + 1}.</span>
                            <span className="text-foreground">{step.service_key || step.name}</span>
                            {step.credits_cost && (
                              <span className="text-muted-foreground">({step.credits_cost} cr)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active/Recent Runs */}
      {runs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
            <Clock className="h-3 w-3" /> Execuții recente
          </h3>
          <div className="space-y-2">
            {runs.slice(0, 5).map(run => {
              const progress = run.total_steps > 0
                ? Math.round((run.steps_completed / run.total_steps) * 100)
                : 0;
              const isActive = run.status === "running" || run.status === "pending";

              return (
                <div key={run.id} className="border border-border rounded-lg p-3 bg-card">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {run.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      {run.status === "failed" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                      <span className="text-xs font-medium">
                        {run.steps_completed}/{run.total_steps} pași
                      </span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-nano",
                      run.status === "completed" && "border-emerald-500/30 text-emerald-500",
                      run.status === "failed" && "border-destructive/30 text-destructive",
                      isActive && "border-primary/30 text-primary",
                    )}>
                      {run.status}
                    </Badge>
                  </div>
                  {isActive && <Progress value={progress} className="h-1.5" />}
                  {run.error_message && (
                    <p className="text-micro text-destructive mt-1 truncate">{run.error_message}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
