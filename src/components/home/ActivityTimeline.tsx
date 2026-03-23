/**
 * ActivityTimeline — Real-time feed of recent platform activity.
 * Shows neuron creations, job completions, extractions, and system events.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, CheckCircle2, AlertCircle, Upload,
  FileText, Sparkles, Clock, Activity, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TimelineEvent {
  id: string;
  type: "neuron_created" | "job_completed" | "job_failed" | "job_started" | "episode_uploaded" | "extraction";
  title: string;
  subtitle?: string;
  link?: string;
  timestamp: string;
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  neuron_created: { icon: Brain, color: "text-primary", bg: "bg-primary/10" },
  job_completed: { icon: CheckCircle2, color: "text-status-validated", bg: "bg-status-validated/10" },
  job_failed: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  job_started: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10" },
  episode_uploaded: { icon: Upload, color: "text-primary", bg: "bg-primary/10" },
  extraction: { icon: Zap, color: "text-accent-foreground", bg: "bg-accent/10" },
};

export function ActivityTimeline() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !currentWorkspace) return;
    loadEvents();
  }, [user, currentWorkspace]);

  const loadEvents = async () => {
    if (!currentWorkspace) return;
    const wsId = currentWorkspace.id;

    const [neuronsRes, jobsRes, episodesRes] = await Promise.all([
      supabase.from("neurons")
        .select("id, number, title, created_at")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("neuron_jobs")
        .select("id, worker_type, status, created_at")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("episodes")
        .select("id, title, created_at")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const merged: TimelineEvent[] = [];

    (neuronsRes.data || []).forEach((n: any) => {
      merged.push({
        id: `neuron-${n.id}`,
        type: "neuron_created",
        title: n.title || `Neuron #${n.number}`,
        subtitle: t("home.activity.neuron_created", "Neuron created"),
        link: `/n/${n.number}`,
        timestamp: n.created_at,
      });
    });

    (jobsRes.data || []).forEach((j: any) => {
      const type = j.status === "completed" ? "job_completed" : j.status === "failed" ? "job_failed" : "job_started";
      merged.push({
        id: `job-${j.id}`,
        type,
        title: j.worker_type.replace(/-/g, " "),
        subtitle: j.status === "completed"
          ? t("home.activity.job_done", "Job completed")
          : j.status === "failed"
          ? t("home.activity.job_failed", "Job failed")
          : t("home.activity.job_running", "Job in progress"),
        link: `/jobs`,
        timestamp: j.created_at,
      });
    });

    (episodesRes.data || []).forEach((e: any) => {
      merged.push({
        id: `episode-${e.id}`,
        type: "episode_uploaded",
        title: e.title || "Episode",
        subtitle: t("home.activity.episode_uploaded", "Episode uploaded"),
        link: `/extractor`,
        timestamp: e.created_at,
      });
    });

    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEvents(merged.slice(0, 12));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-2 w-1/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          {t("home.activity.title", "Activity")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 gap-1"
          onClick={() => navigate("/notifications")}
        >
          {t("common:view_all", "All")} <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

        <AnimatePresence>
          <div className="space-y-0.5">
            {events.map((event, idx) => {
              const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.neuron_created;
              const Icon = config.icon;
              const timeAgo = formatDistanceToNow(new Date(event.timestamp), { addSuffix: true });

              return (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  onClick={() => event.link && navigate(event.link)}
                  className="w-full flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors text-left group relative"
                >
                  <div className={cn("h-[30px] w-[30px] rounded-lg flex items-center justify-center shrink-0 z-10", config.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", config.color)} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/70">{event.subtitle}</span>
                      <span className="text-[9px] text-muted-foreground/40">·</span>
                      <span className="text-[9px] text-muted-foreground/40 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
