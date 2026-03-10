import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AppNotification {
  id: string;
  type: "job_completed" | "job_failed" | "extraction_done" | "credits_low" | "version_created";
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  meta?: Record<string, any>;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const checkNotifications = useCallback(async () => {
    if (!user) return;

    const newNotifs: AppNotification[] = [];

    // Check recent completed/failed jobs (last 5 min)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentJobs } = await supabase
      .from("neuron_jobs")
      .select("id, worker_type, status, completed_at")
      .eq("author_id", user.id)
      .gte("completed_at", fiveMinAgo)
      .order("completed_at", { ascending: false })
      .limit(5);

    if (recentJobs) {
      for (const job of recentJobs) {
        const existing = notifications.find(n => n.id === `job-${job.id}`);
        if (!existing) {
          newNotifs.push({
            id: `job-${job.id}`,
            type: job.status === "completed" ? "job_completed" : "job_failed",
            title: job.status === "completed" ? "Job Completed" : "Job Failed",
            message: `${(job.worker_type as string).replace(/-/g, " ")} — ${job.status}`,
            read: false,
            timestamp: new Date(job.completed_at as string),
          });
        }
      }
    }

    // Check credits
    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (credits && (credits as any).balance < 50) {
      const existing = notifications.find(n => n.type === "credits_low");
      if (!existing) {
        newNotifs.push({
          id: `credits-low-${Date.now()}`,
          type: "credits_low",
          title: "Credits Low",
          message: `Balance: ${(credits as any).balance} NEURONS. Consider managing your usage.`,
          read: false,
          timestamp: new Date(),
        });
      }
    }

    if (newNotifs.length > 0) {
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 20));
    }
  }, [user, notifications]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!user) return;
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, clearAll };
}
