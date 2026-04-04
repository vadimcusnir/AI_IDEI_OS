import { useState, useEffect, useMemo, useCallback } from "react";
import { ServicesSkeleton } from "@/components/skeletons/ServicesSkeleton";
import { GuidedTooltip } from "@/components/onboarding/GuidedTooltip";
import { SERVICES_TOUR } from "@/components/onboarding/tourDefinitions";
import { GuestConversionGate } from "@/components/revenue/GuestConversionGate";
import { SEOHead } from "@/components/SEOHead";
import { ServiceRunHistory } from "@/components/services/ServiceRunHistory";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Loader2, Sparkles, Search, X, Coins,
  ArrowRight, Zap, AlertTriangle,
  ShoppingCart, GraduationCap, Megaphone, TrendingUp,
  Clock, LayoutGrid, List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import { PremiumPaywall, tierSatisfied } from "@/components/premium/PremiumPaywall";
import { useTranslation } from "react-i18next";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceDrawer } from "@/components/services/ServiceDrawer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServicesHero } from "@/components/services/ServicesHero";
import { ValueComparison } from "@/components/services/ValueComparison";
import { ServicePricingBreakdown } from "@/components/services/ServicePricingBreakdown";
import { OutputFamilies } from "@/components/services/OutputFamilies";
import { ServiceWizard } from "@/components/services/ServiceWizard";

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
const INTENT_CONFIG: Record<string, { label: string; icon: React.ElementType; description: string; tagline: string }> = {
  attract: { label: "ATTRACT", icon: Megaphone, description: "Social media, SEO, content marketing", tagline: "Generează conținut care atrage" },
  educate: { label: "EDUCATE", icon: GraduationCap, description: "Cursuri, frameworks, knowledge assets", tagline: "Transformă expertiza în active" },
  sell: { label: "SELL", icon: ShoppingCart, description: "Copywriting, landing pages, sales funnels", tagline: "Produce copy care vinde" },
  convert: { label: "CONVERT", icon: TrendingUp, description: "Analytics, strategy, optimization", tagline: "Optimizează pentru conversie" },
};

function mapCategoryToIntent(category: string, serviceKey: string): string {
  const key = (category + " " + serviceKey).toLowerCase();
  if (/content|social|seo|attract|blog|newsletter|post/.test(key)) return "attract";
  if (/copy|sales|landing|funnel|sell|persuasion|offer/.test(key)) return "sell";
  if (/course|framework|education|teach|train|knowledge|extract/.test(key)) return "educate";
  if (/strategy|analysis|research|optim|analytics|convert|market-research/.test(key)) return "convert";
  if (category === "content" || category === "production") return "attract";
  if (category === "extraction") return "educate";
  if (category === "analysis" || category === "strategy") return "convert";
  return "sell";
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  extraction: { label: "Extraction", icon: Sparkles, color: "text-color-purple" },
  analysis: { label: "Analysis", icon: TrendingUp, color: "text-color-blue" },
  content: { label: "Content", icon: Megaphone, color: "text-color-emerald" },
  strategy: { label: "Strategy", icon: TrendingUp, color: "text-color-amber" },
  production: { label: "Production", icon: Sparkles, color: "text-color-rose" },
  orchestration: { label: "Orchestration", icon: Zap, color: "text-primary" },
  document: { label: "Document", icon: Sparkles, color: "text-color-cyan" },
};

const CLASS_BADGE: Record<string, { label: string; description: string; className: string }> = {
  A: { label: "Fast", description: "Quick single-pass AI extraction. ~30s execution.", className: "bg-status-validated/15 text-status-validated" },
  B: { label: "Deep", description: "Multi-pass deep analysis with cross-referencing. ~2min.", className: "bg-ai-accent/15 text-ai-accent" },
  C: { label: "Full", description: "Complete pipeline with all extraction levels. ~5min.", className: "bg-primary/15 text-primary" },
  S: { label: "Sync", description: "Real-time synchronized processing across services.", className: "bg-status-validated/15 text-status-validated" },
};

const MAX_VISIBLE_PER_INTENT = 6;

