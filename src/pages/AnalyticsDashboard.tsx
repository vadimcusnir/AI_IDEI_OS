import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart3, Users, Eye, TrendingUp, Loader2,
  Activity, Globe, MousePointerClick,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalyticsSummary {
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  top_events: { event_name: string; count: number }[] | null;
  daily_breakdown: { day: string; events: number; users: number }[] | null;
  top_pages: { page_path: string; views: number }[] | null;
}

export default function AnalyticsDashboard() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    supabase.rpc("analytics_summary", { _days: days })
      .then(({ data: res }) => {
        if (res) setData(res as unknown as AnalyticsSummary);
        setLoading(false);
      });
  }, [isAdmin, days]);

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

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Analytics — AI-IDEI" description="Platform analytics dashboard with event tracking and user metrics." />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold tracking-tight">Analytics</h1>
              <p className="text-[10px] text-muted-foreground">Platform-wide event tracking and user metrics</p>
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

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Events */}
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

            {/* Top Pages */}
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

          {/* Daily Breakdown */}
          {data.daily_breakdown && data.daily_breakdown.length > 0 && (
            <div className="mt-6">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Daily Activity
              </h2>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="space-y-1">
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
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
