import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Sparkles, Play, CheckCircle2, XCircle,
  Clock, Coins, Brain, ArrowLeft, Zap, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { useTranslation } from "react-i18next";
import { ServicePresets } from "@/components/services/ServicePresets";
import { ServiceRunHistory } from "@/components/services/ServiceRunHistory";
import { logServiceRun } from "@/hooks/useServiceHistory";

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
  const { t } = useTranslation("pages");
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
    const batchId = crypto.randomUUID();

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
      const startTime = Date.now();

      try {
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
              inputs: { content: neuronContent, title: neuronTitle },
            }),
          }
        );

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `Error ${resp.status}`);
        }

        let fullText = "";
        const reader = resp.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
          }
        }

        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "completed" } : j));

        // Log to history
        logServiceRun({
          userId: user.id,
          serviceKey: batchJobs[i].serviceKey,
          serviceName: batchJobs[i].serviceName,
          neuronId: Number(neuronId),
          jobId: job.id,
          creditsCost: batchJobs[i].cost,
          status: "completed",
          resultPreview: fullText,
          durationMs: Date.now() - startTime,
          inputs: { content: neuronContent.slice(0, 200), title: neuronTitle },
          batchId,
        });
      } catch (e: any) {
        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "failed", result: e.message } : j));

        logServiceRun({
          userId: user.id,
          serviceKey: batchJobs[i].serviceKey,
          serviceName: batchJobs[i].serviceName,
          neuronId: Number(neuronId),
          creditsCost: batchJobs[i].cost,
          status: "failed",
          resultPreview: e.message,
          durationMs: Date.now() - startTime,
          batchId,
        });
      }
    }

    setCurrentIndex(-1);
    setRunning(false);
    toast.success(t("batch_runner.batch_complete", { count: batchJobs.length }));

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
    <PremiumGate requiredTier="pro" featureName="Batch Runner" fallback="replace">
    <div className="flex-1 overflow-auto">
      <SEOHead title="Batch Runner — AI-IDEI" description="Run multiple AI services in batch on your neurons and content." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{t("batch_runner.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("batch_runner.neuron_label")} <span className="font-medium text-foreground">{neuronTitle}</span>
            </p>
          </div>
        </div>

        {/* Balance + Cost */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border border-border bg-card">
          <div className="flex-1">
            <span className="text-micro uppercase tracking-wider text-muted-foreground">{t("batch_runner.balance")}</span>
            <p className="text-xl font-bold font-mono">{balance} <span className="text-xs font-normal text-muted-foreground">NEURONS</span></p>
          </div>
          <div className="flex-1">
            <span className="text-micro uppercase tracking-wider text-muted-foreground">{t("batch_runner.total_cost")}</span>
            <p className={cn("text-xl font-bold font-mono", canAfford ? "text-foreground" : "text-destructive")}>
              {totalCost} <span className="text-xs font-normal text-muted-foreground">NEURONS</span>
            </p>
          </div>
          <div className="flex-1">
            <span className="text-micro uppercase tracking-wider text-muted-foreground">{t("batch_runner.selected")}</span>
            <p className="text-xl font-bold font-mono">{selected.size} <span className="text-xs font-normal text-muted-foreground">/ {services.length}</span></p>
          </div>
        </div>

        {/* Progress (when running) */}
        {running && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                {t("batch_runner.progress", { done: completedCount + failedCount, total: jobs.length })}
              </span>
              <span className="text-xs font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Service Selection / Job Status */}
        {!running && jobs.length === 0 ? (
          <>
            {/* Presets */}
            <div className="mb-6 border border-border rounded-xl p-4 bg-card">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                ⚡ Preseturi
              </h2>
              <ServicePresets
                allServiceKeys={services.map(s => s.service_key)}
                selectedKeys={selected}
                onApplyPreset={(keys) => setSelected(new Set(keys))}
              />
            </div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("batch_runner.select_services")}</h2>
              <button onClick={selectAll} className="text-micro text-primary hover:underline">
                {selected.size === services.length ? t("batch_runner.deselect_all") : t("batch_runner.select_all")}
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
                    <span className="text-nano text-muted-foreground/50 ml-2 uppercase">{s.category}</span>
                  </div>
                  <span className="text-micro font-mono text-muted-foreground flex items-center gap-0.5">
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
              {t("batch_runner.execute_button", { count: selected.size, cost: totalCost })}
            </Button>
            {!canAfford && selected.size > 0 && (
              <div className="mt-3">
                <InlineTopUp needed={totalCost} balance={balance} compact />
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("batch_runner.execution_status")}</h2>
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
                  <span className="text-micro font-mono text-muted-foreground">{job.cost} N</span>
                </div>
              ))}
            </div>

            {!running && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/library`)}>
                  {t("batch_runner.view_library")}
                </Button>
                <Button className="flex-1" onClick={() => { setJobs([]); setSelected(new Set()); }}>
                  {t("batch_runner.run_again")}
                </Button>
              </div>
            )}
          </>
        )}

        {/* History */}
        <div className="mt-8 border-t border-border pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <History className="h-3 w-3" /> Istoric batch-uri
          </h2>
          <ServiceRunHistory limit={15} />
        </div>
      </div>
    </div>
    </PremiumGate>
  );
}
