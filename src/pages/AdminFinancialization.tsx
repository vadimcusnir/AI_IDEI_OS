import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coins, TrendingUp, Award, Brain, Shield, BarChart3,
  Crown, Target, Zap, Globe, Lock, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFinancialization() {
  // Tokenization stats
  const { data: tokenStats } = useQuery({
    queryKey: ["fin-tokens"],
    queryFn: async () => {
      const { data: tokens } = await supabase
        .from("asset_tokens" as any).select("total_units, units_sold, price_per_unit, total_revenue, status");
      const active = (tokens || []).filter((t: any) => t.status === "active");
      const totalUnits = active.reduce((s: number, t: any) => s + (t.total_units || 0), 0);
      const soldUnits = active.reduce((s: number, t: any) => s + (t.units_sold || 0), 0);
      const totalRevenue = active.reduce((s: number, t: any) => s + Number(t.total_revenue || 0), 0);
      return { count: active.length, totalUnits, soldUnits, totalRevenue };
    },
  });

  // Performance market stats
  const { data: perfStats } = useQuery({
    queryKey: ["fin-perf"],
    queryFn: async () => {
      const { data } = await supabase
        .from("performance_listings" as any).select("revenue_generated, conversion_rate, verified, total_sales, status");
      const active = (data || []).filter((p: any) => p.status === "active");
      const verified = active.filter((p: any) => p.verified);
      const totalSales = active.reduce((s: number, p: any) => s + (p.total_sales || 0), 0);
      const avgConversion = active.length > 0
        ? active.reduce((s: number, p: any) => s + Number(p.conversion_rate || 0), 0) / active.length : 0;
      return { total: active.length, verified: verified.length, totalSales, avgConversion: Math.round(avgConversion * 100) / 100 };
    },
  });

  // Certifications stats
  const { data: certStats } = useQuery({
    queryKey: ["fin-certs"],
    queryFn: async () => {
      const { data: certs } = await supabase
        .from("certifications" as any).select("cert_key, name, level");
      const { count: awarded } = await supabase
        .from("user_certifications" as any).select("id", { count: "exact", head: true });
      return { available: (certs || []).length, awarded: awarded || 0, certs: certs || [] };
    },
  });

  // Intelligence reports
  const { data: intelStats } = useQuery({
    queryKey: ["fin-intel"],
    queryFn: async () => {
      const { data } = await supabase
        .from("intelligence_reports" as any).select("report_type, cost_neurons, created_at");
      const totalCost = (data || []).reduce((s: number, r: any) => s + (r.cost_neurons || 0), 0);
      const byType: Record<string, number> = {};
      for (const r of (data || []) as any[]) {
        byType[r.report_type] = (byType[r.report_type] || 0) + 1;
      }
      return { total: (data || []).length, totalCost, byType };
    },
  });

  // Data products
  const { data: dataStats } = useQuery({
    queryKey: ["fin-data-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("data_products" as any).select("product_type, price_neurons, total_sales, is_published");
      const published = (data || []).filter((d: any) => d.is_published);
      const totalSales = published.reduce((s: number, d: any) => s + (d.total_sales || 0), 0);
      const totalRevenue = published.reduce((s: number, d: any) => s + (d.total_sales || 0) * (d.price_neurons || 0), 0);
      return { total: (data || []).length, published: published.length, totalSales, totalRevenue };
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <SEOHead title="Financialization Layer" description="Asset tokenization, performance market, intelligence extraction" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Coins className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Financialization Layer</h1>
          <p className="text-xs text-muted-foreground">Tokenization · Performance Market · Intelligence · Certification · Data Products</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Tokenized Assets", value: tokenStats?.count ?? "—", icon: Coins, color: "text-semantic-amber" },
          { label: "Units Sold", value: tokenStats?.soldUnits ?? "—", icon: TrendingUp, color: "text-semantic-emerald" },
          { label: "Perf. Listings", value: perfStats?.total ?? "—", icon: Target, color: "text-semantic-blue" },
          { label: "Certifications", value: certStats?.awarded ?? "—", icon: Award, color: "text-semantic-purple" },
          { label: "Intel Reports", value: intelStats?.total ?? "—", icon: Brain, color: "text-primary" },
          { label: "Data Products", value: dataStats?.published ?? "—", icon: Globe, color: "text-semantic-cyan" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
              <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="tokenization" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="tokenization" className="text-xs">Tokenization</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
          <TabsTrigger value="intelligence" className="text-xs">Intelligence</TabsTrigger>
          <TabsTrigger value="certification" className="text-xs">Certification</TabsTrigger>
          <TabsTrigger value="data" className="text-xs">Data Products</TabsTrigger>
        </TabsList>

        {/* Tokenization */}
        <TabsContent value="tokenization">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-amber-500" /> Asset Exchange
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-micro text-muted-foreground">Total Units</span>
                    <p className="text-lg font-bold font-mono text-foreground">{tokenStats?.totalUnits?.toLocaleString() ?? 0}</p>
                  </div>
                  <div>
                    <span className="text-micro text-muted-foreground">Units Sold</span>
                    <p className="text-lg font-bold font-mono text-foreground">{tokenStats?.soldUnits?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Sell-Through Rate</span>
                  <Progress
                    value={tokenStats && tokenStats.totalUnits > 0 ? (tokenStats.soldUnits / tokenStats.totalUnits) * 100 : 0}
                    className="h-2 mt-1"
                  />
                </div>
                <div className="pt-2 border-t border-border">
                  <span className="text-micro text-muted-foreground">Total Revenue</span>
                  <p className="text-xl font-bold font-mono text-primary">{(tokenStats?.totalRevenue || 0).toLocaleString()}N</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="font-semibold text-foreground mb-1">Asset → Token Units</p>
                  <p className="text-muted-foreground">Asset produce valoare → tokenizat în 100 unități → userii cumpără share → lichiditate instant</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="font-semibold text-foreground mb-1">Revenue Share</p>
                  <p className="text-muted-foreground">Holders primesc % din veniturile generate de asset-ul tokenizat</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5">
                  <p className="font-semibold text-primary">Marketplace → Exchange</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Market */}
        <TabsContent value="performance">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-semantic-blue" /> Performance Market
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <span className="text-micro text-muted-foreground">Active Listings</span>
                  <p className="text-lg font-bold text-foreground">{perfStats?.total ?? 0}</p>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Verified</span>
                  <p className="text-lg font-bold text-semantic-emerald">{perfStats?.verified ?? 0}</p>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Total Sales</span>
                  <p className="text-lg font-bold text-foreground">{perfStats?.totalSales ?? 0}</p>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Avg Conversion</span>
                  <p className="text-lg font-bold text-foreground">{perfStats?.avgConversion ?? 0}%</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-xs">
                <p className="font-semibold text-foreground">Nu vinzi conținut — vinzi PERFORMANȚĂ</p>
                <p className="text-muted-foreground mt-1">"Funnel care a generat 12,000$" · "Prompt cu 18% conversion rate"</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intelligence */}
        <TabsContent value="intelligence">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-primary" /> Intelligence Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-micro text-muted-foreground">Total Reports</span>
                    <p className="text-lg font-bold text-foreground">{intelStats?.total ?? 0}</p>
                  </div>
                  <div>
                    <span className="text-micro text-muted-foreground">NEURONS Consumed</span>
                    <p className="text-lg font-bold font-mono text-foreground">{(intelStats?.totalCost || 0).toLocaleString()}N</p>
                  </div>
                </div>
                {intelStats?.byType && Object.entries(intelStats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{type.replace(/_/g, " ")}</span>
                    <Badge variant="outline" className="text-nano font-mono">{count as number}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" /> Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  { label: "Competitor Analysis", desc: "Strategii de atac, vulnerabilități, diferențiere" },
                  { label: "Market Intelligence", desc: "Trends, oportunități, gap-uri de piață" },
                  { label: "Strategic Positioning", desc: "Axe de poziționare, recomandări" },
                ].map(cap => (
                  <div key={cap.label} className="p-2.5 rounded-lg bg-muted/30">
                    <p className="font-semibold text-foreground">{cap.label}</p>
                    <p className="text-micro text-muted-foreground">{cap.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Certification */}
        <TabsContent value="certification">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-semantic-purple" /> Certification System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <span className="text-micro text-muted-foreground">Available Certs</span>
                  <p className="text-lg font-bold text-foreground">{certStats?.available ?? 0}</p>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Awarded</span>
                  <p className="text-lg font-bold text-primary">{certStats?.awarded ?? 0}</p>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Conversion</span>
                  <p className="text-lg font-bold text-foreground">
                    {certStats && certStats.available > 0 ? `${Math.round((certStats.awarded / Math.max(1, certStats.available)) * 100)}%` : "—"}
                  </p>
                </div>
              </div>
              {(certStats?.certs || []).map((cert: any) => (
                <div key={cert.cert_key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{cert.name}</p>
                    <p className="text-micro text-muted-foreground capitalize">{cert.level}</p>
                  </div>
                  <Badge variant="outline" className="text-nano">{cert.cert_key}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Products */}
        <TabsContent value="data">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-cyan-500" /> Data Monetization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <span className="text-micro text-muted-foreground">Products</span>
                  <p className="text-lg font-bold text-foreground">{dataStats?.total ?? 0}</p>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Published</span>
                  <p className="text-lg font-bold text-emerald-500">{dataStats?.published ?? 0}</p>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Total Sales</span>
                  <p className="text-lg font-bold text-foreground">{dataStats?.totalSales ?? 0}</p>
                </div>
                <div>
                  <span className="text-micro text-muted-foreground">Revenue</span>
                  <p className="text-lg font-bold font-mono text-primary">{(dataStats?.totalRevenue || 0).toLocaleString()}N</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-xs">
                <p className="font-semibold text-foreground">Data Products</p>
                <p className="text-muted-foreground mt-1">Market trends · High-performing patterns · Conversion insights · Aggregated intelligence</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Evolution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">System Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {["PLATFORM", "→", "OS", "→", "ECONOMY", "→", "PROTOCOL", "→", "MARKET", "→", "CAPITAL SYSTEM"].map((step, i) => (
              step === "→" ? (
                <span key={i} className="text-muted-foreground">→</span>
              ) : (
                <Badge key={i} variant={i >= 8 ? "default" : "secondary"} className="text-micro font-mono">
                  {step}
                </Badge>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
