import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Brain, Briefcase, Users, Coins, TrendingUp, TrendingDown,
  AlertTriangle, Clock, ArrowRight, Zap, Shield, Target, BarChart3
} from "lucide-react";

// ── Mini Sparkline (CSS-based, no chart lib) ──
function Sparkline({ data, color = "bg-primary" }: { data: number[]; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px h-6">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn("w-1 rounded-t-sm transition-all", color)}
          style={{ height: `${Math.max((v / max) * 100, 4)}%`, opacity: 0.4 + (i / data.length) * 0.6 }}
        />
      ))}
    </div>
  );
}

// ── Metric Card with trend ──
function MetricCard({ label, value, trend, icon: Icon, sparkData, index }: {
  label: string; value: string | number; trend?: number; icon: React.ElementType;
  sparkData?: number[]; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-0.5 text-nano font-mono",
            trend >= 0 ? "text-emerald-500" : "text-destructive"
          )}>
            {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {trend >= 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold font-mono mb-2">{value}</p>
      {sparkData && <Sparkline data={sparkData} />}
    </motion.div>
  );
}

// ── Activity Feed Item ──
function ActivityItem({ type, message, time, severity }: {
  type: string; message: string; time: string; severity?: string;
}) {
  const iconMap: Record<string, React.ElementType> = {
    job: Briefcase, credit: Coins, neuron: Brain, user: Users, alert: AlertTriangle
  };
  const Icon = iconMap[type] || Activity;

  return (
    <div className={cn(
      "flex items-start gap-3 py-2 px-3 rounded-lg transition-colors",
      severity === "error" ? "bg-destructive/5" :
      severity === "warning" ? "bg-amber-500/5" : "hover:bg-muted/30"
    )}>
      <div className={cn(
        "h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
        severity === "error" ? "bg-destructive/10" :
        severity === "warning" ? "bg-amber-500/10" : "bg-primary/10"
      )}>
        <Icon className={cn("h-3 w-3",
          severity === "error" ? "text-destructive" :
          severity === "warning" ? "text-amber-500" : "text-primary"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-tight">{message}</p>
        <p className="text-nano text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

export function AdminOverviewTab({ stats }: {
  stats: {
    totalNeurons: number; publishedNeurons: number; draftNeurons: number;
    totalEpisodes: number; totalJobs: number; completedJobs: number; failedJobs: number;
    totalUsers: number; totalCreditsCirculating: number; totalCreditsSpent: number;
    activeServices: number;
  };
}) {
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [jobTrend, setJobTrend] = useState<number[]>([]);
  const [creditTrend, setCreditTrend] = useState<number[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState(0);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = useCallback(async () => {
    // Load recent activity, job trends, alerts in parallel
    const [activityRes, jobsRes, alertsRes, txRes] = await Promise.all([
      // Recent credit transactions
      supabase.from("credit_transactions")
        .select("id, user_id, amount, type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      // Jobs last 7 days for sparkline
      supabase.from("neuron_jobs")
        .select("created_at, status")
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
        .order("created_at", { ascending: true }),
      // Pending anomaly alerts
      supabase.from("anomaly_alerts" as any)
        .select("id", { count: "exact", head: true })
        .is("acknowledged_at", null),
      // Credit volume last 7 days
      supabase.from("credit_transactions")
        .select("amount, created_at")
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
        .order("created_at", { ascending: true }),
    ]);

    // Build activity feed
    const activities = (activityRes.data || []).map((tx: any) => ({
      type: "credit",
      message: `${tx.type.toUpperCase()}: ${tx.description} (${tx.amount > 0 ? "+" : ""}${tx.amount}N)`,
      time: formatRelative(tx.created_at),
      severity: tx.type === "denied" ? "error" : tx.amount < 0 ? "warning" : undefined,
    }));
    setRecentActivity(activities);

    // Build job sparkline (group by day)
    const dayBuckets = new Array(7).fill(0);
    (jobsRes.data || []).forEach((j: any) => {
      const dayIdx = Math.floor((Date.now() - new Date(j.created_at).getTime()) / 86400000);
      if (dayIdx >= 0 && dayIdx < 7) dayBuckets[6 - dayIdx]++;
    });
    setJobTrend(dayBuckets);

    // Build credit sparkline
    const creditBuckets = new Array(7).fill(0);
    (txRes.data || []).forEach((tx: any) => {
      const dayIdx = Math.floor((Date.now() - new Date(tx.created_at).getTime()) / 86400000);
      if (dayIdx >= 0 && dayIdx < 7) creditBuckets[6 - dayIdx] += Math.abs(tx.amount);
    });
    setCreditTrend(creditBuckets);

    setPendingAlerts(alertsRes.count ?? 0);
  }, []);

  const successRate = stats.totalJobs > 0
    ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Pulse Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Users" value={stats.totalUsers}
          icon={Users} sparkData={[]} index={0}
        />
        <MetricCard
          label="Jobs (7d)" value={jobTrend.reduce((a, b) => a + b, 0)}
          icon={Briefcase} sparkData={jobTrend} index={1}
          trend={jobTrend.length >= 2 && jobTrend[jobTrend.length - 2] > 0
            ? Math.round(((jobTrend[jobTrend.length - 1] - jobTrend[jobTrend.length - 2]) / jobTrend[jobTrend.length - 2]) * 100) : undefined}
        />
        <MetricCard
          label="Credits Volume" value={`${(creditTrend.reduce((a, b) => a + b, 0)).toLocaleString()}N`}
          icon={Coins} sparkData={creditTrend} index={2}
        />
        <MetricCard
          label="Success Rate" value={`${successRate}%`}
          icon={Target} index={3}
          trend={successRate >= 90 ? successRate - 90 : -(90 - successRate)}
        />
      </div>

      {/* Health + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> Platform Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Neurons</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold">{stats.totalNeurons}</span>
                <Badge variant="outline" className="text-nano">{stats.publishedNeurons} pub</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Failed Jobs</span>
              <span className={cn("text-xs font-mono font-bold",
                stats.failedJobs === 0 ? "text-emerald-500" : "text-destructive"
              )}>{stats.failedJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active Services</span>
              <span className="text-xs font-mono font-bold text-primary">{stats.activeServices}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Credits in Circulation</span>
              <span className="text-xs font-mono font-bold">{stats.totalCreditsCirculating.toLocaleString()}N</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Est. Revenue</span>
              <span className="text-xs font-mono font-bold text-emerald-500">${(stats.totalCreditsSpent * 0.01).toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Zap className="h-3 w-3" /> Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              { label: "User Management", path: "users", icon: Users },
              { label: "Service Manifest", path: "manifests", icon: BarChart3 },
              { label: "Emergency Controls", path: "emergency", icon: AlertTriangle },
              { label: "Feature Flags", path: "flags", icon: Activity },
            ].map(action => (
              <button
                key={action.path}
                onClick={() => {
                  const tabEvent = new CustomEvent("admin-tab-change", { detail: action.path });
                  window.dispatchEvent(tabEvent);
                }}
                className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <action.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs flex-1">{action.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          {pendingAlerts > 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-600">{pendingAlerts} unacknowledged alert{pendingAlerts > 1 ? "s" : ""}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Recent Activity
          </h3>
          <div className="space-y-0.5 max-h-52 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No recent activity</p>
            ) : (
              recentActivity.slice(0, 8).map((a, i) => (
                <ActivityItem key={i} {...a} />
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Economy Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" /> Economy Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-nano text-muted-foreground uppercase">Circulating</p>
            <p className="text-lg font-bold font-mono">{stats.totalCreditsCirculating.toLocaleString()}<span className="text-xs text-muted-foreground ml-1">N</span></p>
          </div>
          <div>
            <p className="text-nano text-muted-foreground uppercase">Consumed</p>
            <p className="text-lg font-bold font-mono text-amber-500">{stats.totalCreditsSpent.toLocaleString()}<span className="text-xs text-muted-foreground ml-1">N</span></p>
          </div>
          <div>
            <p className="text-nano text-muted-foreground uppercase">Avg/User</p>
            <p className="text-lg font-bold font-mono">
              {stats.totalUsers > 0 ? Math.round(stats.totalCreditsCirculating / stats.totalUsers).toLocaleString() : 0}
              <span className="text-xs text-muted-foreground ml-1">N</span>
            </p>
          </div>
          <div>
            <p className="text-nano text-muted-foreground uppercase">Neurons/User</p>
            <p className="text-lg font-bold font-mono">
              {stats.totalUsers > 0 ? (stats.totalNeurons / stats.totalUsers).toFixed(1) : "0"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
