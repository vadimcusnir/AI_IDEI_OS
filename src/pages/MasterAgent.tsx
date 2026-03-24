import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Brain, Zap, Rocket, Package, TrendingUp, Store,
  Loader2, CheckCircle, XCircle, Sparkles, Target,
  Layers, ArrowRight, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ExecutionDepth = "quick" | "standard" | "full";
type AgentStatus = "idle" | "running" | "completed" | "failed";

interface StepLog {
  step: string;
  status: string;
  timestamp: string;
  [key: string]: any;
}

interface AgentResult {
  status: string;
  reason?: string;
  job_id?: string;
  kernel?: {
    tier: string;
    strategy: string;
    cost_charged: number;
    tier_discount_pct: number;
    safety: string;
    memory_runs: number;
    state_flow: string[];
  };
  summary?: {
    neurons_extracted: number;
    clusters_formed: number;
    services_matched: number;
    services_executed: number;
    services_failed?: number;
    assets_generated: number;
    assets_rejected?: number;
    marketplace_drafts: number;
    new_services_created: number;
    top_ranked: any[];
  };
  estimated_cost?: number;
  balance?: number;
  deficit?: number;
  tier_discount_pct?: number;
  neurons?: any[];
  clusters?: any[];
  selected_services?: any[];
  assets?: any[];
  marketplace_items?: any[];
  new_services?: any[];
  ranking?: any[];
  scored_assets?: any[];
  steps?: StepLog[];
}

const STEP_LABELS: Record<string, { label: string; icon: typeof Brain }> = {
  safety_guard: { label: "Safety Guard", icon: AlertTriangle },
  tier_resolution: { label: "Tier Check", icon: Target },
  memory_load: { label: "Memory Load", icon: Brain },
  planner: { label: "Planner", icon: Layers },
  economy_controller: { label: "Economy Gate", icon: Zap },
  reserve_neurons: { label: "Reserve NEURONS", icon: Zap },
  neuron_extraction: { label: "Extragere Neuroni", icon: Brain },
  pattern_synthesis: { label: "Sinteză Patternuri", icon: Layers },
  service_matching: { label: "Potrivire Servicii", icon: Target },
  service_composition: { label: "Compoziție Pipeline", icon: Zap },
  execution: { label: "Execuție Servicii", icon: Rocket },
  asset_generation: { label: "Generare Assets", icon: Package },
  quality_scoring: { label: "Scoring Calitate", icon: TrendingUp },
  marketplace_packaging: { label: "Packaging Marketplace", icon: Store },
  auto_service_generation: { label: "Auto-Generare Servicii", icon: Sparkles },
  idea_rank_scoring: { label: "IdeaRank Scoring", icon: TrendingUp },
  settle_neurons: { label: "Settle NEURONS", icon: Zap },
};

const DEPTH_CONFIG: Record<ExecutionDepth, { label: string; desc: string; neurons: string }> = {
  quick: { label: "Quick", desc: "~15 neuroni, 3 servicii, ~1 min", neurons: "~15" },
  standard: { label: "Standard", desc: "~25 neuroni, 5 servicii, ~3 min", neurons: "~25" },
  full: { label: "Full", desc: "~40 neuroni, 8 servicii, ~5 min", neurons: "~40" },
};

