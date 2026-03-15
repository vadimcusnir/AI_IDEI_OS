import { useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Loader2, Sparkles, BarChart3, Search, X, Coins, Clock,
  ArrowRight, Zap, FileText, Brain, Target, Layers,
  TrendingUp, LayoutGrid, List, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  service_key: string;
  name: string;
  description: string;
  service_class: string;
  category: string;
  credits_cost: number;
  icon: string;
  is_active: boolean;
  access_tier: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  extraction: { label: "Extraction", icon: Brain, color: "text-purple-500" },
  analysis: { label: "Analysis", icon: BarChart3, color: "text-blue-500" },
  content: { label: "Content", icon: FileText, color: "text-emerald-500" },
  strategy: { label: "Strategy", icon: Target, color: "text-amber-500" },
  production: { label: "Production", icon: Layers, color: "text-rose-500" },
  orchestration: { label: "Orchestration", icon: Zap, color: "text-primary" },
  document: { label: "Document", icon: FileText, color: "text-sky-500" },
};

const CLASS_BADGE: Record<string, { label: string; className: string }> = {
  A: { label: "Fast", className: "bg-status-validated/15 text-status-validated" },
  B: { label: "Deep", className: "bg-ai-accent/15 text-ai-accent" },
  C: { label: "Full", className: "bg-primary/15 text-primary" },
  S: { label: "Sync", className: "bg-status-validated/15 text-status-validated" },
};

const COST_RANGES = [
  { label: "All", min: 0, max: Infinity },
  { label: "≤40", min: 0, max: 40 },
  { label: "41–60", min: 41, max: 60 },
  { label: "61+", min: 61, max: Infinity },
];

type ViewMode = "grid" | "list";
type SortBy = "name" | "cost-asc" | "cost-desc" | "category";