export default function Services() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { balance, loading: balanceLoading } = useCreditBalance();
  const { tier: userTier } = useUserTier();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeIntent, setActiveIntent] = useState<string | null>(searchParams.get("category") || null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedIntents, setExpandedIntents] = useState<Set<string>>(new Set());
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallService, setPaywallService] = useState<{ name: string; tier: string } | null>(null);
  const [guestGateOpen, setGuestGateOpen] = useState(false);
  const [guestGateService, setGuestGateService] = useState<string | undefined>();
  const [showWizard, setShowWizard] = useState(() => !searchParams.get("category") && !searchParams.get("search"));

  // Drawer state
  const [drawerService, setDrawerService] = useState<Service | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleServiceClick = useCallback((service: Service) => {
    if (!user) {
      setGuestGateService(service.name);
      setGuestGateOpen(true);
      return;
    }
    const requiredTier = service.access_tier || "free";
    if (!tierSatisfied(userTier, requiredTier)) {
      setPaywallService({ name: service.name, tier: requiredTier });
      setPaywallOpen(true);
      return;
    }
    setDrawerService(service);
    setDrawerOpen(true);
  }, [user, userTier, navigate]);

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
    const groups: Record<string, Service[]> = { attract: [], educate: [], sell: [], convert: [] };
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
    return <ServicesSkeleton />;
  }

  return (
    <TooltipProvider delayDuration={300}>
    <PageTransition>
    <div className="flex-1 overflow-y-auto">
      <SEOHead
        title="AI Services — Transformă input în 50+ outputs | AI-IDEI"
        description="120+ sisteme AI: extracție, analiză, generare conținut. Transformă expertiza în active digitale structurate. Cost mediu: $0.14/output."
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
      <GuidedTooltip tourId="services" steps={SERVICES_TOUR} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ═══ WIZARD ═══ */}
        <AnimatePresence>
          {showWizard && user && (
            <ServiceWizard
              onComplete={(contentType, goal) => {
                setShowWizard(false);
                const intentMap: Record<string, string> = { extract: "educate", generate: "attract", analyze: "sell" };
                setActiveIntent(intentMap[goal] || null);
                setSearch(contentType);
              }}
              onDismiss={() => setShowWizard(false)}
            />
          )}
        </AnimatePresence>

        {/* ═══ LAYER 1: HERO ═══ */}
        <ServicesHero isLoggedIn={!!user} serviceCount={services.length} />

        {/* ── Low balance alert ── */}
        {!balanceLoading && balance < 100 && user && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs flex-1">
              <span className="font-medium">Balanță scăzută:</span>{" "}
              <span className="font-mono font-bold">{balance}</span> NEURONS
            </p>
            <Button size="sm" variant="outline" className="shrink-0 text-xs gap-1 h-7" onClick={() => navigate("/credits")}>
              <Coins className="h-3 w-3" /> Top-up
            </Button>
          </div>
        )}

        {/* ═══ LAYER 2: INTENT SELECTION ═══ */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold tracking-tight">Ce vrei să obții?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(INTENT_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const count = services.filter(s => mapCategoryToIntent(s.category, s.service_key) === key).length;
              const isActive = activeIntent === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveIntent(isActive ? null : key)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all duration-200",
                    isActive
                      ? "border-[hsl(var(--gold-oxide)/0.4)] bg-[hsl(var(--gold-oxide)/0.05)] shadow-sm"
                      : "border-border hover:border-[hsl(var(--gold-oxide)/0.2)] hover:bg-[hsl(var(--gold-oxide)/0.02)]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center",
                      isActive ? "bg-[hsl(var(--gold-oxide)/0.12)]" : "bg-muted"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[hsl(var(--gold-oxide))]" : "text-muted-foreground")} />
                    </div>
                    <span className="text-micro font-mono text-muted-foreground">{count}</span>
                  </div>
                  <p className="text-xs font-bold">{cfg.label}</p>
                  <p className="text-micro text-muted-foreground mt-0.5 line-clamp-1">{cfg.tagline}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ LAYER 3: SEARCH + VIEW CONTROLS ═══ */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută servicii..."
              className="pl-9 pr-8 h-9 text-sm bg-card"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-[hsl(var(--gold-oxide)/0.1)] text-[hsl(var(--gold-oxide))]" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2 transition-colors", viewMode === "list" ? "bg-[hsl(var(--gold-oxide)/0.1)] text-[hsl(var(--gold-oxide))]" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-micro font-mono text-muted-foreground shrink-0">
            {totalFiltered}/{services.length}
          </span>
        </div>

        {/* ═══ LAYER 4: SERVICE CLUSTERS ═══ */}
        <div className="space-y-8">
          {totalFiltered === 0 && (
            <div className="text-center py-16">
              <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground mb-1">Niciun serviciu găsit</p>
              <Button variant="outline" size="sm" className="text-xs mt-2" onClick={() => { setSearch(""); setActiveIntent(null); }}>
                Resetează filtrele
              </Button>
            </div>
          )}

          {Object.entries(intentGroups).map(([intentKey, intentServices]) => {
            if (intentServices.length === 0) return null;
            const cfg = INTENT_CONFIG[intentKey];
            if (!cfg) return null;
            const IntentIcon = cfg.icon;
            const isExpanded = expandedIntents.has(intentKey) || search.trim() !== "";
            const visibleServices = isExpanded ? intentServices : intentServices.slice(0, MAX_VISIBLE_PER_INTENT);
            const hasMore = intentServices.length > MAX_VISIBLE_PER_INTENT && !isExpanded;

            return (
              <motion.section
                key={intentKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Intent header */}
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center">
                    <IntentIcon className="h-4 w-4 text-[hsl(var(--gold-oxide))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {cfg.label}
                    </h3>
                    <p className="text-micro text-muted-foreground">{cfg.tagline}</p>
                  </div>
                  <span className="text-micro font-mono text-muted-foreground/60">
                    {intentServices.length} servicii
                  </span>
                </div>

                {/* Service grid/list */}
                <div className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    : "space-y-2"
                )}>
                  {visibleServices.map((service, i) => (
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

                {/* Show more */}
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground gap-1.5"
                    onClick={() => setExpandedIntents(prev => new Set(prev).add(intentKey))}
                  >
                    Vezi toate {intentServices.length} servicii {cfg.label}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </motion.section>
            );
          })}
        </div>

        {/* ═══ LAYER 5: OUTPUT FAMILIES ═══ */}
        <OutputFamilies compact />

        {/* ═══ LAYER 6: PRICING BREAKDOWN ═══ */}
        <ServicePricingBreakdown userTier={userTier} />

        {/* ═══ LAYER 7: VALUE COMPARISON ═══ */}
        <ValueComparison />

        {/* ═══ LAYER 8: FINAL CTA ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[hsl(var(--gold-oxide)/0.2)] bg-gradient-to-br from-[hsl(var(--gold-oxide)/0.05)] via-background to-[hsl(var(--gold-oxide)/0.02)] p-8 text-center space-y-4"
        >
          <Zap className="h-8 w-8 text-[hsl(var(--gold-oxide))] mx-auto" />
          <h2 className="text-lg font-bold">Începe producția</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {services.length}+ sisteme AI. 50+ outputs per execuție. Cost mediu: $0.14/output.
          </p>
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={() => user ? navigate("/home") : navigate("/auth")}
          >
            <Zap className="h-4 w-4" />
            {user ? "Start Production" : "Creează cont gratuit"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          {!user && (
            <p className="text-dense text-muted-foreground">
              500 NEURONS gratuit la înregistrare • Fără card
            </p>
          )}
        </motion.section>

        {/* ═══ HISTORY (logged in users) ═══ */}
        {user && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold tracking-tight">Execuții recente</h2>
            </div>
            <ServiceRunHistory limit={5} />
          </section>
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

      <GuestConversionGate
        open={guestGateOpen}
        onClose={() => setGuestGateOpen(false)}
        serviceName={guestGateService}
      />
    </div>
    </PageTransition>
    </TooltipProvider>
  );
}
