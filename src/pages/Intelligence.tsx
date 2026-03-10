import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Brain, Coins, FileAudio, BarChart3,
  TrendingUp, Layers, Sparkles, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Stats {
  totalNeurons: number;
  draftNeurons: number;
  publishedNeurons: number;
  totalEpisodes: number;
  analyzedEpisodes: number;
  creditsBalance: number;
  creditsSpent: number;
  creditsEarned: number;
  categories: Record<string, number>;
  lifecycles: Record<string, number>;
  recentActivity: { date: string; count: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  transcript: "bg-muted-foreground",
  insight: "bg-primary",
  framework: "bg-ai-accent",
  strategy: "bg-status-validated",
  formula: "bg-destructive",
  pattern: "bg-primary",
  avatar: "bg-muted-foreground",
  argument_map: "bg-ai-accent",
  narrative: "bg-status-validated",
  psychological: "bg-destructive",
  commercial: "bg-primary",
};

export default function Intelligence() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    loadStats();
  }, [user, authLoading]);

  const loadStats = async () => {
    const [neuronsRes, episodesRes, creditsRes] = await Promise.all([
      supabase.from("neurons").select("id, status, content_category, lifecycle, created_at").eq("author_id", user!.id),
      supabase.from("episodes").select("id, status, created_at").eq("author_id", user!.id),
      supabase.from("user_credits").select("*").eq("user_id", user!.id).maybeSingle(),
    ]);

    const neurons = neuronsRes.data || [];
    const episodes = episodesRes.data || [];
    const credits = creditsRes.data;

    // Category distribution
    const categories: Record<string, number> = {};
    const lifecycles: Record<string, number> = {};
    neurons.forEach((n: any) => {
      if (n.content_category) categories[n.content_category] = (categories[n.content_category] || 0) + 1;
      if (n.lifecycle) lifecycles[n.lifecycle] = (lifecycles[n.lifecycle] || 0) + 1;
    });

    // Recent activity (last 7 days)
    const now = new Date();
    const recentActivity: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = neurons.filter((n: any) => n.created_at.startsWith(dateStr)).length;
      recentActivity.push({ date: dateStr, count });
    }

    setStats({
      totalNeurons: neurons.length,
      draftNeurons: neurons.filter((n: any) => n.status === "draft").length,
      publishedNeurons: neurons.filter((n: any) => n.status === "published").length,
      totalEpisodes: episodes.length,
      analyzedEpisodes: episodes.filter((e: any) => e.status === "analyzed").length,
      creditsBalance: credits?.balance ?? 0,
      creditsSpent: credits?.total_spent ?? 0,
      creditsEarned: credits?.total_earned ?? 0,
      categories,
      lifecycles,
      recentActivity,
    });
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const maxCat = Math.max(...Object.values(stats.categories), 1);
  const maxActivity = Math.max(...stats.recentActivity.map(a => a.count), 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img src={logo} alt="ai-idei.com" className="h-5 w-5" />
          <span className="text-sm font-serif">Intelligence</span>
          <span className="text-[9px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
            Analytics
          </span>
        </div>
        <ThemeToggle />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <KPICard icon={Brain} label="Total Neurons" value={stats.totalNeurons} />
          <KPICard icon={FileAudio} label="Episodes" value={stats.totalEpisodes} sub={`${stats.analyzedEpisodes} analyzed`} />
          <KPICard icon={Coins} label="Credits Spent" value={stats.creditsSpent} color="text-destructive" />
          <KPICard icon={TrendingUp} label="Balance" value={stats.creditsBalance} color="text-status-validated" />
        </div>

        {/* Neuron Status */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Neuron Status</h3>
            <div className="space-y-2">
              <StatusBar label="Draft" value={stats.draftNeurons} total={stats.totalNeurons} className="bg-muted-foreground" />
              <StatusBar label="Published" value={stats.publishedNeurons} total={stats.totalNeurons} className="bg-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Lifecycle</h3>
            <div className="space-y-2">
              {Object.entries(stats.lifecycles)
                .sort(([, a], [, b]) => b - a)
                .map(([key, val]) => (
                  <StatusBar key={key} label={key} value={val} total={stats.totalNeurons} className="bg-ai-accent" />
                ))}
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        {Object.keys(stats.categories).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Content Categories
            </h2>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="space-y-2">
                {Object.entries(stats.categories)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-[10px] font-medium w-24 truncate capitalize">{cat.replace("_", " ")}</span>
                      <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", CATEGORY_COLORS[cat] || "bg-primary")}
                          style={{ width: `${(count / maxCat) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold w-8 text-right">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Sparkline */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            7-Day Activity
          </h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-end gap-1.5 h-20">
              {stats.recentActivity.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "60px" }}>
                    <div
                      className="w-full max-w-[28px] bg-primary/80 rounded-t transition-all"
                      style={{ height: `${Math.max((day.count / maxActivity) * 60, day.count > 0 ? 4 : 0)}px` }}
                    />
                  </div>
                  <span className="text-[8px] text-muted-foreground">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: "narrow" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credits Economy */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Credit Economy
          </h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-2xl font-bold font-mono">{stats.creditsBalance}</span>
                <span className="text-xs text-muted-foreground ml-1.5">NEURONS available</span>
              </div>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/credits")}>
                View Ledger
              </Button>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${stats.creditsEarned > 0 ? (stats.creditsBalance / stats.creditsEarned) * 100 : 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">{stats.creditsSpent} spent</span>
              <span className="text-[10px] text-muted-foreground">{stats.creditsEarned} earned</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold font-mono", color)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBar({ label, value, total, className }: {
  label: string; value: number; total: number; className?: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium w-20 truncate capitalize">{label}</span>
      <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", className)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono w-6 text-right">{value}</span>
    </div>
  );
}
