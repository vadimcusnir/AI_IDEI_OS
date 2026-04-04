/**
 * Automation Panel — manage recurring jobs and distribution channels.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Play, Pause, Plus, Clock, Send,
  RefreshCw, AlertTriangle, CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const JOB_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  recurring_extract: { label: "Extracție Recurentă", icon: "🔄", color: "text-blue-500" },
  recurring_generation: { label: "Generare Recurentă", icon: "✨", color: "text-purple-500" },
  send_digest: { label: "Trimite Digest", icon: "📧", color: "text-green-500" },
  publish_asset: { label: "Publică Asset", icon: "🚀", color: "text-orange-500" },
  notify_low_balance: { label: "Alertă Balanță", icon: "⚠️", color: "text-yellow-500" },
  scheduled_pipeline: { label: "Pipeline Programat", icon: "⚡", color: "text-red-500" },
};

const RUN_STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3 text-muted-foreground" />,
  running: <Loader2 className="h-3 w-3 text-primary animate-spin" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  failed: <AlertTriangle className="h-3 w-3 text-destructive" />,
};

export function AutomationPanel() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["automation-jobs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("automation_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentRuns } = useQuery({
    queryKey: ["automation-runs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("automation_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const triggerMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke("automation-engine/trigger", {
        body: { job_id: jobId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Job declanșat!");
      queryClient.invalidateQueries({ queryKey: ["automation-runs"] });
    },
    onError: () => toast.error("Eroare la declanșare"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("automation_jobs")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-jobs"] });
      toast.success("Status actualizat");
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {t("automation.title", { defaultValue: "Automatizări" })}
          </h3>
          <Badge variant="secondary" className="text-[10px]">
            {jobs?.length || 0} {t("automation.jobs", { defaultValue: "joburi" })}
          </Badge>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !jobs?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("automation.empty", { defaultValue: "Nicio automatizare configurată." })}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => {
            const meta = JOB_TYPE_META[job.job_type] || JOB_TYPE_META.recurring_extract;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn("transition-colors", !job.is_active && "opacity-50")}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-lg">{meta.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{job.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {meta.label} · {job.total_runs} rulări
                          {job.schedule_cron && ` · ⏰ ${job.schedule_cron}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => triggerMutation.mutate(job.id)}
                        disabled={!job.is_active || triggerMutation.isPending}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => toggleMutation.mutate({ id: job.id, active: !job.is_active })}
                      >
                        {job.is_active ? <Pause className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recent Runs */}
      {recentRuns && recentRuns.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("automation.recent_runs", { defaultValue: "Rulări recente" })}
          </p>
          <div className="space-y-1">
            {recentRuns.map((run: any) => (
              <div key={run.id} className="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded bg-muted/30">
                {RUN_STATUS_ICON[run.status] || RUN_STATUS_ICON.pending}
                <span className="flex-1 truncate text-muted-foreground">
                  {run.result_summary || run.status}
                </span>
                {run.neurons_spent > 0 && (
                  <span className="text-[9px] font-mono text-primary">
                    {run.neurons_spent}N
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
