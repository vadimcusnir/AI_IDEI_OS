/**
 * JobStats — Stats row for the Jobs page.
 */
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface JobStatsProps {
  completedCount: number;
  failedCount: number;
  runningCount: number;
  avgDuration: number;
}

export function JobStats({ completedCount, failedCount, runningCount, avgDuration }: JobStatsProps) {
  const { t } = useTranslation("pages");

  const stats = [
    { label: t("jobs.stat_completed"), value: completedCount, color: "text-status-validated", tip: t("jobs.stat_completed_tip") },
    { label: t("jobs.stat_failed"), value: failedCount, color: "text-destructive", tip: t("jobs.stat_failed_tip") },
    { label: t("jobs.stat_active"), value: runningCount, color: "text-primary", tip: t("jobs.stat_active_tip") },
    { label: t("jobs.stat_avg_duration"), value: avgDuration, color: "", tip: t("jobs.stat_avg_duration_tip"), suffix: "sec" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(stat => (
        <Tooltip key={stat.label}>
          <TooltipTrigger asChild>
            <div className="bg-card border border-border rounded-xl p-4 cursor-default">
              <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold font-mono", stat.color)}>{stat.value}</span>
                {stat.suffix && <span className="text-micro text-muted-foreground">{stat.suffix}</span>}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-micro">{stat.tip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