export default function MasterAgent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [source, setSource] = useState("");
  const [goal, setGoal] = useState("");
  const [depth, setDepth] = useState<ExecutionDepth>("standard");
  const [monetize, setMonetize] = useState(true);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState(0);

  const execute = async () => {
    if (!source.trim() || source.trim().length < 50) {
      toast.error("Conținutul sursă trebuie să aibă minim 50 caractere");
      return;
    }

    setStatus("running");
    setResult(null);
    setProgress(5);
    setCurrentStep("neuron_extraction");

    // Simulate progress while waiting
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 90));
    }, 3000);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/master-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            source_content: source,
            user_goal: goal,
            monetization_mode: monetize,
            execution_depth: depth,
          }),
        }
      );

      clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data: AgentResult = await res.json();

      if (data.status === "NO_DATA_AVAILABLE") {
        setStatus("failed");
        setResult(data);
        toast.error(data.reason || "Date insuficiente pentru procesare");
        return;
      }

      // Update step progress from result
      if (data.steps) {
        const lastStep = data.steps[data.steps.length - 1];
        setCurrentStep(lastStep?.step || "completed");
      }

      setProgress(100);
      setStatus("completed");
      setResult(data);
      toast.success(`Agent finalizat! ${data.summary?.assets_generated || 0} assets generate`);
    } catch (err: any) {
      clearInterval(progressInterval);
      setStatus("failed");
      toast.error(err.message || "Eroare la execuție");
      console.error("Master agent error:", err);
    }
  };

  return (
    <PageTransition>
      <SEOHead title="Master Agent — AI-IDEI OS" description="Autonomous production engine for knowledge capitalization" />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Master Agent</h1>
            <p className="text-xs text-muted-foreground">Motor autonom de producție, execuție și monetizare</p>
          </div>
        </div>

        {/* Input Section */}
        {status === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conținut sursă *
              </label>
              <Textarea
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Lipește transcriptul, articolul sau textul din care vrei să extragi valoare economică..."
                rows={8}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                {source.length} caractere {source.length < 50 && "· minim 50 caractere"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Obiectiv (opțional)
              </label>
              <Input
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="ex: Generează funnel complet de marketing din acest podcast"
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Profunzime execuție
                </label>
                <Select value={depth} onValueChange={v => setDepth(v as ExecutionDepth)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEPTH_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        <span className="font-medium">{cfg.label}</span>
                        <span className="text-muted-foreground ml-2">{cfg.desc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monetizare auto
                </label>
                <Button
                  variant={monetize ? "default" : "outline"}
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setMonetize(!monetize)}
                >
                  <Store className="h-3.5 w-3.5 mr-1.5" />
                  {monetize ? "Activă — Publică drafturi" : "Dezactivată"}
                </Button>
              </div>
            </div>

            <Button
              onClick={execute}
              disabled={source.trim().length < 50}
              className="w-full h-12 text-sm font-semibold gap-2"
            >
              <Rocket className="h-4 w-4" />
              Lansează Master Agent
              <Badge variant="secondary" className="text-[9px] ml-2">10 pași autonomi</Badge>
            </Button>
          </motion.div>
        )}

        {/* Running State */}
        {status === "running" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-semibold">Agent în execuție...</p>
                  <p className="text-[10px] text-muted-foreground">
                    {STEP_LABELS[currentStep]?.label || currentStep}
                  </p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />

              <div className="grid grid-cols-5 gap-1">
                {Object.entries(STEP_LABELS).map(([key, cfg], i) => {
                  const stepIndex = Object.keys(STEP_LABELS).indexOf(currentStep);
                  const thisIndex = i;
                  const isDone = thisIndex < stepIndex;
                  const isCurrent = key === currentStep;

                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex flex-col items-center gap-1 p-1.5 rounded-lg text-center",
                        isDone && "bg-primary/5",
                        isCurrent && "bg-primary/10 ring-1 ring-primary/30",
                      )}
                    >
                      <cfg.icon className={cn(
                        "h-3 w-3",
                        isDone ? "text-primary" : isCurrent ? "text-primary animate-pulse" : "text-muted-foreground/30"
                      )} />
                      <span className={cn(
                        "text-[7px] leading-tight",
                        isDone || isCurrent ? "text-foreground" : "text-muted-foreground/40"
                      )}>
                        {cfg.label.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {status === "completed" && result?.summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Neuroni", value: result.summary.neurons_extracted, icon: Brain, color: "text-primary" },
                { label: "Servicii", value: result.summary.services_executed, icon: Zap, color: "text-primary" },
                { label: "Assets", value: result.summary.assets_generated, icon: Package, color: "text-primary" },
                { label: "Marketplace", value: result.summary.marketplace_drafts, icon: Store, color: "text-primary" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-3"
                >
                  <stat.icon className={cn("h-4 w-4 mb-1", stat.color)} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Pipeline Steps */}
            {result.steps && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pipeline Execuție</p>
                <div className="space-y-1.5">
                  {result.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {step.status === "completed" ? (
                        <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                      ) : step.status === "warning" ? (
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive shrink-0" />
                      )}
                      <span className="text-muted-foreground w-28 shrink-0 font-mono text-[10px]">
                        {STEP_LABELS[step.step]?.label || step.step}
                      </span>
                      <span className="text-foreground text-[10px]">
                        {step.count !== undefined && `${step.count} items`}
                        {step.outputs !== undefined && `${step.outputs} outputs`}
                        {step.items !== undefined && `${step.items} items`}
                        {step.qualified !== undefined && `${step.qualified}/${step.total} qualified`}
                        {step.ranked !== undefined && `${step.ranked} ranked`}
                        {step.steps_count !== undefined && `${step.steps_count} steps`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Ranked */}
            {result.ranking && result.ranking.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Top Ranked
                </p>
                <div className="space-y-2">
                  {result.ranking.slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-5">#{i + 1}</span>
                      <Badge variant="outline" className="text-[8px]">{item.type}</Badge>
                      <span className="text-xs font-medium truncate flex-1">{item.title}</span>
                      <span className="text-[10px] font-mono text-primary">{(item.score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assets Generated */}
            {result.assets && result.assets.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  <Package className="h-3 w-3 inline mr-1" />
                  Assets Generate ({result.assets.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.assets.map((asset: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Badge variant="outline" className="text-[8px] shrink-0">{asset.type}</Badge>
                      <span className="text-xs truncate flex-1">{asset.title}</span>
                      {asset.price_usd && (
                        <span className="text-[10px] font-mono text-primary">${asset.price_usd}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Services */}
            {result.new_services && result.new_services.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  Servicii Noi Generate ({result.new_services.length})
                </p>
                {result.new_services.map((svc: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 mb-1.5">
                    <Badge variant="outline" className="text-[8px]">{svc.class}</Badge>
                    <span className="text-xs font-medium truncate flex-1">{svc.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{svc.credits_cost}N</span>
                  </div>
                ))}
                <p className="text-[9px] text-muted-foreground mt-2">* Serviciile noi sunt create ca draft — necesită aprobare admin</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/marketplace/drafts")}>
                <Store className="h-3.5 w-3.5" />
                Vezi Drafturi Marketplace
              </Button>
              {result.job_id && (
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate(`/jobs/${result.job_id}`)}>
                  <ArrowRight className="h-3.5 w-3.5" />
                  Detalii Job
                </Button>
              )}
              <Button size="sm" className="text-xs gap-1.5 ml-auto" onClick={() => { setStatus("idle"); setResult(null); setProgress(0); }}>
                <Rocket className="h-3.5 w-3.5" />
                Execuție Nouă
              </Button>
            </div>
          </motion.div>
        )}

        {/* Failed State */}
        {status === "failed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-center"
          >
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-destructive">Execuție eșuată</p>
            <p className="text-xs text-muted-foreground mt-1">
              {result?.reason || "A apărut o eroare. Încearcă din nou."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => { setStatus("idle"); setResult(null); setProgress(0); }}
            >
              Încearcă din nou
            </Button>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
