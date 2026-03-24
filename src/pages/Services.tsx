import { useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { ServiceRunHistory } from "@/components/services/ServiceRunHistory";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Loader2, Sparkles, Search, X, Coins,
  ArrowRight, Zap, AlertTriangle, Workflow, Clock,
  ShoppingCart, GraduationCap, Megaphone, TrendingUp,
  Layers, Atom,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import { PremiumPaywall, tierSatisfied } from "@/components/premium/PremiumPaywall";
import { useTranslation } from "react-i18next";
import { PipelinesHub } from "@/components/services/PipelinesHub";
import { FlowTip } from "@/components/onboarding/FlowTip";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceDrawer } from "@/components/services/ServiceDrawer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceTierSystem, type ServiceTier } from "@/components/services/ServiceTierSystem";
import { OutputFamilies } from "@/components/services/OutputFamilies";
import { QuickStartFlow } from "@/components/services/QuickStartFlow";

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

/* ── Intent-based categories ── */
const INTENT_CONFIG: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  sell: { label: "SELL", icon: ShoppingCart, description: "Copywriting, landing pages, sales funnels" },
  educate: { label: "EDUCATE", icon: GraduationCap, description: "Courses, frameworks, knowledge assets" },
  attract: { label: "ATTRACT", icon: Megaphone, description: "Social media, SEO, content marketing" },
  convert: { label: "CONVERT", icon: TrendingUp, description: "Analytics, strategy, optimization" },
};

/* Map service categories to business intents */
function mapCategoryToIntent(category: string, serviceKey: string): string {
  const key = (category + " " + serviceKey).toLowerCase();
  if (/content|social|seo|attract|blog|newsletter|post/.test(key)) return "attract";
  if (/copy|sales|landing|funnel|sell|persuasion|offer/.test(key)) return "sell";
  if (/course|framework|education|teach|train|knowledge|extract/.test(key)) return "educate";
  if (/strategy|analysis|research|optim|analytics|convert|market-research/.test(key)) return "convert";
  // Fallback by category
  if (category === "content" || category === "production") return "attract";
  if (category === "extraction") return "educate";
  if (category === "analysis" || category === "strategy") return "convert";
  return "sell";
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  extraction: { label: "Extraction", icon: Sparkles, color: "text-purple-500" },
  analysis: { label: "Analysis", icon: TrendingUp, color: "text-blue-500" },
  content: { label: "Content", icon: Megaphone, color: "text-status-validated" },
  strategy: { label: "Strategy", icon: TrendingUp, color: "text-amber-500" },
  production: { label: "Production", icon: Sparkles, color: "text-rose-500" },
  orchestration: { label: "Orchestration", icon: Zap, color: "text-primary" },
  document: { label: "Document", icon: Sparkles, color: "text-sky-500" },
};

const CLASS_BADGE: Record<string, { label: string; description: string; className: string }> = {
  A: { label: "Fast", description: "Quick single-pass AI extraction. ~30s execution.", className: "bg-status-validated/15 text-status-validated" },
  B: { label: "Deep", description: "Multi-pass deep analysis with cross-referencing. ~2min.", className: "bg-ai-accent/15 text-ai-accent" },
  C: { label: "Full", description: "Complete pipeline with all extraction levels. ~5min.", className: "bg-primary/15 text-primary" },
  S: { label: "Sync", description: "Real-time synchronized processing across services.", className: "bg-status-validated/15 text-status-validated" },
};

type SectionKey = "quick-start" | "pipelines" | "services" | "outputs" | "history";

