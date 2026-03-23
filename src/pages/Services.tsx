import { useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { ServiceRunHistory } from "@/components/services/ServiceRunHistory";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Loader2, Sparkles, BarChart3, Search, X, Coins, Clock,
  ArrowRight, Zap, FileText, Brain, Target, Layers,
  TrendingUp, LayoutGrid, List, SlidersHorizontal, AlertTriangle,
  Users, Workflow, Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ControlledSection } from "@/components/ControlledSection";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import { PremiumPaywall, tierSatisfied } from "@/components/premium/PremiumPaywall";
import { useTranslation } from "react-i18next";
import { PipelinesHub } from "@/components/services/PipelinesHub";
import { FlowTip } from "@/components/onboarding/FlowTip";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceFilters } from "@/components/services/ServiceFilters";


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

const CLASS_BADGE: Record<string, { label: string; description: string; className: string }> = {
  A: { label: "Fast", description: "Quick single-pass AI extraction. ~30s execution.", className: "bg-status-validated/15 text-status-validated" },
  B: { label: "Deep", description: "Multi-pass deep analysis with cross-referencing. ~2min.", className: "bg-ai-accent/15 text-ai-accent" },
  C: { label: "Full", description: "Complete pipeline with all extraction levels. ~5min.", className: "bg-primary/15 text-primary" },
  S: { label: "Sync", description: "Real-time synchronized processing across services.", className: "bg-status-validated/15 text-status-validated" },
};

const COST_RANGES = [
  { label: "All", min: 0, max: Infinity },
  { label: "≤40", min: 0, max: 40 },
  { label: "41–60", min: 41, max: 60 },
  { label: "61+", min: 61, max: Infinity },
];

type ViewMode = "grid" | "list";
type SortBy = "name" | "cost-asc" | "cost-desc" | "category";

/* ── Layer tab definitions ── */
const SERVICE_LAYERS = [
  { key: "all", labelKey: "services.tab_all", icon: Sparkles, description: "Browse all available AI services" },
  { key: "quick", labelKey: "services.tab_quick", icon: Zap, description: "Fast, low-cost single tasks" },
  { key: "research", labelKey: "services.tab_research", icon: BarChart3, description: "Market research & deep analysis" },
  { key: "pipelines", labelKey: "services.tab_pipelines", icon: Workflow, description: "Full automated pipelines & engines" },
  { key: "history", labelKey: "services.tab_history", icon: Clock, description: "Execution history" },
] as const;

type LayerKey = typeof SERVICE_LAYERS[number]["key"];

/* ── Category mapping for layers ── */
const LAYER_CATEGORIES: Record<string, string[]> = {
  quick: ["extraction", "content", "document"],
  research: ["analysis", "strategy"],
};

const QUICK_COST_MAX = 45;

