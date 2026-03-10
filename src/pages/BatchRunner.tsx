import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Sparkles, Play, CheckCircle2, XCircle,
  Clock, Coins, Brain, ArrowLeft, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  service_key: string;
  name: string;
  credits_cost: number;
  category: string;
  service_class: string;
}

interface BatchJob {
  serviceKey: string;
  serviceName: string;
  cost: number;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
}

export default function BatchRunner() {
  const { neuronId } = useParams<{ neuronId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [neuronTitle, setNeuronTitle] = useState("");
  const [neuronContent, setNeuronContent] = useState("");
  const [balance, setBalance] = useState(0);
  const [running, setRunning] = useState(false);
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [user, authLoading, neuronId]);

  const loadData = async () => {
    const [servicesRes, neuronRes, creditsRes] = await Promise.all([
      supabase.from("service_catalog").select("*").eq("is_active", true).order("credits_cost"),
      supabase.from("neurons").select("id, title").eq("id", Number(neuronId)).eq("author_id", user!.id).single(),
      supabase.from("user_credits").select("balance").eq("user_id", user!.id).maybeSingle(),
    ]);

    if (servicesRes.data) setServices(servicesRes.data as Service[]);
    if (neuronRes.data) {
      setNeuronTitle(neuronRes.data.title);
      // Get neuron blocks content
      const { data: blocks } = await supabase
        .from("neuron_blocks")
        .select("content")
        .eq("neuron_id", Number(neuronId))
        .order("position");
      setNeuronContent(blocks?.map(b => b.content).join("\n\n") || "");
    }
    setBalance(creditsRes.data?.balance ?? 0);
    setLoading(false);
  };

  const toggleService = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === services.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(services.map(s => s.service_key)));
    }
  };

  const totalCost = services.filter(s => selected.has(s.service_key)).reduce((sum, s) => sum + s.credits_cost, 0);
  const canAfford = balance >= totalCost;

  const runBatch = async () => {
    if (!user || selected.size === 0 || !canAfford) return;
    setRunning(true);

    const batchJobs: BatchJob[] = services
      .filter(s => selected.has(s.service_key))
      .map(s => ({
        serviceKey: s.service_key,
        serviceName: s.name,
        cost: s.credits_cost,
        status: "pending" as const,
      }));
    setJobs(batchJobs);

    for (let i = 0; i < batchJobs.length; i++) {
      setCurrentIndex(i);
      setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "running" } : j));

      try {
        // Create job
        const { data: job } = await supabase
          .from("neuron_jobs")
          .insert({
            neuron_id: Number(neuronId),
            worker_type: batchJobs[i].serviceKey,
            status: "pending",
            author_id: user.id,
            input: { content: neuronContent, title: neuronTitle },
          })
          .select("id")
          .single();

        if (!job) throw new Error("Failed to create job");

        // Run service
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-service`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              job_id: job.id,
              service_key: batchJobs[i].serviceKey,
              neuron_id: Number(neuronId),
              user_id: user.id,
              inputs: { content: neuronContent, title: neuronTitle },
            }),
          }
        );

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `Error ${resp.status}`);
        }

        // Consume streaming response
        const reader = resp.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let fullText = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
          }
        }

        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "completed" } : j));
      } catch (e: any) {
        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "failed", result: e.message } : j));
      }
    }

    setCurrentIndex(-1);
    setRunning(false);
    toast.success(`Batch complet: ${batchJobs.length} servicii executate!`);

    // Refresh balance
    const { data: newCredits } = await supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle();
    if (newCredits) setBalance(newCredits.balance);
  };

  const completedCount = jobs.filter(j => j.status === "completed").length;
  const failedCount = jobs.filter(j => j.status === "failed").length;
  const progress = jobs.length > 0 ? ((completedCount + failedCount) / jobs.length) * 100 : 0;

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Batch Execution</h1>
            <p className="text-xs text-muted-foreground">
              Neuron: <span className="font-medium text-foreground">{neuronTitle}</span>
            </p>
          </div>
        </div>

        {/* Balance + Cost */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border border-border bg-card">
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Balanță</span>
            <p className="text-xl font-bold font-mono">{balance} <span className="text-xs font-normal text-muted-foreground">NEURONS</span></p>
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost Total</span>
            <p className={cn("text-xl font-bold font-mono", canAfford ? "text-foreground" : "text-destructive")}>
              {totalCost} <span className="text-xs font-normal text-muted-foreground">NEURONS</span>
            </p>
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Selectate</span>
            <p className="text-xl font-bold font-mono">{selected.size} <span className="text-xs font-normal text-muted-foreground">/ {services.length}</span></p>
          </div>
        </div>

        {/* Progress (when running) */}
        {running && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Progres: {completedCount + failedCount} / {jobs.length}
              </span>
              <span className="text-xs font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Service Selection / Job Status */}
        {!running && jobs.length === 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selectează serviciile</h2>
              <button onClick={selectAll} className="text-[10px] text-primary hover:underline">
                {selected.size === services.length ? "Deselectează tot" : "Selectează tot"}
              </button>
            </div>
            <div className="space-y-1.5 mb-6">
              {services.map(s => (
                <button
                  key={s.service_key}
                  onClick={() => toggleService(s.service_key)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    selected.has(s.service_key)
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:border-primary/20"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                    selected.has(s.service_key) ? "border-primary bg-primary" : "border-muted-foreground/30"
                  )}>
                    {selected.has(s.service_key) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-[9px] text-muted-foreground/50 ml-2 uppercase">{s.category}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5">
                    <Coins className="h-2.5 w-2.5" /> {s.credits_cost}
                  </span>
                </button>
              ))}
            </div>

            <Button
              onClick={runBatch}
              disabled={selected.size === 0 || !canAfford}
              className="w-full gap-2"
              size="lg"
            >
              <Zap className="h-4 w-4" />
              Execută {selected.size} servicii ({totalCost} NEURONS)
            </Button>
            {!canAfford && selected.size > 0 && (
              <p className="text-xs text-destructive text-center mt-2">
                Credite insuficiente. Ai nevoie de {totalCost - balance} NEURONS în plus.
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Status execuție</h2>
            <div className="space-y-1.5 mb-6">
              {jobs.map((job, i) => (
                <div
                  key={job.serviceKey}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    job.status === "running" ? "border-primary/40 bg-primary/5" :
                    job.status === "completed" ? "border-status-validated/30 bg-status-validated/5" :
                    job.status === "failed" ? "border-destructive/30 bg-destructive/5" :
                    "border-border bg-card"
                  )}
                >
                  {job.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                  {job.status === "running" && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
                  {job.status === "completed" && <CheckCircle2 className="h-4 w-4 text-status-validated shrink-0" />}
                  {job.status === "failed" && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                  <span className="text-sm flex-1">{job.serviceName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{job.cost} N</span>
                </div>
              ))}
            </div>

            {!running && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/library`)}>
                  Vezi Biblioteca
                </Button>
                <Button className="flex-1" onClick={() => { setJobs([]); setSelected(new Set()); }}>
                  Rulează din nou
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
