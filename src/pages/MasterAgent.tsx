import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Brain, Zap, Rocket, Package, TrendingUp, Store,
  Loader2, CheckCircle, XCircle, Sparkles, Target,
  Layers, ArrowRight, AlertTriangle, Shield, Cpu, 
  Database, BarChart3, Award, ChevronDown, Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  OrbitalRings, PipelineTimeline, StatCard, PIPELINE_STEPS,
  DEPTH_CONFIG, type ExecutionDepth,
  type AgentResult, type StepLog,
} from "@/components/agent/MasterAgentComponents";

type AgentStatus = "idle" | "running" | "completed" | "failed";

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
  const [showPipeline, setShowPipeline] = useState(false);

  const charCount = source.length;
  const isReady = charCount >= 50;

  const execute = async () => {
    if (!isReady) {
      toast.error("Conținutul sursă trebuie să aibă minim 50 caractere");
      return;
    }

    setStatus("running");
    setResult(null);
    setProgress(5);
    setCurrentStep("safety_guard");

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
      if (data.status === "INSUFFICIENT_BALANCE") {
        setStatus("failed");
        setResult(data);
        toast.error(`NEURONS insuficienți. Ai nevoie de ${data.estimated_cost}N, ai ${data.balance}N.`);
        return;
      }
      if (data.status === "BLOCKED") {
        setStatus("failed");
        setResult(data);
        toast.error(data.reason || "Execuție blocată de Safety Guard");
        return;
      }

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
    }
  };

  return (
    <PageTransition>
      <SEOHead title="Master Agent — AI-IDEI OS" description="Autonomous production engine for knowledge capitalization" />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ═══ HERO HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-micro font-mono font-bold text-primary uppercase tracking-widest">
            <Cpu className="h-3 w-3" />
            Autonomous Production Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Master Agent
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Transformă conținut brut în active economice. 
            10 pași autonomi. Un singur click.
          </p>
        </motion.div>

        {/* ═══ IDLE STATE ═══ */}
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Orbital visual */}
              <OrbitalRings />

              {/* Source input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-micro font-mono font-bold uppercase tracking-widest text-muted-foreground">
                    Conținut sursă
                  </label>
                  <span className={cn(
                    "text-micro font-mono transition-colors",
                    isReady ? "text-status-validated" : "text-muted-foreground"
                  )}>
                    {charCount} {!isReady && "/ 50 min"}
                  </span>
                </div>
                <div className="relative">
                  <Textarea
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    placeholder="Lipește transcriptul, articolul sau textul din care vrei să extragi valoare economică..."
                    rows={6}
                    className="text-sm bg-card resize-none rounded-2xl border-border/50 focus:border-primary/40 transition-colors"
                  />
                  {/* Progress bar at bottom of textarea */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/30 rounded-b-2xl overflow-hidden">
                    <motion.div
                      className="h-full bg-primary/60"
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.min((charCount / 50) * 100, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Goal input */}
              <div className="space-y-2">
                <label className="text-micro font-mono font-bold uppercase tracking-widest text-muted-foreground">
                  Obiectiv
                  <span className="text-muted-foreground/40 ml-2 normal-case tracking-normal">opțional</span>
                </label>
                <Input
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="ex: Generează funnel complet de marketing din acest podcast"
                  className="text-sm bg-card rounded-xl border-border/50"
                />
              </div>

              {/* Execution config — clean horizontal layout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(DEPTH_CONFIG).map(([key, cfg]) => {
                  const isSelected = depth === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setDepth(key as ExecutionDepth)}
                      className={cn(
                        "relative rounded-2xl border p-4 text-left transition-all duration-200",
                        isSelected
                          ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10"
                          : "border-border/50 bg-card hover:border-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-xs font-bold",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {cfg.label}
                        </span>
                        <span className={cn(
                          "text-nano font-mono font-bold px-2 py-0.5 rounded-full",
                          isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {cfg.badge}
                        </span>
                      </div>
                      <p className="text-micro text-muted-foreground leading-relaxed">{cfg.desc}</p>
                      <p className="text-micro font-mono text-muted-foreground/60 mt-1">{cfg.neurons}</p>
                    </button>
                  );
                })}
              </div>

              {/* Monetization toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-border/50 bg-card">
                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Monetizare automată</p>
                    <p className="text-micro text-muted-foreground">Publică drafturi în marketplace</p>
                  </div>
                </div>
                <Button
                  variant={monetize ? "default" : "outline"}
                  size="sm"
                  className="text-micro h-7 px-3 rounded-full"
                  onClick={() => setMonetize(!monetize)}
                >
                  {monetize ? "Activă" : "Dezactivată"}
                </Button>
              </div>

              {/* Launch CTA */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={execute}
                  disabled={!isReady}
                  className={cn(
                    "w-full h-14 text-sm font-bold gap-3 rounded-2xl transition-all duration-300",
                    isReady 
                      ? "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" 
                      : ""
                  )}
                >
                  <Play className="h-5 w-5" />
                  Lansează Master Agent
                  <span className="text-micro font-mono font-normal opacity-70">
                    {DEPTH_CONFIG[depth].neurons}
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ═══ RUNNING STATE ═══ */}
          {status === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Progress bar — full width, cinematic */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-micro font-mono font-bold uppercase tracking-widest text-primary">
                    Processing
                  </span>
                  <span className="text-micro font-mono text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-primary to-ai-accent rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Pipeline visualization */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <PipelineTimeline currentStep={currentStep} />
              </div>

              {/* Live status */}
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {PIPELINE_STEPS.find(s => s.key === currentStep)?.label || "Processing..."}
                </span>
              </div>
            </motion.div>
          )}

          {/* ═══ COMPLETED STATE ═══ */}
          {status === "completed" && result?.summary && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Success badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-status-validated/30 bg-status-validated/5">
                  <CheckCircle className="h-4 w-4 text-status-validated" />
                  <span className="text-xs font-bold text-status-validated uppercase tracking-wider">
                    Producție finalizată
                  </span>
                </div>
              </motion.div>

              {/* Summary stats — 4 cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Neuroni extrași" value={result.summary.neurons_extracted} icon={Brain} delay={0.05} />
                <StatCard label="Servicii executate" value={result.summary.services_executed} icon={Zap} delay={0.1} />
                <StatCard label="Assets generate" value={result.summary.assets_generated} icon={Package} delay={0.15} />
                <StatCard label="Marketplace drafts" value={result.summary.marketplace_drafts} icon={Store} delay={0.2} />
              </div>

              {/* Kernel strip */}
              {result.kernel && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-border bg-card/50 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-ai-accent/10 flex items-center justify-center">
                      <Cpu className="h-3 w-3 text-ai-accent" />
                    </div>
                    <span className="text-nano font-mono font-bold uppercase tracking-widest text-muted-foreground">
                      Kernel Report
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                    {[
                      { label: "Tier", value: result.kernel.tier },
                      { label: "Strategy", value: result.kernel.strategy },
                      { label: "Cost", value: `${result.kernel.cost_charged?.toLocaleString()}N` },
                      { label: "Discount", value: `${result.kernel.tier_discount_pct}%` },
                      { label: "Memory", value: `${result.kernel.memory_runs} runs` },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-nano text-muted-foreground/60 uppercase tracking-wider mb-0.5">{item.label}</p>
                        <p className="font-mono font-semibold text-foreground capitalize">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Pipeline execution log — collapsible */}
              {result.steps && (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setShowPipeline(!showPipeline)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-micro font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Layers className="h-3 w-3" />
                      Pipeline Log — {result.steps.length} steps
                    </span>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform",
                      showPipeline && "rotate-180"
                    )} />
                  </button>
                  <AnimatePresence>
                    {showPipeline && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="p-4 space-y-1">
                          {result.steps.map((step, i) => {
                            const d = (step as any).data || step;
                            const statusStr = step.status;
                            const isPassed = ["completed", "passed", "resolved", "approved", "settled", "reserved", "loaded", "plan_ready"].includes(statusStr);
                            const isWarn = statusStr === "warning";
                            const stepMeta = PIPELINE_STEPS.find(s => s.key === step.step);
                            
                            return (
                              <div key={i} className="flex items-center gap-3 py-1.5 text-xs">
                                {isPassed ? (
                                  <CheckCircle className="h-3 w-3 text-status-validated shrink-0" />
                                ) : isWarn ? (
                                  <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                                )}
                                <span className="text-muted-foreground w-24 shrink-0 font-mono text-micro">
                                  {stepMeta?.label || step.step}
                                </span>
                                <span className="text-foreground/70 text-micro truncate">
                                  {d.count !== undefined && `${d.count} items`}
                                  {d.outputs !== undefined && ` ${d.outputs} outputs`}
                                  {d.items !== undefined && ` ${d.items} items`}
                                  {d.qualified !== undefined && ` ${d.qualified}/${d.total} qualified`}
                                  {d.ranked !== undefined && ` ${d.ranked} ranked`}
                                  {d.steps !== undefined && ` ${d.steps} steps`}
                                  {d.tier !== undefined && ` tier: ${d.tier}`}
                                  {d.cost !== undefined && ` ${d.cost}N`}
                                  {d.amount !== undefined && ` ${d.amount}N`}
                                  {d.strategy !== undefined && ` ${d.strategy}`}
                                  {d.reason !== undefined && ` ${d.reason}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Top Ranked */}
              {result.ranking && result.ranking.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span className="text-micro font-mono font-bold uppercase tracking-widest text-muted-foreground">
                      Top Ranked
                    </span>
                  </div>
                  <div className="space-y-2">
                    {result.ranking.slice(0, 5).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-1">
                        <span className="text-lg font-bold font-mono text-muted-foreground/30 w-8">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Badge variant="outline" className="text-nano shrink-0">{item.type}</Badge>
                        <span className="text-xs font-medium truncate flex-1">{item.title}</span>
                        <span className="text-xs font-mono font-bold text-primary">
                          {(item.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Assets Generated */}
              {result.assets && result.assets.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span className="text-micro font-mono font-bold uppercase tracking-widest text-muted-foreground">
                      Assets Generate
                    </span>
                    <span className="text-micro font-mono text-muted-foreground/50 ml-auto">
                      {result.assets.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.assets.map((asset: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <Badge variant="outline" className="text-nano shrink-0">{asset.type}</Badge>
                        <span className="text-xs truncate flex-1">{asset.title}</span>
                        {asset.price_usd && (
                          <span className="text-micro font-mono font-bold text-primary">${asset.price_usd}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* New Services */}
              {result.new_services && result.new_services.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-ai-accent" />
                    <span className="text-micro font-mono font-bold uppercase tracking-widest text-muted-foreground">
                      Servicii Auto-Generate
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {result.new_services.map((svc: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30">
                        <Badge variant="outline" className="text-nano">{svc.class}</Badge>
                        <span className="text-xs font-medium truncate flex-1">{svc.name}</span>
                        <span className="text-micro font-mono text-muted-foreground">{svc.credits_cost}N</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-nano text-muted-foreground/50 mt-3 text-center">
                    Serviciile noi necesită aprobare admin
                  </p>
                </motion.div>
              )}

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-xs rounded-xl h-10"
                  onClick={() => navigate("/marketplace/drafts")}
                >
                  <Store className="h-3.5 w-3.5" />
                  Marketplace Drafts
                </Button>
                {result.job_id && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 text-xs rounded-xl h-10"
                    onClick={() => navigate(`/jobs/${result.job_id}`)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Detalii Job
                  </Button>
                )}
                <Button
                  className="flex-1 gap-2 text-xs rounded-xl h-10"
                  onClick={() => { setStatus("idle"); setResult(null); setProgress(0); setShowPipeline(false); }}
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Execuție Nouă
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ FAILED STATE ═══ */}
          {status === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4"
            >
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-bold text-destructive">Execuție eșuată</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {result?.reason || "A apărut o eroare. Verifică inputul și încearcă din nou."}
                </p>
              </div>
              {result?.estimated_cost && result?.balance !== undefined && (
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-border text-xs">
                  <span className="text-muted-foreground">Necesar: <span className="font-mono font-bold text-foreground">{result.estimated_cost}N</span></span>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="text-muted-foreground">Balanță: <span className="font-mono font-bold text-destructive">{result.balance}N</span></span>
                </div>
              )}
              <Button
                variant="outline"
                className="text-xs rounded-xl h-10 gap-2"
                onClick={() => { setStatus("idle"); setResult(null); setProgress(0); }}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Încearcă din nou
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
