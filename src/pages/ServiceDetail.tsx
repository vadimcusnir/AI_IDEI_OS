import { useParams, useNavigate } from "react-router-dom";
import { useServiceBySlug } from "@/hooks/useServiceCatalog";
import { Button } from "@/components/ui/button";
import { ServiceUpsellBanner } from "@/components/services/ServiceUpsellBanner";
import { PostExecutionUpsell } from "@/components/services/PostExecutionUpsell";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, DollarSign, Zap, Layers, Server, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG = {
  L3: { label: "Quick Service", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  L2: { label: "Service Pack", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
  L1: { label: "Master System", icon: Server, color: "text-purple-500", bg: "bg-purple-500/10" },
} as const;

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Try each level — the hook is cheap and only one will match
  const l3 = useServiceBySlug("L3", slug || "");
  const l2 = useServiceBySlug("L2", slug || "");
  const l1 = useServiceBySlug("L1", slug || "");

  const service = l3.data || l2.data || l1.data;
  const isLoading = l3.isLoading || l2.isLoading || l1.isLoading;
  const isError = l3.isError && l2.isError && l1.isError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!service || isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Serviciul nu a fost găsit.</p>
        <Button variant="outline" onClick={() => navigate("/services-catalog")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi la catalog
        </Button>
      </div>
    );
  }

  const level = service.level as "L1" | "L2" | "L3";
  const cfg = LEVEL_CONFIG[level];
  const Icon = cfg.icon;
  const deliveryMin = Math.ceil(service.estimated_delivery_seconds / 60);

  // Composition info for L2/L1
  const hasComposition = level === "L2" || level === "L1";
  const componentIds = level === "L2"
    ? (service as any).component_l3_ids || []
    : level === "L1"
    ? (service as any).component_l2_ids || []
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-6 text-xs gap-1" onClick={() => navigate("/services-catalog")}>
          <ArrowLeft className="h-3.5 w-3.5" /> Catalog
        </Button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
            <Icon className={cn("h-6 w-6", cfg.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-nano", cfg.color)}>{cfg.label}</Badge>
              <Badge variant="outline" className="text-nano">{service.category}</Badge>
              {service.subcategory && (
                <Badge variant="outline" className="text-nano text-muted-foreground">{service.subcategory}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{service.service_name}</h1>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          {service.description_public}
        </p>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Preț", value: `$${service.price_usd}`, icon: DollarSign },
            { label: "Neuroni", value: `${service.internal_credit_cost}N`, icon: Zap },
            { label: "Livrare", value: `~${deliveryMin} min`, icon: Clock },
            { label: "Tip", value: service.deliverable_type, icon: Package },
          ].map(m => (
            <div key={m.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-nano text-muted-foreground uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="text-sm font-bold">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Deliverable */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold mb-2">Ce primești</h2>
          <p className="text-sm text-muted-foreground">{service.deliverable_name}</p>
          <p className="text-xs text-muted-foreground mt-1">Format: {service.deliverable_type}</p>
        </div>

        {/* Composition for L2/L1 */}
        {hasComposition && componentIds.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-8">
            <h2 className="text-sm font-semibold mb-2">
              Componente incluse ({componentIds.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {componentIds.map((id: string) => (
                <Badge key={id} variant="outline" className="text-nano font-mono">
                  {id.slice(0, 8)}…
                </Badge>
              ))}
            </div>
            <p className="text-micro text-muted-foreground mt-2">
              {level === "L2"
                ? "Acest pack combină mai multe servicii atomice (L3) într-un flux integrat."
                : "Acest sistem master orchestrează mai multe pack-uri (L2) și servicii (L3)."}
            </p>
          </div>
        )}

        {/* L1 specific: output types */}
        {level === "L1" && (service as any).output_types?.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-8">
            <h2 className="text-sm font-semibold mb-2">Tipuri de output</h2>
            <div className="flex flex-wrap gap-2">
              {((service as any).output_types as string[]).map((t: string) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Upsell Banner */}
        <ServiceUpsellBanner
          currentSlug={slug || ""}
          currentLevel={level}
          className="mb-8"
        />

        {/* CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <p className="text-lg font-bold mb-1">${service.price_usd}</p>
          <p className="text-xs text-muted-foreground mb-4">{service.internal_credit_cost} Neuroni</p>
          <Button size="lg" className="gap-2 px-8" onClick={() => navigate(`/services/${slug}/execute`)}>
            <Zap className="h-4 w-4" />
            Cumpără și Execută
          </Button>
        </div>

        {/* Post-execution recommendations */}
        <PostExecutionUpsell
          completedServiceSlug={slug}
          completedCategory={service.category}
          className="mt-8"
        />
      </div>
    </div>
  );
}
