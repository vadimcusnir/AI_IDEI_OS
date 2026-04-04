/**
 * ProductionMonitorCard — Immersive card for running/completed jobs.
 * Shows animated progress bar, ETA, terminal log, and completion CTA.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, CheckCircle2, Package, ArrowRight,
  Terminal, Clock, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job } from "@/components/jobs/JobCard";

/* ── Simulated log messages by worker type ── */
const LOG_TEMPLATES: Record<string, string[]> = {
  default: [
    "Inițializez pipeline-ul AI...",
    "Analizez contextul sursă...",
    "Extrag pattern-uri semantice...",
    "Generez structura de bază...",
    "Rafinare varianta 1...",
    "Optimizez pentru audiență...",
    "Validare calitate output...",
    "Compil rezultatele finale...",
    "Packaging deliverables...",
    "Finalizare producție...",
  ],
  "content-writer": [
    "Analizez audiența țintă...",
    "Generez structura PAS...",
    "Redactez introducerea...",
    "Dezvolt argumentele principale...",
    "Adaug dovezi sociale...",
    "Generez CTA-uri...",
    "Redactez varianta 2...",
    "Redactez varianta 3...",
    "Optimizez readability...",
    "Finalizare conținut...",
  ],
  "social-media": [
    "Analizez trend-uri pe platformă...",
    "Generez hook-uri virale...",
    "Creez carusel structură...",
    "Redactez copy pentru fiecare slide...",
    "Adaug hashtag-uri optimizate...",
    "Generez variante caption...",
    "Optimizez pentru engagement...",
    "Finalizare pachet social...",
  ],
  "market-research": [
    "Scanez peisajul competitiv...",
    "Analizez segmente de audiență...",
    "Extrag date demografice...",
    "Generez matrice SWOT...",
    "Identificare oportunități...",
    "Calculez TAM/SAM/SOM...",
    "Generez recomandări strategice...",
    "Compilare raport final...",
  ],
};

function getLogsForWorker(workerType: string): string[] {
  const key = Object.keys(LOG_TEMPLATES).find(k => workerType.includes(k));
  return LOG_TEMPLATES[key || "default"] || LOG_TEMPLATES.default;
}

interface ProductionMonitorCardProps {
  job: Job;
}

export function ProductionMonitorCard({ job }: ProductionMonitorCardProps) {
  const navigate = useNavigate();
  const isRunning = job.status === "running" || job.status === "pending";
  const isCompleted = job.status === "completed";
  const isFailed = job.status === "failed";

  const [simulatedProgress, setSimulatedProgress] = useState(job.progress || 0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [eta, setEta] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const templates = getLogsForWorker(job.worker_type);

  // Simulate progress and log messages for running jobs
  useEffect(() => {
    if (!isRunning) {
      if (isCompleted) setSimulatedProgress(100);
      return;
    }

    const startTime = new Date(job.created_at).getTime();
    const estimatedDuration = 120; // 2 min default estimate

    const progressInterval = setInterval(() => {
      setSimulatedProgress(prev => {
        const elapsed = (Date.now() - startTime) / 1000;
        const natural = Math.min(92, (elapsed / estimatedDuration) * 100);
        const newVal = Math.max(prev, natural);
        
        // Update ETA
        const remaining = Math.max(0, Math.round(estimatedDuration - elapsed));
        setEta(remaining);

        return newVal;
      });
    }, 1000);

    const logInterval = setInterval(() => {
      setLogMessages(prev => {
        if (prev.length >= templates.length) return prev;
        const next = templates[prev.length];
        return [...prev, next];
      });
    }, 3500 + Math.random() * 2000);

    // Seed initial messages
    if (logMessages.length === 0) {
      setLogMessages([templates[0]]);
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, [isRunning, isCompleted, job.created_at, job.worker_type]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logMessages]);

  // Use real progress if available
  const displayProgress = job.progress > 0 ? Math.max(job.progress, simulatedProgress) : simulatedProgress;

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return "< 1s";
    if (seconds < 60) return `~${seconds}s`;
    return `~${Math.ceil(seconds / 60)}min`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        isRunning && "border-primary/30 bg-gradient-to-b from-primary/[0.03] to-background shadow-lg shadow-primary/5",
        isCompleted && "border-status-validated/30 bg-gradient-to-b from-status-validated/[0.03] to-background",
        isFailed && "border-destructive/30 bg-gradient-to-b from-destructive/[0.03] to-background",
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
              isRunning && "bg-primary/10",
              isCompleted && "bg-status-validated/10",
              isFailed && "bg-destructive/10",
            )}>
              {isRunning ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-status-validated" />
              ) : (
                <Zap className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                {job.worker_type.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </h3>
              <p className="text-micro text-muted-foreground">
                {new Date(job.created_at).toLocaleString()}
                {job.current_step && isRunning && (
                  <span className="ml-2 text-primary font-medium">• {job.current_step}</span>
                )}
              </p>
            </div>
          </div>
          {isRunning && eta !== null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full shrink-0">
              <Clock className="h-3 w-3" />
              <span className="font-mono">{formatEta(eta)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(isRunning || isCompleted) && (
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-micro font-medium text-muted-foreground">
              {isCompleted ? "Producție finalizată" : "Se procesează..."}
            </span>
            <span className="text-micro font-mono font-bold text-foreground">
              {Math.round(displayProgress)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isCompleted ? "bg-status-validated" : "bg-primary",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Terminal log — only for running jobs */}
      {isRunning && logMessages.length > 0 && (
        <div className="mx-5 mb-4 rounded-xl bg-[hsl(var(--foreground)/0.03)] border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/30">
            <Terminal className="h-3 w-3 text-muted-foreground" />
            <span className="text-nano font-mono uppercase tracking-wider text-muted-foreground">
              Production Log
            </span>
            <div className="ml-auto flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-validated animate-pulse" />
              <span className="text-nano text-muted-foreground">LIVE</span>
            </div>
          </div>
          <div className="p-3 max-h-36 overflow-y-auto font-mono text-dense space-y-1">
            <AnimatePresence>
              {logMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-primary/50 shrink-0">▸</span>
                  <span className={cn(
                    "text-foreground/70",
                    i === logMessages.length - 1 && "text-foreground font-medium"
                  )}>
                    {msg}
                  </span>
                  {i === logMessages.length - 1 && (
                    <span className="inline-block w-1.5 h-3.5 bg-primary/60 animate-pulse ml-0.5" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Completed CTA */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pb-5"
        >
          <div className="rounded-xl bg-status-validated/5 border border-status-validated/20 p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Package className="h-5 w-5 text-status-validated" />
              <p className="text-sm font-semibold">Producție completă!</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Pachetul tău de deliverables este gata în Librărie.
            </p>
            <Button
              onClick={() => navigate("/library")}
              className="w-full gap-2 h-11"
            >
              <Package className="h-4 w-4" />
              Vezi Pachetul în Librărie
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="px-5 pb-5">
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
            <p className="text-xs text-destructive font-medium mb-1">
              {job.error_message || "Procesarea a eșuat"}
            </p>
            <p className="text-micro text-muted-foreground">
              {job.retry_count < job.max_retries
                ? `Reîncercare automată ${job.retry_count}/${job.max_retries}`
                : "Toate reîncercările epuizate"}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