export default function Services() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [costRange, setCostRange] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (data) setServices(data as Service[]);
      if (error) toast.error("Failed to load services");
      setLoading(false);
    })();
  }, [user, authLoading]);

  // Derive categories from data
  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    services.forEach(s => cats.set(s.category, (cats.get(s.category) || 0) + 1));
    return Array.from(cats.entries()).sort((a, b) => b[1] - a[1]);
  }, [services]);

  const filtered = useMemo(() => {
    let list = services;

    if (activeCategory) list = list.filter(s => s.category === activeCategory);

    const range = COST_RANGES[costRange];
    if (range && range.max !== Infinity) {
      list = list.filter(s => s.credits_cost >= range.min && s.credits_cost <= range.max);
    } else if (range && range.min > 0) {
      list = list.filter(s => s.credits_cost >= range.min);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.service_key.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "cost-asc": list = [...list].sort((a, b) => a.credits_cost - b.credits_cost); break;
      case "cost-desc": list = [...list].sort((a, b) => b.credits_cost - a.credits_cost); break;
      case "category": list = [...list].sort((a, b) => a.category.localeCompare(b.category)); break;
      default: list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [services, activeCategory, costRange, search, sortBy]);

  // Stats
  const avgCost = services.length ? Math.round(services.reduce((s, x) => s + x.credits_cost, 0) / services.length) : 0;

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="flex-1 overflow-y-auto">
      <SEOHead
        title="AI Services — AI-IDEI"
        description="120+ AI-powered knowledge services: extraction, analysis, content generation. Transform expertise into structured intellectual assets."
      />
      <BreadcrumbJsonLd items={[
        { name: "Home", url: "https://ai-idei.com" },
        { name: "Services", url: "https://ai-idei.com/services" },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "AI-IDEI Services",
        description: "AI-powered knowledge extraction and content generation services",
        numberOfItems: services.length,
        itemListElement: services.slice(0, 10).map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Service",
            name: s.name,
            description: s.description,
            provider: { "@type": "Organization", name: "AI-IDEI" },
          },
        })),
      }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-serif font-medium tracking-tight">AI Services</h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {services.length} available
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Transform any content into professional deliverables. Each service uses specialized AI to extract, analyze, and produce structured outputs.
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Services", value: services.length, icon: Sparkles },
            { label: "Categories", value: categories.length, icon: Layers },
            { label: "Avg. Cost", value: `${avgCost}`, suffix: "N", icon: Coins },
            { label: "New this month", value: "25", icon: TrendingUp },
          ].map((kpi, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold font-mono">{kpi.value}</span>
                  {kpi.suffix && <span className="text-[10px] text-muted-foreground">{kpi.suffix}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Controls bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services..."
              className="pl-9 pr-8 h-10 text-sm bg-card"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {(activeCategory || costRange > 0) && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full h-4 w-4 text-[9px] flex items-center justify-center">
                  {(activeCategory ? 1 : 0) + (costRange > 0 ? 1 : 0)}
                </span>
              )}
            </Button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="h-8 rounded-md border border-border bg-card px-2 text-xs outline-none"
            >
              <option value="name">A → Z</option>
              <option value="cost-asc">Cost ↑</option>
              <option value="cost-desc">Cost ↓</option>
              <option value="category">Category</option>
            </select>
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                {/* Category filter */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        !activeCategory
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      All ({services.length})
                    </button>
                    {categories.map(([cat, count]) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                            activeCategory === cat
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {cfg && <cfg.icon className="h-3 w-3" />}
                          {cfg?.label || cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cost filter */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Credit Cost</p>
                  <div className="flex gap-1.5">
                    {COST_RANGES.map((range, i) => (
                      <button
                        key={i}
                        onClick={() => setCostRange(costRange === i ? 0 : i)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium font-mono transition-all",
                          costRange === i
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear filters */}
                {(activeCategory || costRange > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => { setActiveCategory(null); setCostRange(0); }}
                  >
                    <X className="h-3 w-3 mr-1" /> Clear all filters
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted-foreground">
            {filtered.length === services.length
              ? `Showing all ${filtered.length} services`
              : `${filtered.length} of ${services.length} services`}
          </p>
        </div>

        {/* Services grid/list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground mb-1">No services match your filters</p>
            <p className="text-xs text-muted-foreground/60 mb-4">Try adjusting your search or category selection</p>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSearch(""); setActiveCategory(null); setCostRange(0); }}>
              Clear all filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((service, i) => {
              const catCfg = CATEGORY_CONFIG[service.category];
              const clsBadge = CLASS_BADGE[service.service_class] || CLASS_BADGE.A;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => navigate(`/run/${service.service_key}`)}
                  className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Category dot */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {catCfg && <catCfg.icon className={cn("h-4 w-4", catCfg.color)} />}
                      <span className={cn("text-[9px] font-semibold uppercase tracking-wider", catCfg?.color || "text-muted-foreground")}>
                        {catCfg?.label || service.category}
                      </span>
                    </div>
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md", clsBadge.className)}>
                      {clsBadge.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {service.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
                    {service.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3 w-3 text-ai-accent" />
                      <span className="text-xs font-bold font-mono">{service.credits_cost}</span>
                      <span className="text-[9px] text-muted-foreground">NEURONS</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-1.5">
            {filtered.map((service, i) => {
              const catCfg = CATEGORY_CONFIG[service.category];
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.01, 0.2) }}
                  onClick={() => navigate(`/run/${service.service_key}`)}
                  className="group flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {catCfg && <catCfg.icon className={cn("h-3.5 w-3.5", catCfg.color)} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{service.name}</span>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{service.description}</p>
                  </div>
                  <span className="text-[9px] uppercase text-muted-foreground/60 hidden sm:block w-20 text-right">
                    {catCfg?.label || service.category}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Coins className="h-3 w-3 text-ai-accent" />
                    <span className="text-xs font-bold font-mono w-8 text-right">{service.credits_cost}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary shrink-0" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
