import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Coins, FileText, AlertCircle } from "lucide-react";
import { PostExecutionRecommendations } from "@/components/services/PostExecutionRecommendations";
import { NeuronBundleUpsell } from "@/components/credits/NeuronBundleUpsell";
import { DistributionPanel } from "@/components/distribution/DistributionPanel";
import { PostExecutionPsychology } from "@/components/behavior/BehaviorOverlay";
import type { Service, JobStatus } from "@/hooks/useRunService";

interface Props {
  jobStatus: JobStatus;
  jobResult: string;
  service: Service;
  creditBalance: number;
  inputs: Record<string, string>;
  onReset: () => void;
  onNavigate: (path: string, state?: any) => void;
  t: (key: string) => string;
}

export function RunServiceResults({ jobStatus, jobResult, service, creditBalance, inputs, onReset, onNavigate, t }: Props) {
  return (
    <>
      <AnimatePresence>
        {jobResult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                {jobStatus === "completed" ? t("run_service.results_audited") : t("run_service.generating")}
              </h2>
              {jobStatus === "running" && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-micro text-primary" aria-live="polite">{t("run_service.live")}</span>
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 max-h-[500px] overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">{jobResult}</pre>
            </div>

            {jobStatus === "completed" && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap items-center gap-2 mt-4"
                >
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-lg" onClick={() => onNavigate("/jobs")}>
                    {t("run_service.view_all_jobs")}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-lg" onClick={() => onNavigate("/credits")}>
                    <Coins className="h-3 w-3" /> {t("run_service.view_credits")}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-lg" onClick={() => onNavigate("/library")}>
                    <FileText className="h-3 w-3" /> {t("run_service.view_in_library")}
                  </Button>
                  <Button variant="default" size="sm" className="text-xs gap-1.5 rounded-lg" onClick={onReset}>
                    <Play className="h-3 w-3" /> {t("run_service.run_again")}
                  </Button>
                </motion.div>

                <DistributionPanel content={jobResult} serviceKey={service.service_key} serviceName={service.name} />
                <PostExecutionPsychology neuronsSpent={service.credits_cost} serviceKey={service.service_key} />
                <PostExecutionRecommendations
                  serviceKey={service.service_key}
                  serviceCategory={service.category}
                  lastOutput={jobResult}
                  lastGoal={inputs["content"] || inputs["text"] || ""}
                  onChainService={(chainKey, prefill) => {
                    onNavigate(`/run/${chainKey}`, { state: { prefillInput: prefill.input, prefillGoal: prefill.goal } });
                  }}
                />
                <NeuronBundleUpsell neuronsSpent={service.credits_cost} currentBalance={creditBalance} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {jobStatus === "failed" && !jobResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">{t("run_service.job_failed")}</p>
            <p className="text-xs text-muted-foreground">{t("run_service.job_failed_desc")}</p>
          </div>
        </motion.div>
      )}
    </>
  );
}
