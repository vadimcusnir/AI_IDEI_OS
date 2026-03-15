import { useEffect, useState, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  BarChart3, Users, Eye, TrendingUp, Loader2,
  Activity, Globe, MousePointerClick, Filter, Layers, GitBranch,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface AnalyticsSummary {
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  top_events: { event_name: string; count: number }[] | null;
  daily_breakdown: { day: string; events: number; users: number }[] | null;
  top_pages: { page_path: string; views: number }[] | null;
}

// ── Cohort helpers ──
interface CohortRow {
  cohort: string;
  total: number;
  retained: number[];
}

function buildCohorts(daily: { day: string; users: number }[] | null): CohortRow[] {
  if (!daily || daily.length < 7) return [];
  // Group weeks as cohorts
  const weeks: { label: string; days: { day: string; users: number }[] }[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const slice = daily.slice(i, i + 7);
    if (slice.length === 0) break;
    weeks.push({ label: `W${weeks.length + 1} (${slice[0].day.slice(5)})`, days: slice });
  }
  return weeks.map((w, wi) => {
    const total = Math.max(1, w.days.reduce((s, d) => s + d.users, 0));
    const retained = weeks.slice(wi).map((fw) => {
      const r = fw.days.reduce((s, d) => s + d.users, 0);
      return Math.round((r / total) * 100);
    });
    return { cohort: w.label, total, retained };
  });
}

// ── Funnel helpers ──
interface FunnelStep { label: string; event: string; }
const FUNNELS: { name: string; steps: FunnelStep[] }[] = [
  {
    name: "Onboarding → First Service",
    steps: [
      { label: "Page View", event: "page_view" },
      { label: "Neuron Created", event: "neuron_created" },
      { label: "Service Started", event: "service_started" },
      { label: "Service Completed", event: "service_completed" },
    ],
  },
  {
    name: "Content Pipeline",
    steps: [
      { label: "Episode Uploaded", event: "episode_uploaded" },
      { label: "Transcript Done", event: "transcript_completed" },
      { label: "Extraction Started", event: "extraction_started" },
      { label: "Extraction Done", event: "extraction_completed" },
    ],
  },
];

export default function AnalyticsDashboard() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");

  // Funnel data
  const [funnelData, setFunnelData] = useState<Record<string, number>>({});
  const [funnelIdx, setFunnelIdx] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    supabase.rpc("analytics_summary", { _days: days })
      .then(({ data: res }) => {
        if (res) setData(res as unknown as AnalyticsSummary);
        setLoading(false);
      });
  }, [isAdmin, days]);

  // Load funnel counts
  useEffect(() => {
    if (!isAdmin || activeTab !== "funnel") return;
    const funnel = FUNNELS[funnelIdx];
    Promise.all(
      funnel.steps.map(async (s) => {
        const { count } = await supabase
          .from("analytics_events" as any)
          .select("*", { count: "exact", head: true })
          .eq("event_name", s.event)
          .gte("created_at", new Date(Date.now() - days * 86400000).toISOString());
        return { event: s.event, count: count || 0 };
      })
    ).then((results) => {
      const map: Record<string, number> = {};
      results.forEach((r) => (map[r.event] = r.count));
      setFunnelData(map);
    });
  }, [isAdmin, activeTab, funnelIdx, days]);

  const cohorts = useMemo(() => buildCohorts(data?.daily_breakdown || null), [data]);

  if (adminLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const maxEventCount = Math.max(...(data.top_events || []).map(e => e.count), 1);
  const maxPageViews = Math.max(...(data.top_pages || []).map(p => p.views), 1);
  const funnel = FUNNELS[funnelIdx];

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Analytics — AI-IDEI" description="Platform analytics dashboard with cohort analysis, funnels, and event tracking." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold tracking-tight">Analytics</h1>
              <p className="text-[10px] text-muted-foreground">Cohort analysis · Funnels · Event tracking</p>
            </div>
            <div className="ml-auto flex gap-1">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                    days === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Total Events", value: data.total_events, icon: Activity },
              { label: "Unique Users", value: data.unique_users, icon: Users },
              { label: "Sessions", value: data.unique_sessions, icon: Globe },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-lg font-bold font-mono">{(s.value || 0).toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview" className="text-xs gap-1"><MousePointerClick className="h-3 w-3" />Overview</TabsTrigger>
              <TabsTrigger value="cohort" className="text-xs gap-1"><Layers className="h-3 w-3" />Cohorts</TabsTrigger>
              <TabsTrigger value="funnel" className="text-xs gap-1"><Filter className="h-3 w-3" />Funnels</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <MousePointerClick className="h-3 w-3" /> Top Events
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                    {(data.top_events || []).map(ev => (
                      <div key={ev.event_name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono truncate">{ev.event_name}</span>
                          <span className="text-[10px] font-bold text-primary">{ev.count.toLocaleString()}</span>
                        </div>
                        <Progress value={(ev.count / maxEventCount) * 100} className="h-1.5" />
                      </div>
                    ))}
                    {(!data.top_events || data.top_events.length === 0) && (
                      <p className="text-[10px] text-muted-foreground text-center py-4">No events tracked</p>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Eye className="h-3 w-3" /> Top Pages
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                    {(data.top_pages || []).map(pg => (
                      <div key={pg.page_path}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono truncate">{pg.page_path}</span>
                          <span className="text-[10px] font-bold text-primary">{pg.views.toLocaleString()}</span>
                        </div>
                        <Progress value={(pg.views / maxPageViews) * 100} className="h-1.5" />
                      </div>
                    ))}
                    {(!data.top_pages || data.top_pages.length === 0) && (
                      <p className="text-[10px] text-muted-foreground text-center py-4">No page views tracked</p>
                    )}
                  </div>
                </div>
              </div>

              {data.daily_breakdown && data.daily_breakdown.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" /> Daily Activity
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-1">
                    {data.daily_breakdown.slice(0, 14).map(d => {
                      const maxEvents = Math.max(...data.daily_breakdown!.map(x => x.events), 1);
                      return (
                        <div key={d.day} className="flex items-center gap-3">
                          <span className="text-[9px] font-mono text-muted-foreground w-20 shrink-0">{d.day}</span>
                          <Progress value={(d.events / maxEvents) * 100} className="h-1.5 flex-1" />
                          <span className="text-[9px] font-mono w-16 text-right shrink-0">{d.events} ev</span>
                          <span className="text-[9px] font-mono text-muted-foreground w-12 text-right shrink-0">{d.users} u</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Cohort Analysis Tab ── */}
            <TabsContent value="cohort">
              <div className="bg-card border border-border rounded-xl p-4">
                <h2 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Weekly Retention Cohorts
                </h2>
                {cohorts.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-8">Need at least 7 days of data for cohort analysis.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr>
                          <th className="text-left font-medium text-muted-foreground pb-2 pr-3">Cohort</th>
                          <th className="text-right font-medium text-muted-foreground pb-2 pr-3">Users</th>
                          {cohorts[0]?.retained.map((_, i) => (
                            <th key={i} className="text-center font-medium text-muted-foreground pb-2 w-12">W+{i}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cohorts.map((c) => (
                          <tr key={c.cohort}>
                            <td className="font-mono pr-3 py-1">{c.cohort}</td>
                            <td className="font-mono text-right pr-3">{c.total}</td>
                            {c.retained.map((pct, i) => (
                              <td key={i} className="text-center py-1">
                                <span
                                  className={cn(
                                    "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold",
                                    pct >= 80 ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                                    pct >= 50 ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                                    pct >= 20 ? "bg-orange-500/20 text-orange-700 dark:text-orange-400" :
                                    "bg-red-500/20 text-red-700 dark:text-red-400"
                                  )}
                                >
                                  {pct}%
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Funnel Tab ── */}
            <TabsContent value="funnel">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch className="h-3.5 w-3.5 text-primary" />
                  <h2 className="text-xs font-semibold">Funnel Visualization</h2>
                  <div className="ml-auto flex gap-1">
                    {FUNNELS.map((f, i) => (
                      <button
                        key={f.name}
                        onClick={() => setFunnelIdx(i)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors",
                          funnelIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {funnel.steps.map((step, i) => {
                    const count = funnelData[step.event] || 0;
                    const firstCount = Math.max(funnelData[funnel.steps[0].event] || 1, 1);
                    const prevCount = i > 0 ? Math.max(funnelData[funnel.steps[i - 1].event] || 1, 1) : firstCount;
                    const pctFromStart = Math.round((count / firstCount) * 100);
                    const dropoff = i > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;

                    return (
                      <div key={step.event}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[8px] h-4">{i + 1}</Badge>
                            <span className="text-[10px] font-medium">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold">{count.toLocaleString()}</span>
                            {i > 0 && (
                              <span className="text-[9px] text-destructive font-mono">-{dropoff}%</span>
                            )}
                            <span className="text-[9px] text-muted-foreground font-mono">{pctFromStart}%</span>
                          </div>
                        </div>
                        <div className="relative h-6 bg-muted rounded overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-primary/20 rounded transition-all"
                            style={{ width: `${pctFromStart}%` }}
                          />
                          <div
                            className="absolute inset-y-0 left-0 bg-primary rounded transition-all"
                            style={{ width: `${pctFromStart}%`, maxWidth: "100%" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}
