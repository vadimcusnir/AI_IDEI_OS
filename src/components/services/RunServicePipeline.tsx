import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/hooks/useRunService";

interface Props {
  jobStatus: JobStatus;
  steps: { label: string; key: string }[];
  t: (key: string) => string;
}

export function RunServicePipeline({ jobStatus, steps, t }: Props) {
  if (jobStatus !== "creating" && jobStatus !== "running") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
        role="status"
        aria-label="Execution pipeline"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">{t("run_service.execution_pipeline")}</h2>
        <div className="space-y-1">
          {steps.map((step, i) => {
            const isDone = (i === 0 && jobStatus !== "creating") ||
                           (i === 1 && jobStatus === "running");
            const isActive = (i === 0 && jobStatus === "creating") ||
                             (i === 2 && jobStatus === "running");
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  isActive && "bg-primary/5 border border-primary/10",
                  isDone && "opacity-60"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-status-validated shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                )}
                <span className={cn(
                  "text-sm",
                  isDone && "line-through text-muted-foreground",
                  isActive && "text-primary font-medium",
                  !isDone && !isActive && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="ml-auto text-micro text-primary/60 animate-pulse" aria-live="polite">{t("run_service.processing")}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