export default function Services() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { balance, loading: balanceLoading } = useCreditBalance();
  const { tier: userTier } = useUserTier();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const intentParam = searchParams.get("intent") || "";
  const searchParam = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";
  const initialSearch = searchParam || intentParam;
  const [search, setSearch] = useState(initialSearch);
  const [activeIntent, setActiveIntent] = useState<string | null>(categoryParam || null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallService, setPaywallService] = useState<{ name: string; tier: string } | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>(initialSearch || categoryParam ? "services" : "quick-start");
  const [activeTier, setActiveTier] = useState<ServiceTier | null>(null);

  // Drawer state
  const [drawerService, setDrawerService] = useState<Service | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleServiceClick = (service: Service) => {
    if (!user) { navigate("/auth"); return; }
    const requiredTier = service.access_tier || "free";
    if (!tierSatisfied(userTier, requiredTier)) {
      setPaywallService({ name: service.name, tier: requiredTier });
      setPaywallOpen(true);
      return;
    }
    setDrawerService(service);
    setDrawerOpen(true);
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

  // Group services by intent
  const intentGroups = useMemo(() => {
    let list = [...services];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.service_key.toLowerCase().includes(q)
      );
    }

    const groups: Record<string, Service[]> = { sell: [], educate: [], attract: [], convert: [] };
    list.forEach(s => {
      const intent = mapCategoryToIntent(s.category, s.service_key);
      if (groups[intent]) groups[intent].push(s);
      else groups.sell.push(s);
    });

    if (activeIntent) {
      return { [activeIntent]: groups[activeIntent] || [] };
    }
    return groups;
  }, [services, search, activeIntent]);

  const totalFiltered = useMemo(
    () => Object.values(intentGroups).reduce((sum, arr) => sum + arr.length, 0),
    [intentGroups]
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isVisitor = !user;

  return (
    <TooltipProvider delayDuration={300}>
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

        {/* ── Intent banner ── */}
        {intentParam && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5"
          >
            <Zap className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Obiectivul tău:</p>
              <p className="text-sm font-medium truncate">{intentParam}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 text-xs h-7"
              onClick={() => {
                setSearch("");
                setSearchParams({});
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}

        {/* ── Section tabs ── */}
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

        {/* ═══ ALL SERVICES — Intent-grouped ═══ */}
        {activeSection === "services" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-5">
            {/* Search */}
            <div className="relative">
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

            {/* Intent filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveIntent(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors",
                  !activeIntent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Toate ({services.length})
              </button>
              {Object.entries(INTENT_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const count = services.filter(s => mapCategoryToIntent(s.category, s.service_key) === key).length;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveIntent(activeIntent === key ? null : key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1.5",
                      activeIntent === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Results info */}
            {(search || activeIntent) && (
              <p className="text-xs text-muted-foreground">
                {totalFiltered} of {services.length} services
                {search && <> matching "<span className="font-medium text-foreground">{search}</span>"</>}
              </p>
            )}

            {/* No results */}
            {totalFiltered === 0 && (
              <div className="text-center py-16">
                <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground mb-1">{t("services.no_match")}</p>
                <Button variant="outline" size="sm" className="text-xs mt-2" onClick={() => { setSearch(""); setActiveIntent(null); }}>
                  {t("services.clear_filters")}
                </Button>
              </div>
            )}

            {/* Intent groups */}
            {Object.entries(intentGroups).map(([intentKey, intentServices]) => {
              if (intentServices.length === 0) return null;
              const cfg = INTENT_CONFIG[intentKey];
              if (!cfg) return null;
              const IntentIcon = cfg.icon;

              return (
                <motion.div
                  key={intentKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Intent header */}
                  <div className="flex items-center gap-2.5 pt-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IntentIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {cfg.label}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">{cfg.description}</p>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto">
                      {intentServices.length}
                    </span>
                  </div>

                  {/* Service grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {intentServices.map((service, i) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        viewMode="grid"
                        index={i}
                        userTier={userTier}
                        categoryConfig={CATEGORY_CONFIG}
                        classBadge={CLASS_BADGE}
                        onClick={() => handleServiceClick(service)}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ═══ HISTORY ═══ */}
        {activeSection === "history" && user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <ServiceRunHistory limit={25} />
          </motion.div>
        )}
      </div>

      {/* Drawer */}
      <ServiceDrawer
        service={drawerService}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <PremiumPaywall
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        requiredTier={paywallService?.tier}
        serviceName={paywallService?.name}
      />
    </div>
    </PageTransition>
    </TooltipProvider>
  );
}
