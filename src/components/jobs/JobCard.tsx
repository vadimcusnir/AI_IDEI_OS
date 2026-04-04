/**
 * JobCard — Expandable row for a single job in the Jobs list.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Clock, CheckCircle2, XCircle, Play, ChevronRight,
  AlertCircle, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Job {
  id: string;
  neuron_id: number;
  worker_type: string;
  status: string;
  input: any;
  result: any;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  retry_count: number;
  max_retries: number;
  progress: number;
  current_step: string | null;
  depth: string;
}

const STATUS_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground" },
  running: { icon: Play, color: "text-primary" },
  completed: { icon: CheckCircle2, color: "text-status-validated" },
  failed: { icon: XCircle, color: "text-destructive" },
};

interface JobCardProps {
  job: Job;
  isExpanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}

export function JobCard({ job, isExpanded, onToggle, onRefresh }: JobCardProps) {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const si = STATUS_ICONS[job.status] || STATUS_ICONS.pending;
  const StatusIcon = si.icon;
  const statusLabel = t(`jobs.status_${job.status}`);
  const statusDesc = t(`jobs.status_${job.status}_desc`);
  const duration = job.completed_at
    ? Math.round((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / 1000)
    : null;

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
              job.status === "completed" ? "bg-status-validated/10" :
              job.status === "failed" ? "bg-destructive/10" :
              job.status === "running" ? "bg-primary/10" : "bg-muted"
            )}>
              <StatusIcon className={cn("h-3.5 w-3.5", si.color)} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-micro max-w-[200px]">{statusDesc}</TooltipContent>
        </Tooltip>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{job.worker_type.replace(/_/g, " ")}</span>
            <span className={cn("text-nano font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0", si.color, "bg-current/10")}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
            <span className="text-micro text-muted-foreground">
              {new Date(job.created_at).toLocaleDateString()}
            </span>
            {duration !== null && (
              <span className="text-micro text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {duration}s
              </span>
            )}
            <span className="text-micro font-mono text-muted-foreground/50">
              N#{job.neuron_id}
            </span>
            {job.retry_count > 0 && (
              <span className="text-nano text-destructive/60">
                retry {job.retry_count}/{job.max_retries}
              </span>
            )}
            {job.current_step && job.status === "running" && (
              <span className="text-nano text-primary/70 font-medium">
                {job.current_step}
              </span>
            )}
          </div>
          {job.status === "running" && job.progress > 0 && (
            <div className="w-full mt-1.5">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, job.progress)}%` }}
                />
              </div>
              <span className="text-nano text-muted-foreground">{job.progress}%</span>
            </div>
          )}
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isExpanded && "rotate-90"
        )} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          {job.input && Object.keys(job.input).length > 0 && (
            <div className="mb-3">
              <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-1">Input</p>
              <pre className="text-dense font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(job.input, null, 2)}
              </pre>
            </div>
          )}
          {job.result && Object.keys(job.result).length > 0 && (
            <div>
              <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("jobs.result_label")}</p>
              <pre className="text-dense font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {typeof job.result === "object" && job.result.content
                  ? job.result.content
                  : JSON.stringify(job.result, null, 2)}
              </pre>
            </div>
          )}
          {job.status === "failed" && (
            <div className="flex items-start gap-2 mt-2 bg-destructive/5 border border-destructive/15 rounded-lg p-3">
              <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-destructive font-medium">
                  {job.error_message || (job.result as any)?.error || t("jobs.job_failed_label")}
                </p>
                <p className="text-micro text-muted-foreground mt-1">
                  {job.retry_count >= job.max_retries
                    ? t("jobs.retries_exhausted")
                    : t("jobs.retries_remaining", { current: job.retry_count, max: job.max_retries })}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            {job.status === "failed" && job.retry_count < job.max_retries && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={async () => {
                  const { data, error } = await supabase.rpc("retry_failed_job", { _job_id: job.id });
                  if (error || !data) toast.error(t("jobs.retry_failed"));
                  else { toast.success(t("jobs.job_rescheduled")); onRefresh(); }
                }}
              >
                <Play className="h-3 w-3" /> {t("jobs.retry")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <ChevronRight className="h-3 w-3" /> Detalii
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => navigate(`/n/${job.neuron_id}`)}
            >
              <Brain className="h-3 w-3" /> {t("jobs.view_neuron")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
