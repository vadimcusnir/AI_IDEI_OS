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
import { useTranslation } from "react-i18next";

interface AnalyticsSummary {
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  top_events: { event_name: string; count: number }[] | null;
  daily_breakdown: { day: string; events: number; users: number }[] | null;
  top_pages: { page_path: string; views: number }[] | null;
}

interface CohortRow {
  cohort: string;
  total: number;
  retained: number[];
}

function buildCohorts(daily: { day: string; users: number }[] | null): CohortRow[] {
  if (!daily || daily.length < 7) return [];
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

export default function AnalyticsDashboard() {
  const { t } = useTranslation("pages");
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const [funnelData, setFunnelData] = useState<Record<string, number>>({});
  const [funnelIdx, setFunnelIdx] = useState(0);

  const FUNNELS = [
    {
      name: t("analytics.funnel_onboarding"),
      steps: [
        { label: t("analytics.step_page_view"), event: "page_view" },
        { label: t("analytics.step_neuron_created"), event: "neuron_created" },
        { label: t("analytics.step_service_started"), event: "service_started" },
        { label: t("analytics.step_service_completed"), event: "service_completed" },
      ],
    },
    {
      name: t("analytics.funnel_pipeline"),
      steps: [
        { label: t("analytics.step_episode_uploaded"), event: "episode_uploaded" },
        { label: t("analytics.step_transcript_done"), event: "transcript_completed" },
        { label: t("analytics.step_extraction_started"), event: "extraction_started" },
        { label: t("analytics.step_extraction_done"), event: "extraction_completed" },
      ],
    },
  ];

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    supabase.rpc("analytics_summary", { _days: days })
      .then(({ data: res }) => {
        if (res) setData(res as unknown as AnalyticsSummary);
        setLoading(false);
      });
  }, [isAdmin, days]);

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
        <p className="text-sm text-muted-foreground">{t("analytics.no_data")}</p>
      </div>
    );
  }

  const maxEventCount = Math.max(...(data.top_events || []).map(e => e.count), 1);
  const maxPageViews = Math.max(...(data.top_pages || []).map(p => p.views), 1);
  const funnel = FUNNELS[funnelIdx];

  const statCards = [
    { label: t("analytics.total_events"), value: data.total_events, icon: Activity },
    { label: t("analytics.unique_users"), value: data.unique_users, icon: Users },
    { label: t("analytics.sessions"), value: data.unique_sessions, icon: Globe },
  ];

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title={t("analytics.seo_title")} description={t("analytics.seo_desc")} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t("analytics.title")}</h1>
              <p className="text-micro text-muted-foreground">{t("analytics.subtitle")}</p>
            </div>
            <div className="ml-auto flex gap-1">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-micro font-medium transition-colors",
                    days === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {statCards.map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-lg font-bold font-mono">{(s.value || 0).toLocaleString()}</p>
                <p className="text-nano text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview" className="text-xs gap-1"><MousePointerClick className="h-3 w-3" />{t("analytics.overview")}</TabsTrigger>
              <TabsTrigger value="cohort" className="text-xs gap-1"><Layers className="h-3 w-3" />{t("analytics.cohorts")}</TabsTrigger>
              <TabsTrigger value="funnel" className="text-xs gap-1"><Filter className="h-3 w-3" />{t("analytics.funnels")}</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <MousePointerClick className="h-3 w-3" /> {t("analytics.top_events")}
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                    {(data.top_events || []).map(ev => (
                      <div key={ev.event_name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-micro font-mono truncate">{ev.event_name}</span>
                          <span className="text-micro font-bold text-primary">{ev.count.toLocaleString()}</span>
                        </div>
                        <Progress value={(ev.count / maxEventCount) * 100} className="h-1.5" />
                      </div>
                    ))}
                    {(!data.top_events || data.top_events.length === 0) && (
                      <p className="text-micro text-muted-foreground text-center py-4">{t("analytics.no_events")}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Eye className="h-3 w-3" /> {t("analytics.top_pages")}
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                    {(data.top_pages || []).map(pg => (
                      <div key={pg.page_path}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-micro font-mono truncate">{pg.page_path}</span>
                          <span className="text-micro font-bold text-primary">{pg.views.toLocaleString()}</span>
                        </div>
                        <Progress value={(pg.views / maxPageViews) * 100} className="h-1.5" />
                      </div>
                    ))}
                    {(!data.top_pages || data.top_pages.length === 0) && (
                      <p className="text-micro text-muted-foreground text-center py-4">{t("analytics.no_pages")}</p>
                    )}
                  </div>
                </div>
              </div>

              {data.daily_breakdown && data.daily_breakdown.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" /> {t("analytics.daily_activity")}
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-1">
                    {data.daily_breakdown.slice(0, 14).map(d => {
                      const maxEvents = Math.max(...data.daily_breakdown!.map(x => x.events), 1);
                      return (
                        <div key={d.day} className="flex items-center gap-3">
                          <span className="text-nano font-mono text-muted-foreground w-20 shrink-0">{d.day}</span>
                          <Progress value={(d.events / maxEvents) * 100} className="h-1.5 flex-1" />
                          <span className="text-nano font-mono w-16 text-right shrink-0">{d.events} ev</span>
                          <span className="text-nano font-mono text-muted-foreground w-12 text-right shrink-0">{d.users} u</span>
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
                  <Layers className="h-3.5 w-3.5 text-primary" /> {t("analytics.weekly_retention")}
                </h2>
                {cohorts.length === 0 ? (
                  <p className="text-micro text-muted-foreground text-center py-8">{t("analytics.cohort_min_data")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-micro">
                      <thead>
                        <tr>
                          <th className="text-left font-medium text-muted-foreground pb-2 pr-3">{t("analytics.cohort_label")}</th>
                          <th className="text-right font-medium text-muted-foreground pb-2 pr-3">{t("analytics.users_label")}</th>
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
                                    "inline-block px-1.5 py-0.5 rounded text-nano font-bold",
                                    pct >= 80 ? "bg-primary/20 text-primary" :
                                    pct >= 50 ? "bg-accent text-accent-foreground" :
                                    pct >= 20 ? "bg-muted text-muted-foreground" :
                                    "bg-destructive/20 text-destructive"
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
                  <h2 className="text-xs font-semibold">{t("analytics.funnel_viz")}</h2>
                  <div className="ml-auto flex gap-1">
                    {FUNNELS.map((f, i) => (
                      <button
                        key={f.name}
                        onClick={() => setFunnelIdx(i)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-nano font-medium transition-colors",
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
                            <Badge variant="outline" className="text-nano h-4">{i + 1}</Badge>
                            <span className="text-micro font-medium">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-micro font-mono font-bold">{count.toLocaleString()}</span>
                            {i > 0 && (
                              <span className="text-nano text-destructive font-mono">-{dropoff}%</span>
                            )}
                            <span className="text-nano text-muted-foreground font-mono">{pctFromStart}%</span>
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
