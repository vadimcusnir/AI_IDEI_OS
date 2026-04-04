/**
 * Admin Analytics Tab — shows internal event tracking stats.
 * Displays: event counts, top events, usage over time, funnels.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, TrendingUp, Users, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventStat {
  event_name: string;
  count: number;
  unique_users: number;
}

interface DailyStat {
  date: string;
  count: number;
}

interface QueueStat {
  pending: number;
  running: number;
  dead_letter: number;
  completed_today: number;
  failed_today: number;
}

export function AdminAnalyticsTab() {
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStat | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);

    // 1. Get total event count
    const { count: evCount } = await supabase
      .from("analytics_events" as any)
      .select("*", { count: "exact", head: true });
    setTotalEvents(evCount || 0);

    // 2. Get all events for analysis
    const { data: events } = await supabase
      .from("analytics_events" as any)
      .select("event_name, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (events) {
      // Group by event_name
      const grouped: Record<string, { count: number; users: Set<string> }> = {};
      for (const e of events as any[]) {
        if (!grouped[e.event_name]) grouped[e.event_name] = { count: 0, users: new Set() };
        grouped[e.event_name].count++;
        if (e.user_id) grouped[e.event_name].users.add(e.user_id);
      }

      const stats: EventStat[] = Object.entries(grouped)
        .map(([name, data]) => ({
          event_name: name,
          count: data.count,
          unique_users: data.users.size,
        }))
        .sort((a, b) => b.count - a.count);
      setEventStats(stats);

      // Unique users total
      const allUsers = new Set((events as any[]).map(e => e.user_id).filter(Boolean));
      setTotalUsers(allUsers.size);

      // Daily distribution (last 14 days)
      const daily: Record<string, number> = {};
      for (const e of events as any[]) {
        const date = (e.created_at as string).slice(0, 10);
        daily[date] = (daily[date] || 0) + 1;
      }
      const dailyArr = Object.entries(daily)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14);
      setDailyStats(dailyArr);
    }

    // 3. Queue stats
    const [pending, running, dlq, completedToday, failedToday] = await Promise.all([
      supabase.from("neuron_jobs").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("neuron_jobs").select("*", { count: "exact", head: true }).eq("status", "running"),
      supabase.from("neuron_jobs").select("*", { count: "exact", head: true }).eq("dead_letter", true),
      supabase.from("neuron_jobs").select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", new Date(Date.now() - 86400000).toISOString()),
      supabase.from("neuron_jobs").select("*", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    ]);

    setQueueStats({
      pending: pending.count || 0,
      running: running.count || 0,
      dead_letter: dlq.count || 0,
      completed_today: completedToday.count || 0,
      failed_today: failedToday.count || 0,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const maxDaily = Math.max(...dailyStats.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Product Analytics</h3>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={loadAnalytics}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<BarChart3 className="h-4 w-4 text-primary" />} label="Total Events" value={totalEvents} />
        <StatCard icon={<Users className="h-4 w-4 text-primary" />} label="Active Users" value={totalUsers} />
        <StatCard icon={<Zap className="h-4 w-4 text-status-validated" />} label="Queue Pending" value={queueStats?.pending || 0} />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-ai-accent" />} label="Jobs Today" value={queueStats?.completed_today || 0} />
      </div>

      {/* Job Queue Health */}
      {queueStats && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Execution Queue Health</h4>
          <div className="grid grid-cols-5 gap-2">
            <QueueItem label="Pending" value={queueStats.pending} color="text-muted-foreground" />
            <QueueItem label="Running" value={queueStats.running} color="text-primary" />
            <QueueItem label="Done Today" value={queueStats.completed_today} color="text-status-validated" />
            <QueueItem label="Failed Today" value={queueStats.failed_today} color="text-destructive" />
            <QueueItem label="Dead Letter" value={queueStats.dead_letter} color="text-destructive" />
          </div>
        </div>
      )}

      {/* Daily Activity Chart */}
      {dailyStats.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Daily Events (14 days)</h4>
          <div className="flex items-end gap-1 h-24">
            {dailyStats.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/20 rounded-t-sm relative group"
                  style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: 2 }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-1.5 py-0.5 text-nano opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {d.date}: {d.count}
                  </div>
                  <div className="w-full h-full bg-primary rounded-t-sm" />
                </div>
                <span className="text-nano text-muted-foreground">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Event Breakdown</h4>
        {eventStats.length === 0 ? (
          <p className="text-xs text-muted-foreground">No events tracked yet.</p>
        ) : (
          <div className="space-y-2">
            {eventStats.map((stat) => {
              const pct = totalEvents > 0 ? (stat.count / totalEvents) * 100 : 0;
              return (
                <div key={stat.event_name} className="flex items-center gap-3">
                  <div className="w-32 sm:w-40 truncate text-xs font-mono">{stat.event_name}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono w-10 text-right">{stat.count}</span>
                  <span className="text-micro text-muted-foreground w-16 text-right">{stat.unique_users} users</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversion Funnel */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Conversion Funnel</h4>
        <FunnelDisplay events={eventStats} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className="text-2xl font-bold font-mono">{value.toLocaleString()}</span>
    </div>
  );
}

function QueueItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={cn("text-lg font-bold font-mono", color)}>{value}</div>
      <div className="text-nano text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function FunnelDisplay({ events }: { events: EventStat[] }) {
  const funnelSteps = [
    { key: "page_view", label: "Page Views" },
    { key: "episode_uploaded", label: "Episodes Uploaded" },
    { key: "extraction_started", label: "Extractions Started" },
    { key: "extraction_completed", label: "Extractions Done" },
    { key: "service_started", label: "Services Started" },
    { key: "service_completed", label: "Services Completed" },
  ];

  const eventMap = new Map(events.map(e => [e.event_name, e]));
  const maxCount = Math.max(...funnelSteps.map(s => eventMap.get(s.key)?.count || 0), 1);

  return (
    <div className="space-y-2">
      {funnelSteps.map((step, i) => {
        const stat = eventMap.get(step.key);
        const count = stat?.count || 0;
        const prevCount = i > 0 ? (eventMap.get(funnelSteps[i - 1].key)?.count || 0) : count;
        const convRate = prevCount > 0 && i > 0 ? Math.round((count / prevCount) * 100) : 100;
        const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className="w-36 text-xs truncate">{step.label}</div>
            <div className="flex-1 h-5 bg-muted rounded relative overflow-hidden">
              <div
                className="h-full bg-primary/30 rounded transition-all"
                style={{ width: `${width}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-micro font-mono">
                {count}
              </span>
            </div>
            {i > 0 && (
              <span className={cn(
                "text-micro font-mono w-10 text-right",
                convRate >= 50 ? "text-status-validated" : convRate >= 20 ? "text-ai-accent" : "text-destructive"
              )}>
                {convRate}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
