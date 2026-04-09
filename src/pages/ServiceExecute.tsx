/**
 * ServiceExecute — Full execution page for a service.
 * Flow: Input → Economic Confirmation → AI Execution → Deliverable Display
 */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useServiceBySlug } from "@/hooks/useServiceCatalog";
import { useServicePurchase } from "@/hooks/useServicePurchase";
import { useEconomicGate } from "@/hooks/useEconomicGate";
import { useAuth } from "@/contexts/AuthContext";
import { EconomicGate } from "@/components/command-center/EconomicGate";
import { PostExecutionUpsell } from "@/components/services/PostExecutionUpsell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Zap, Layers, Server, Loader2, CheckCircle2, AlertCircle,
  Coins, Clock, ArrowRight, Copy, Download, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { ServiceLevel } from "@/types/services";

const LEVEL_CONFIG = {
  L3: { label: "Quick", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  L2: { label: "Pack", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
  L1: { label: "Master", icon: Server, color: "text-purple-500", bg: "bg-purple-500/10" },
} as const;

type Phase = "input" | "confirm" | "running" | "done" | "error";

export default function ServiceExecute() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const l3 = useServiceBySlug("L3", slug || "");
  const l2 = useServiceBySlug("L2", slug || "");
  const l1 = useServiceBySlug("L1", slug || "");
  const service = l3.data || l2.data || l1.data;
  const isLoading = l3.isLoading || l2.isLoading || l1.isLoading;

  const { purchase, loading: purchasing, result } = useServicePurchase();
  const gate = useEconomicGate();

  const [phase, setPhase] = useState<Phase>("input");
  const [userInput, setUserInput] = useState("");
  const [progress, setProgress] = useState(0);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Serviciul nu a fost găsit.</p>
        <Button variant="outline" onClick={() => navigate("/services-catalog")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Catalog
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Trebuie să fii autentificat.</p>
        <Button onClick={() => navigate("/auth")}>Autentificare</Button>
      </div>
    );
  }

  const level = service.level as ServiceLevel;
  const cfg = LEVEL_CONFIG[level];
  const Icon = cfg.icon;
  const creditCost = service.internal_credit_cost;

  const handleSubmit = () => {
    if (!userInput.trim()) { toast.error("Introdu date pentru analiză"); return; }
    if (gate.shouldSkipGate(creditCost)) {
      runExecution();
    } else {
      setPhase("confirm");
    }
  };

  const runExecution = async () => {
    setPhase("running");
    setProgress(10);
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 1500);

    const res = await purchase({
      service_slug: slug!,
      service_level: level,
      user_input: userInput,
    });

    clearInterval(interval);
    setProgress(100);

    if (res.success) {
      setPhase("done");
    } else {
      setPhase("error");
    }
  };

  const copyContent = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      toast.success("Copiat în clipboard");
    }
  };

  const downloadContent = () => {
    if (result?.content) {
      const blob = new Blob([result.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-deliverable.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const reset = () => {
    setPhase("input");
    setUserInput("");
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <Button variant="ghost" size="sm" className="mb-6 text-xs gap-1" onClick={() => navigate(`/services/${slug}`)}>
          <ArrowLeft className="h-3.5 w-3.5" /> Detalii serviciu
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
            <Icon className={cn("h-5 w-5", cfg.color)} />
          </div>
          <div>
            <Badge variant="outline" className={cn("text-nano mb-0.5", cfg.color)}>{cfg.label}</Badge>
            <h1 className="text-lg font-bold">{service.service_name}</h1>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {["Input", "Confirmare", "Execuție", "Rezultat"].map((step, i) => {
            const phaseIndex = { input: 0, confirm: 1, running: 2, done: 3, error: 2 }[phase];
            const isActive = i === phaseIndex;
            const isDone = i < phaseIndex;
            return (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-nano font-bold shrink-0 transition-colors",
                  isDone ? "bg-primary text-primary-foreground" :
                  isActive ? "bg-primary/20 text-primary border border-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("text-nano hidden sm:block", isActive ? "text-foreground font-medium" : "text-muted-foreground")}>{step}</span>
                {i < 3 && <div className="flex-1 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* PHASE: INPUT */}
          {phase === "input" && (
            <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="bg-card border border-border rounded-xl p-5 mb-4">
                <label className="text-sm font-medium mb-2 block">Descrie ce vrei să obții</label>
                <Textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Ex: Analizează piața de SaaS din Europa de Est, identifică competitorii principali și oportunități de diferențiere..."
                  className="min-h-[150px] text-sm"
                />
                <p className="text-micro text-muted-foreground mt-2">
                  Cu cât dai mai multe detalii, cu atât rezultatul va fi mai precis.
                </p>
              </div>

              <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> {creditCost}N</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~{Math.ceil(service.estimated_delivery_seconds / 60)} min</span>
                </div>
                {!gate.canAfford(creditCost) && (
                  <span className="text-xs text-destructive font-medium">Fonduri insuficiente</span>
                )}
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleSubmit}
                disabled={!userInput.trim() || !gate.canAfford(creditCost)}
              >
                Continuă <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* PHASE: CONFIRM */}
          {phase === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <EconomicGate
                balance={gate.balance}
                estimatedCost={creditCost}
                tierDiscount={gate.tierDiscount}
                tier={gate.tier}
                onProceed={runExecution}
                onCancel={() => setPhase("input")}
              />
            </motion.div>
          )}

          {/* PHASE: RUNNING */}
          {phase === "running" && (
            <motion.div key="running" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Generare în curs...</h3>
              <p className="text-sm text-muted-foreground mb-6">
                AI-ul procesează cererea ta. Acest lucru poate dura ~{Math.ceil(service.estimated_delivery_seconds / 60)} minute.
              </p>
              <Progress value={progress} className="max-w-xs mx-auto h-2" />
              <p className="text-micro text-muted-foreground mt-2">{Math.round(progress)}%</p>
            </motion.div>
          )}

          {/* PHASE: DONE */}
          {phase === "done" && result?.content && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Success banner */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Livrabil generat cu succes!</p>
                  <p className="text-xs text-muted-foreground">{result.credits_spent}N consumați</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={copyContent}>
                  <Copy className="h-3.5 w-3.5" /> Copiază
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadContent}>
                  <Download className="h-3.5 w-3.5" /> Descarcă .md
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" /> Execută din nou
                </Button>
              </div>

              {/* Deliverable content */}
              <div className="bg-card border border-border rounded-xl p-6 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{result.content}</ReactMarkdown>
              </div>

              {/* Upsell */}
              <PostExecutionUpsell
                completedServiceSlug={slug}
                completedCategory={service.category}
                className="mt-6"
              />
            </motion.div>
          )}

          {/* PHASE: ERROR */}
          {phase === "error" && (
            <motion.div key="error" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="text-center py-12">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Eroare la execuție</h3>
              <p className="text-sm text-muted-foreground mb-6">{result?.error || "A apărut o eroare neașteptată."}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setPhase("input")}>Încearcă din nou</Button>
                <Button variant="ghost" onClick={() => navigate("/services-catalog")}>Înapoi la catalog</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
