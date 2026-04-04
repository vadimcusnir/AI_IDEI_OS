import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Globe, TrendingUp, BarChart3, Target, Rocket, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type DomAction = "capture" | "distribute" | "feedback" | "autoscale";

export default function AdminDomination() {
  const qc = useQueryClient();
  const [running, setRunning] = useState<DomAction | null>(null);

  // ── Stats queries ──
  const { data: signals } = useQuery({
    queryKey: ["dom-signals"],
    queryFn: async () => {
      const { count } = await supabase.from("demand_signals" as any).select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: pages } = useQuery({
    queryKey: ["dom-pages"],
    queryFn: async () => {
      const { data } = await supabase.from("generated_landing_pages" as any).select("status");
      const published = (data || []).filter((p: any) => p.status === "published").length;
      return { total: data?.length || 0, published };
    },
  });

  const { data: distEvents } = useQuery({
    queryKey: ["dom-distribution"],
    queryFn: async () => {
      const { count } = await supabase.from("distribution_events" as any).select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["dom-metrics"],
    queryFn: async () => {
      const { data } = await supabase.from("domination_metrics" as any)
        .select("entity_type, revenue, action_taken, quality_score")
        .gte("metric_date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]);
      const boosted = (data || []).filter((m: any) => m.action_taken === "boost").length;
      const killed = (data || []).filter((m: any) => m.action_taken === "kill" || m.action_taken === "demote").length;
      const totalRevenue = (data || []).reduce((s: number, m: any) => s + (m.revenue || 0), 0);
      return { boosted, killed, totalRevenue, total: data?.length || 0 };
    },
  });

  const runAction = useMutation({
    mutationFn: async (action: DomAction) => {
      setRunning(action);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domination-engine`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      return resp.json();
    },
    onSuccess: (data, action) => {
      toast.success(`${action.toUpperCase()} completed`, { description: JSON.stringify(data) });
      qc.invalidateQueries({ queryKey: ["dom-signals"] });
      qc.invalidateQueries({ queryKey: ["dom-pages"] });
      qc.invalidateQueries({ queryKey: ["dom-distribution"] });
      qc.invalidateQueries({ queryKey: ["dom-metrics"] });
    },
    onError: (err) => toast.error("Engine error", { description: String(err) }),
    onSettled: () => setRunning(null),
  });

  const actions: { key: DomAction; label: string; icon: any; desc: string; color: string }[] = [
    { key: "capture", label: "Demand Capture", icon: Target, desc: "Detect intent → generate pages", color: "text-semantic-emerald" },
    { key: "distribute", label: "Distribute Assets", icon: Globe, desc: "Push assets across channels", color: "text-semantic-blue" },
    { key: "feedback", label: "Feedback Loop", icon: RefreshCw, desc: "Boost top → kill underperformers", color: "text-semantic-amber" },
    { key: "autoscale", label: "Auto-Scale", icon: Rocket, desc: "Expand pages & services", color: "text-semantic-purple" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Market Domination Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Demand capture · Asset distribution · Feedback loop · Auto-scale
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> Demand Signals</div>
            <div className="text-2xl font-bold mt-1">{signals ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Landing Pages</div>
            <div className="text-2xl font-bold mt-1">{pages?.total ?? "—"}</div>
            <div className="text-xs text-semantic-emerald">{pages?.published ?? 0} published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Distribution Events</div>
            <div className="text-2xl font-bold mt-1">{distEvents ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Weekly Revenue</div>
            <div className="text-2xl font-bold mt-1">{metrics ? `${metrics.totalRevenue}N` : "—"}</div>
            <div className="text-xs">
              <span className="text-semantic-emerald">{metrics?.boosted ?? 0} boosted</span>
              {" · "}
              <span className="text-destructive">{metrics?.killed ?? 0} killed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        {actions.map(({ key, label, icon: Icon, desc, color }) => (
          <Card key={key} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => runAction.mutate(key)}
                disabled={running !== null}
                size="sm"
                variant={key === "capture" ? "default" : "outline"}
              >
                {running === key ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {running === key ? "Running..." : `Execute ${label}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">System Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {["INPUT", "CONTENT", "NEURONS", "SERVICES", "EXECUTION", "ASSETS", "MARKETPLACE", "REVENUE", "DATA", "OPTIMIZATION", "DOMINATION"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <Badge variant={i >= 9 ? "default" : "secondary"} className="text-micro font-mono">
                  {step}
                </Badge>
                {i < 10 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Moat Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Defensibility Moats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">DATA MOAT</div>
              <div className="text-lg font-bold text-semantic-emerald">Active</div>
              <div className="text-micro text-muted-foreground">neurons + executions + outcomes</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">ECONOMIC MOAT</div>
              <div className="text-lg font-bold text-semantic-blue">Active</div>
              <div className="text-micro text-muted-foreground">user assets + marketplace income</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">BEHAVIORAL MOAT</div>
              <div className="text-lg font-bold text-semantic-purple">Active</div>
              <div className="text-micro text-muted-foreground">user dependency on outputs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
