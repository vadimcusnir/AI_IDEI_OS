/**
 * PromptYamlGenerator — Admin tool to generate technical YAML execution specs
 * for services using Lovable AI (Gemini 2.5 Pro). Supports single-service
 * generation and a batch job that processes the entire active catalog.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Play, Pause, RefreshCw, FileCode2, CheckCircle2, AlertCircle, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobRow {
  id: string;
  status: "queued" | "running" | "paused" | "done" | "failed";
  total_services: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  model: string;
  started_at: string | null;
  completed_at: string | null;
  last_processed_service_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ServiceRow {
  service_key: string;
  name: string;
  category: string;
  prompt_status: string | null;
  prompt_id: string | null;
}

const PAGE_SIZE = 25;

export function PromptYamlGenerator() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [activeServices, setActiveServices] = useState(0);
  const [withPrompt, setWithPrompt] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);
  const [viewYaml, setViewYaml] = useState<{ key: string; yaml: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: jobsData }, { count: total }, { count: done }] = await Promise.all([
      supabase.from("prompt_generation_jobs").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("service_catalog").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("prompt_registry").select("id", { count: "exact", head: true })
        .eq("generation_status", "done").not("linked_service_key", "is", null),
    ]);
    setJobs((jobsData ?? []) as JobRow[]);
    setActiveServices(total ?? 0);
    setWithPrompt(done ?? 0);

    const from = page * PAGE_SIZE;
    let q = supabase.from("service_catalog")
      .select("service_key, name, category")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (search.trim()) q = q.or(`name.ilike.%${search}%,service_key.ilike.%${search}%`);
    const { data: svcRows } = await q;
    const keys = (svcRows ?? []).map(s => s.service_key);
    let promptMap = new Map<string, { id: string; status: string }>();
    if (keys.length) {
      const { data: prompts } = await supabase.from("prompt_registry")
        .select("id, linked_service_key, generation_status")
        .in("linked_service_key", keys);
      prompts?.forEach(p => {
        if (p.linked_service_key) promptMap.set(p.linked_service_key, { id: p.id, status: p.generation_status });
      });
    }
    setServices((svcRows ?? []).map(s => ({
      ...s,
      prompt_status: promptMap.get(s.service_key)?.status ?? null,
      prompt_id: promptMap.get(s.service_key)?.id ?? null,
    })));
    setLoading(false);
  }, [page, search]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { setPage(0); }, [search]);

  // Realtime: refresh on job update
  useEffect(() => {
    const ch = supabase.channel("prompt-gen-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "prompt_generation_jobs" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadAll]);

  const generateOne = async (service_key: string) => {
    setGeneratingKey(service_key);
    try {
      const { data, error } = await supabase.functions.invoke("generate-service-prompt", {
        body: { service_key, model: "google/gemini-2.5-pro" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Prompt generat (${(data as any)?.length ?? 0} chars)`);
      loadAll();
    } catch (e: any) {
      const msg = e?.message || "Generare eșuată";
      if (msg.includes("429") || msg.includes("RATE_LIMIT")) toast.error("Rate limit AI. Încearcă în câteva minute.");
      else if (msg.includes("402") || msg.includes("PAYMENT")) toast.error("Credite Lovable AI epuizate.");
      else toast.error(msg);
    } finally {
      setGeneratingKey(null);
    }
  };

  const startBatchJob = async () => {
    setCreatingJob(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: pending } = await supabase.from("service_catalog")
        .select("service_key", { count: "exact" }).eq("is_active", true);
      const total = pending?.length ?? 0;

      const { data: job, error } = await supabase.from("prompt_generation_jobs")
        .insert({
          status: "queued",
          total_services: total,
          model: "google/gemini-2.5-pro",
          schema_variant: "extended_cot",
          filter_scope: "all_active",
          created_by: user?.id,
        })
        .select().single();
      if (error) throw error;
      toast.success("Job creat. Pornesc primul batch...");

      // Trigger first batch immediately
      await supabase.functions.invoke("batch-generate-prompts", { body: { job_id: job.id, batch_size: 8 } });
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Nu s-a putut crea jobul");
    } finally {
      setCreatingJob(false);
    }
  };

  const controlJob = async (id: string, status: "running" | "paused") => {
    await supabase.from("prompt_generation_jobs").update({ status }).eq("id", id);
    if (status === "running") {
      await supabase.functions.invoke("batch-generate-prompts", { body: { job_id: id, batch_size: 8 } });
    }
    loadAll();
  };

  const triggerNextBatch = async (id: string) => {
    toast.info("Procesez următorul batch...");
    const { data, error } = await supabase.functions.invoke("batch-generate-prompts", { body: { job_id: id, batch_size: 8 } });
    if (error) toast.error(error.message);
    else toast.success(`Batch: ${(data as any)?.success ?? 0} reușite, ${(data as any)?.failed ?? 0} eșuate`);
    loadAll();
  };

  const openYaml = async (prompt_id: string, service_key: string) => {
    const { data } = await supabase.from("prompt_registry").select("yaml_spec, core_prompt").eq("id", prompt_id).maybeSingle();
    setViewYaml({ key: service_key, yaml: (data?.yaml_spec || data?.core_prompt || "(empty)") });
  };

  const coverage = activeServices > 0 ? Math.round((withPrompt / activeServices) * 100) : 0;
  const activeJob = jobs.find(j => j.status === "running" || j.status === "queued" || j.status === "paused");

  return (
    <div className="space-y-4">
      {/* Coverage Card */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">YAML Prompt Coverage</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={loadAll} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold">{activeServices}</div>
            <div className="text-micro text-muted-foreground">Servicii active</div>
          </div>
          <div>
            <div className="text-xl font-bold text-primary">{withPrompt}</div>
            <div className="text-micro text-muted-foreground">Cu YAML</div>
          </div>
          <div>
            <div className="text-xl font-bold">{coverage}%</div>
            <div className="text-micro text-muted-foreground">Acoperire</div>
          </div>
        </div>
        <Progress value={coverage} className="h-2" />
        <Button
          onClick={startBatchJob}
          disabled={creatingJob || !!activeJob}
          className="w-full h-9 text-xs gap-2"
        >
          {creatingJob ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {activeJob ? "Job activ deja — vezi mai jos" : "Pornește batch — generează tot catalogul"}
        </Button>
      </div>

      {/* Active Job */}
      {activeJob && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "text-nano",
                activeJob.status === "running" && "bg-primary/15 text-primary",
                activeJob.status === "paused" && "bg-warning/15 text-warning",
              )}>{activeJob.status.toUpperCase()}</Badge>
              <span className="text-xs font-mono text-muted-foreground">{activeJob.id.slice(0, 8)}</span>
            </div>
            <div className="flex gap-1">
              {activeJob.status === "paused" ? (
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => controlJob(activeJob.id, "running")}>
                  <Play className="h-3 w-3" /> Resume
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => controlJob(activeJob.id, "paused")}>
                  <Pause className="h-3 w-3" /> Pauză
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => triggerNextBatch(activeJob.id)}>
                <Play className="h-3 w-3" /> Next batch
              </Button>
            </div>
          </div>
          <Progress
            value={activeJob.total_services > 0 ? (activeJob.processed_count / activeJob.total_services) * 100 : 0}
            className="h-2"
          />
          <div className="flex justify-between text-micro text-muted-foreground">
            <span>{activeJob.processed_count} / {activeJob.total_services}</span>
            <span className="text-primary">✓ {activeJob.success_count}</span>
            <span className="text-destructive">✗ {activeJob.failed_count}</span>
          </div>
          {(activeJob.metadata as any)?.pause_reason && (
            <div className="flex items-center gap-1.5 text-micro text-warning">
              <AlertCircle className="h-3 w-3" /> Paused: {String((activeJob.metadata as any).pause_reason)}
            </div>
          )}
        </div>
      )}

      {/* Search + Per-service table */}
      <div className="space-y-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută serviciu..." className="h-7 text-xs pl-8" />
        </div>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {services.map(s => {
            const hasYaml = s.prompt_status === "done";
            const isGenerating = generatingKey === s.service_key || s.prompt_status === "generating";
            return (
              <div key={s.service_key} className="flex items-center gap-2 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{s.name}</div>
                  <div className="text-nano font-mono text-muted-foreground/60 truncate">{s.service_key}</div>
                </div>
                <Badge variant="outline" className="text-nano">{s.category}</Badge>
                {hasYaml && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                {s.prompt_status === "failed" && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 shrink-0"
                  onClick={() => hasYaml && s.prompt_id ? openYaml(s.prompt_id, s.service_key) : generateOne(s.service_key)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> :
                    hasYaml ? <FileCode2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  {isGenerating ? "..." : hasYaml ? "View" : "Generate"}
                </Button>
              </div>
            );
          })}
          {services.length === 0 && !loading && (
            <div className="text-center py-8 text-micro text-muted-foreground">No services found</div>
          )}
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-micro text-muted-foreground">Page {page + 1}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => p + 1)} disabled={services.length < PAGE_SIZE}>Next</Button>
          </div>
        </div>
      </div>

      {/* YAML Viewer Dialog */}
      <Dialog open={!!viewYaml} onOpenChange={(o) => !o && setViewYaml(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-mono">{viewYaml?.key}</DialogTitle>
          </DialogHeader>
          <pre className="text-micro font-mono bg-muted/30 p-3 rounded-lg overflow-auto flex-1 whitespace-pre-wrap break-words">
            {viewYaml?.yaml}
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => {
              if (viewYaml) {
                navigator.clipboard.writeText(viewYaml.yaml);
                toast.success("Copiat în clipboard");
              }
            }}
          >
            Copy YAML
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
