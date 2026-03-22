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
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Loader2, Sparkles, BarChart3, Search, X, Coins, Clock,
  ArrowRight, Zap, FileText, Brain, Target, Layers,
  TrendingUp, LayoutGrid, List, SlidersHorizontal, AlertTriangle, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ControlledSection } from "@/components/ControlledSection";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumPaywall, TierBadge, tierSatisfied } from "@/components/premium/PremiumPaywall";
import { useTranslation } from "react-i18next";
import { IMFPipelineLauncher } from "@/components/pipeline/IMFPipelineLauncher";
import { Avatar33Panel } from "@/components/services/Avatar33Panel";
import { WebinarGeneratorPanel } from "@/components/services/WebinarGeneratorPanel";
import { ContentGeneratorPanel } from "@/components/services/ContentGeneratorPanel";
import { ExtractionPipelinePanel } from "@/components/services/ExtractionPipelinePanel";

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

export default function Services() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { balance, loading: balanceLoading } = useCreditBalance();
  const { subscribed, tier: subTier } = useSubscription();
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

  const userTier = subscribed ? (subTier || "pro") : "free";

  const handleServiceClick = (service: Service) => {
    const requiredTier = service.access_tier || "free";
    if (!tierSatisfied(userTier, requiredTier)) {
      setPaywallService({ name: service.name, tier: requiredTier });
      setPaywallOpen(true);
      return;
    }
    navigate(`/run/${service.service_key}`);
  };

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (data) setServices(data as Service[]);
      if (error) toast.error(t("services.failed_load"));
      setLoading(false);
    })();
  }, [user, authLoading]);

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
    switch (sortBy) {
      case "cost-asc": list = [...list].sort((a, b) => a.credits_cost - b.credits_cost); break;
      case "cost-desc": list = [...list].sort((a, b) => b.credits_cost - a.credits_cost); break;
      case "category": list = [...list].sort((a, b) => a.category.localeCompare(b.category)); break;
      default: list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [services, activeCategory, costRange, search, sortBy]);

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
            <h1 className="text-2xl font-serif font-medium tracking-tight">{t("services.title")}</h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {t("services.available", { count: services.length })}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            {t("services.description")}
          </p>
        </div>

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
              <p className="text-[10px] text-muted-foreground">
                {t("services.low_balance_hint")}
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 text-xs gap-1"
              onClick={() => navigate("/credits")}
            >
              <Coins className="h-3 w-3" />
              {t("services.topup")}
            </Button>
          </motion.div>
        )}

        {/* KPI strip */}
        <ControlledSection elementId="services.kpi_strip">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t("services.kpi_services"), value: services.length, icon: Sparkles },
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

        {/* Search + Controls bar */}
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
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("services.filter_category")}</p>
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
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("services.filter_cost")}</p>
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
                    <X className="h-3 w-3 mr-1" /> {t("services.clear_filters")}
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
              ? t("services.showing_all", { count: filtered.length })
              : t("services.showing_filtered", { filtered: filtered.length, total: services.length })}
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
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => handleServiceClick(service)}
                  className={cn(
                    "group relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer",
                    !tierSatisfied(userTier, service.access_tier) && "opacity-75"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {catCfg && <catCfg.icon className={cn("h-4 w-4", catCfg.color)} />}
                      <span className={cn("text-[9px] font-semibold uppercase tracking-wider", catCfg?.color || "text-muted-foreground")}>
                        {catCfg?.label || service.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md cursor-help", clsBadge.className)}>
                            {clsBadge.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[200px]">
                          <p className="font-semibold mb-0.5">Class {service.service_class}: {clsBadge.label}</p>
                          <p className="text-muted-foreground">{clsBadge.description}</p>
                        </TooltipContent>
                      </Tooltip>
                      <TierBadge tier={service.access_tier} />
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {service.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
                    {service.description}
                  </p>

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
          <div className="space-y-1.5">
            {filtered.map((service, i) => {
              const catCfg = CATEGORY_CONFIG[service.category];
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.01, 0.2) }}
                  onClick={() => handleServiceClick(service)}
                  className={cn(
                    "group flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all cursor-pointer",
                    !tierSatisfied(userTier, service.access_tier) && "opacity-75"
                  )}
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
                  <TierBadge tier={service.access_tier} />
                  {!tierSatisfied(userTier, service.access_tier) ? (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Run History */}
        <div className="mt-8">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Istoric execuții
            </h2>
            <ServiceRunHistory limit={10} />
          </div>
        </div>

        {/* IMF Pipeline Section */}
        <div className="mt-6">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> {t("services.imf_title", { defaultValue: "IMF Pipeline — Automatic Multiplication" })}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {t("services.imf_desc", { defaultValue: "Launch a full pipeline: 1 extraction → 50+ deliverables generated automatically." })}
            </p>
            <IMFPipelineLauncher />
          </div>
        </div>

        {/* Advanced Engines */}
        <div className="mt-6 space-y-4">
          <ExtractionPipelinePanel />
          <Avatar33Panel />
          <WebinarGeneratorPanel />
          <ContentGeneratorPanel />
        </div>
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
