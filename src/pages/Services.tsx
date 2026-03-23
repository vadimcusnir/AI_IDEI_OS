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
  Loader2, Sparkles, BarChart3, Search, X, Coins,
  ArrowRight, Zap, FileText, Brain, Target, Layers,
  LayoutGrid, List, AlertTriangle, Workflow, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import { PremiumPaywall, tierSatisfied } from "@/components/premium/PremiumPaywall";
import { useTranslation } from "react-i18next";
import { PipelinesHub } from "@/components/services/PipelinesHub";
import { FlowTip } from "@/components/onboarding/FlowTip";
import { ServiceCard } from "@/components/services/ServiceCard";

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

type ViewMode = "grid" | "list";
type SortBy = "name" | "cost-asc" | "cost-desc" | "category";
type SectionKey = "pipelines" | "services" | "history";

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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallService, setPaywallService] = useState<{ name: string; tier: string } | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("pipelines");

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

  const filtered = useMemo(() => {
    let list = [...services];
    if (activeCategory) list = list.filter(s => s.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.service_key.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "cost-asc": list.sort((a, b) => a.credits_cost - b.credits_cost); break;
      case "cost-desc": list.sort((a, b) => b.credits_cost - a.credits_cost); break;
      case "category": list.sort((a, b) => a.category.localeCompare(b.category)); break;
      default: list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [services, activeCategory, search, sortBy]);

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
          item: { "@type": "Service", name: s.name, description: s.description, provider: { "@type": "Organization", name: "AI-IDEI" } },
        })),
      }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-1">{t("services.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("services.description")}</p>
        </div>

        {/* ── Low balance alert ── */}
        {!balanceLoading && balance < 100 && user && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs flex-1">
              <span className="font-medium">{t("services.low_balance")}:</span>{" "}
              <span className="font-mono font-bold">{balance}</span> NEURONS
            </p>
            <Button size="sm" variant="outline" className="shrink-0 text-xs gap-1 h-7" onClick={() => navigate("/credits")}>
              <Coins className="h-3 w-3" /> Top-up
            </Button>
          </div>
        )}

        {/* ── Visitor CTA ── */}
        {isVisitor && (
          <div className="flex items-center gap-3 px-4 py-4 rounded-xl border border-primary/20 bg-primary/5">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Start free with 500 NEURONS</p>
              <p className="text-xs text-muted-foreground">Sign up to run any AI service.</p>
            </div>
            <Button size="sm" className="shrink-0 text-xs gap-1" onClick={() => navigate("/auth")}>
              Get Started <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* ── Section Switcher ── */}
        <div className="flex items-center gap-1 border-b border-border">
          {([
            { key: "pipelines" as const, label: "Pipelines", icon: Workflow, count: 5 },
            { key: "services" as const, label: t("services.tab_all", { defaultValue: "All Services" }), icon: Sparkles, count: services.length },
            ...(user ? [{ key: "history" as const, label: "History", icon: Clock, count: null }] : []),
          ]).map(tab => {
            const Icon = tab.icon;
            const active = activeSection === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                  active
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count !== null && (
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded-full",
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══ PIPELINES ═══ */}
        {activeSection === "pipelines" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <FlowTip
              tipId="pipelines-intro"
              variant="info"
              title="What are Pipelines?"
              description="Pipelines chain multiple AI services into one automated flow. Upload content once and get dozens of professional deliverables — articles, strategies, social posts, scripts — generated automatically."
              className="mb-4"
            />
            <PipelinesHub />
          </motion.div>
        )}

        {/* ═══ ALL SERVICES ═══ */}
        {activeSection === "services" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
            {/* Search + controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("services.search_placeholder")}
                  className="pl-9 pr-8 h-9 text-sm bg-card"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortBy)}
                  className="h-9 rounded-md border border-border bg-card px-2 text-xs outline-none"
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

            {/* Category chips — inline */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                  !activeCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
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
                      "px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1",
                      activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {cfg && <cfg.icon className="h-3 w-3" />}
                    {cfg?.label || cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Results info */}
            {(search || activeCategory) && (
              <p className="text-xs text-muted-foreground">
                {filtered.length} of {services.length} services
                {search && <> matching "<span className="font-medium text-foreground">{search}</span>"</>}
              </p>
            )}

            {/* Grid / List */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground mb-1">{t("services.no_match")}</p>
                <Button variant="outline" size="sm" className="text-xs mt-2" onClick={() => { setSearch(""); setActiveCategory(null); }}>
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
          </motion.div>
        )}

        {/* ═══ HISTORY ═══ */}
        {activeSection === "history" && user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <ServiceRunHistory limit={25} />
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