export default function Services() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { balance, loading: balanceLoading } = useCreditBalance();
  const { tier: userTier } = useUserTier();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [costRange, setCostRange] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [showFilters, setShowFilters] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallService, setPaywallService] = useState<{ name: string; tier: string } | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerKey>("all");

  const handleServiceClick = (service: Service) => {
    if (!user) { navigate("/auth"); return; }
    const requiredTier = service.access_tier || "free";
    if (!tierSatisfied(userTier, requiredTier)) {
      setPaywallService({ name: service.name, tier: requiredTier });
      setPaywallOpen(true);
      return;
    }
    navigate(`/run/${service.service_key}`);
  };



  useEffect(() => {
    if (authLoading) return;
    (async () => {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (data) setServices(data as Service[]);
      if (error && user) toast.error(t("services.failed_load"));
      setLoading(false);
    })();
  }, [user, authLoading]);

  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    services.forEach(s => cats.set(s.category, (cats.get(s.category) || 0) + 1));
    return Array.from(cats.entries()).sort((a, b) => b[1] - a[1]);
  }, [services]);

  /* ── Layer-aware filtering ── */
  const layerServices = useMemo(() => {
    if (activeLayer === "all" || activeLayer === "history" || activeLayer === "pipelines") return services;
    const cats = LAYER_CATEGORIES[activeLayer];
    if (!cats) return services;
    let list = services.filter(s => cats.includes(s.category));
    if (activeLayer === "quick") list = list.filter(s => s.credits_cost <= QUICK_COST_MAX);
    return list;
  }, [services, activeLayer]);

  const filtered = useMemo(() => {
    let list = layerServices;
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
    switch (sortBy) {
      case "cost-asc": list = [...list].sort((a, b) => a.credits_cost - b.credits_cost); break;
      case "cost-desc": list = [...list].sort((a, b) => b.credits_cost - a.credits_cost); break;
      case "category": list = [...list].sort((a, b) => a.category.localeCompare(b.category)); break;
      default: list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [layerServices, activeCategory, costRange, search, sortBy]);

  const layerCounts = useMemo(() => {
    const quickCats = LAYER_CATEGORIES.quick;
    const researchCats = LAYER_CATEGORIES.research;
    return {
      all: services.length,
      quick: services.filter(s => quickCats.includes(s.category) && s.credits_cost <= QUICK_COST_MAX).length,
      research: services.filter(s => researchCats.includes(s.category)).length,
      avatar: null,
      pipelines: null,
      history: null,
    };
  }, [services]);

  const avgCost = services.length ? Math.round(services.reduce((s, x) => s + x.credits_cost, 0) / services.length) : 0;
  const showServiceCatalog = activeLayer === "all" || activeLayer === "quick" || activeLayer === "research";

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isVisitor = !user;

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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-medium tracking-tight">{t("services.title")}</h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {t("services.available", { count: services.length })}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            {t("services.description")}
          </p>
        </div>

        {/* Visitor signup CTA */}
        {isVisitor && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-4 py-4 rounded-xl border border-primary/30 bg-primary/5"
          >
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t("services.visitor_cta_title", { defaultValue: "Start free with 500 NEURONS" })}</p>
              <p className="text-xs text-muted-foreground">
                {t("services.visitor_cta_desc", { defaultValue: "Sign up to run any AI service. Your first 500 credits are on us." })}
              </p>
            </div>
            <Button size="sm" className="shrink-0 text-xs gap-1.5" onClick={() => navigate("/auth")}>
              {t("services.visitor_cta_button", { defaultValue: "Get Started Free" })}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </motion.div>
        )}

        {/* Low balance upsell */}
        {!balanceLoading && balance < 100 && user && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/20 bg-destructive/5"
          >
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">
                {t("services.low_balance")}: <span className="font-mono font-bold">{balance}</span> NEURONS
              </p>
              <p className="text-[10px] text-muted-foreground">{t("services.low_balance_hint")}</p>
            </div>
            <Button size="sm" className="shrink-0 text-xs gap-1" onClick={() => navigate("/credits")}>
              <Coins className="h-3 w-3" /> {t("services.topup")}
            </Button>
          </motion.div>
        )}

        {/* ═══════ LAYER TABS ═══════ */}
        <div className="mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-px border-b border-border scrollbar-none">
            {SERVICE_LAYERS.map(layer => {
              const Icon = layer.icon;
              const count = layerCounts[layer.key];
              const isActive = activeLayer === layer.key;
              // Hide auth-only tabs for visitors
              if (!user && (layer.key === "pipelines" || layer.key === "history")) return null;
              return (
                <button
                  key={layer.key}
                  onClick={() => { setActiveLayer(layer.key); setActiveCategory(null); setCostRange(0); setSearch(""); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px whitespace-nowrap shrink-0",
                    isActive
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                  {t(layer.labelKey, { defaultValue: layer.key.charAt(0).toUpperCase() + layer.key.slice(1) })}
                  {count !== null && (
                    <span className={cn(
                      "text-[9px] font-mono rounded-full px-1.5 py-0.5 ml-0.5",
                      isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Layer description */}
          {activeLayer !== "all" && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5"
            >
              {SERVICE_LAYERS.find(l => l.key === activeLayer)?.description}
            </motion.p>
          )}
        </div>

        {/* Flow guidance */}
        <FlowTip
          tipId="services-intro"
          variant="info"
          title="How AI Services work"
          description="Each service uses your neurons + AI to generate professional deliverables (articles, strategies, social posts). Pick a service, select neurons as input, and let AI do the rest. One service can produce 50+ outputs."
          className="mb-4"
        />

        {/* ═══════ CATALOG LAYERS (All / Quick / Research) ═══════ */}
        {showServiceCatalog && (
          <>
            {/* KPI strip */}
            <ControlledSection elementId="services.kpi_strip">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: t("services.kpi_services"), value: layerServices.length, icon: Sparkles },
                  { label: t("services.kpi_categories"), value: categories.length, icon: Layers },
                  { label: t("services.kpi_avg_cost"), value: `${avgCost}`, suffix: "N", icon: Coins },
                  { label: t("services.kpi_new_month"), value: "25", icon: TrendingUp },
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
            </ControlledSection>

            {/* Search + Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("services.search_placeholder")}
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
                  className="text-xs gap-1.5 flex-1 sm:flex-none"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {t("services.filters")}
                  {(activeCategory || costRange > 0) && (
                    <span className="ml-1 bg-primary text-primary-foreground rounded-full h-4 w-4 text-[9px] flex items-center justify-center">
                      {(activeCategory ? 1 : 0) + (costRange > 0 ? 1 : 0)}
                    </span>
                  )}
                </Button>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortBy)}
                  className="h-8 rounded-md border border-border bg-card px-2 text-xs outline-none flex-1 sm:flex-none min-w-0"
                >
                  <option value="name">{t("services.sort_az")}</option>
                  <option value="cost-asc">{t("services.sort_cost_asc")}</option>
                  <option value="cost-desc">{t("services.sort_cost_desc")}</option>
                  <option value="category">{t("services.sort_category")}</option>
                </select>
                <div className="flex border border-border rounded-md overflow-hidden shrink-0">
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

            {/* Filters */}
            <ServiceFilters
              show={showFilters}
              activeCategory={activeCategory}
              onSetCategory={setActiveCategory}
              costRange={costRange}
              onSetCostRange={setCostRange}
              categories={categories}
              totalCount={layerServices.length}
              categoryConfig={CATEGORY_CONFIG}
              costRanges={COST_RANGES}
            />

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">
                {filtered.length === layerServices.length
                  ? t("services.showing_all", { count: filtered.length })
                  : t("services.showing_filtered", { filtered: filtered.length, total: layerServices.length })}
              </p>


            </div>

            {/* Services grid/list */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground mb-1">{t("services.no_match")}</p>
                <p className="text-xs text-muted-foreground/60 mb-4">{t("services.no_match_hint")}</p>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSearch(""); setActiveCategory(null); setCostRange(0); }}>
                  {t("services.clear_filters")}
                </Button>
              </div>
            ) : (
              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  : "space-y-1.5"
              )}>
                {filtered.map((service, i) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    viewMode={viewMode}
                    index={i}
                    userTier={userTier}
                    categoryConfig={CATEGORY_CONFIG}
                    classBadge={CLASS_BADGE}
                    onClick={() => handleServiceClick(service)}

                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════ PIPELINES LAYER ═══════ */}
        {activeLayer === "pipelines" && user && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <PipelinesHub />
          </motion.div>
        )}

        {/* ═══════ HISTORY LAYER ═══════ */}
        {activeLayer === "history" && user && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Execution History</h2>
                  <p className="text-xs text-muted-foreground">Recent service runs, results and status tracking</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <ServiceRunHistory limit={25} />
            </div>
          </motion.div>
        )}
      </div>




      <PremiumPaywall
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        requiredTier={paywallService?.tier}
        serviceName={paywallService?.name}
      />
    </div>
    </PageTransition>
  );
}
