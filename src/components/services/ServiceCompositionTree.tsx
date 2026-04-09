/**
 * ServiceCompositionTree — Resolves and displays the L3/L2 components
 * that make up an L2 Pack or L1 Master System.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap, Layers, ArrowRight, Loader2, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ResolvedComponent {
  id: string;
  service_name: string;
  service_slug: string;
  category: string;
  price_usd: number;
  internal_credit_cost: number;
  estimated_delivery_seconds: number;
  deliverable_name: string;
  level: "L3" | "L2";
}

interface Props {
  level: "L1" | "L2";
  componentL3Ids?: string[];
  componentL2Ids?: string[];
  componentL3IdsOptional?: string[];
  className?: string;
}

export function ServiceCompositionTree({
  level,
  componentL3Ids = [],
  componentL2Ids = [],
  componentL3IdsOptional = [],
  className,
}: Props) {
  const [components, setComponents] = useState<ResolvedComponent[]>([]);
  const [optionalComponents, setOptionalComponents] = useState<ResolvedComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function resolve() {
      setLoading(true);
      const results: ResolvedComponent[] = [];
      const optional: ResolvedComponent[] = [];

      // Resolve L2 components (for L1)
      if (componentL2Ids.length > 0) {
        const { data } = await (supabase.from("services_level_2") as any)
          .select("id, service_name, service_slug, category, price_usd, internal_credit_cost, estimated_delivery_seconds, deliverable_name")
          .in("id", componentL2Ids);
        if (data) results.push(...data.map((d: any) => ({ ...d, level: "L2" as const, price_usd: Number(d.price_usd) })));
      }

      // Resolve L3 components (for L2, or required L3 in L1)
      if (componentL3Ids.length > 0) {
        const { data } = await (supabase.from("services_level_3") as any)
          .select("id, service_name, service_slug, category, price_usd, internal_credit_cost, estimated_delivery_seconds, deliverable_name")
          .in("id", componentL3Ids);
        if (data) results.push(...data.map((d: any) => ({ ...d, level: "L3" as const, price_usd: Number(d.price_usd) })));
      }

      // Resolve optional L3 (for L1)
      if (componentL3IdsOptional.length > 0) {
        const { data } = await (supabase.from("services_level_3") as any)
          .select("id, service_name, service_slug, category, price_usd, internal_credit_cost, estimated_delivery_seconds, deliverable_name")
          .in("id", componentL3IdsOptional);
        if (data) optional.push(...data.map((d: any) => ({ ...d, level: "L3" as const, price_usd: Number(d.price_usd) })));
      }

      setComponents(results);
      setOptionalComponents(optional);
      setLoading(false);
    }
    resolve();
  }, [componentL2Ids, componentL3Ids, componentL3IdsOptional]);

  if (loading) {
    return (
      <div className={cn("flex justify-center py-4", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (components.length === 0 && optionalComponents.length === 0) return null;

  const totalCost = components.reduce((s, c) => s + c.internal_credit_cost, 0);
  const totalTime = components.reduce((s, c) => s + c.estimated_delivery_seconds, 0);

  return (
    <div className={cn("bg-card border border-border rounded-xl p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">
          {level === "L2" ? "Servicii incluse" : "Pipeline de execuție"} ({components.length})
        </h2>
        <div className="flex items-center gap-3 text-micro text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> {totalCost}N total
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> ~{Math.ceil(totalTime / 60)} min
          </span>
        </div>
      </div>

      {/* Main components */}
      <div className="space-y-2">
        {components.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2">
            {i > 0 && (
              <div className="flex items-center justify-center w-6">
                <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
              </div>
            )}
            {i === 0 && <div className="w-6" />}
            <button
              onClick={() => navigate(`/services/${c.service_slug}`)}
              className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                c.level === "L3" ? "bg-emerald-500/10" : "bg-blue-500/10"
              )}>
                {c.level === "L3"
                  ? <Zap className="h-4 w-4 text-emerald-500" />
                  : <Layers className="h-4 w-4 text-blue-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{c.service_name}</p>
                <p className="text-micro text-muted-foreground">{c.deliverable_name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono font-bold">{c.internal_credit_cost}N</p>
                <p className="text-micro text-muted-foreground">${c.price_usd}</p>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Optional components for L1 */}
      {optionalComponents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-micro text-muted-foreground uppercase tracking-wider font-medium mb-2">
            Opțional ({optionalComponents.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {optionalComponents.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/services/${c.service_slug}`)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/30 transition-colors"
              >
                <Zap className="h-3 w-3 text-emerald-500" />
                <span className="text-xs">{c.service_name}</span>
                <Badge variant="outline" className="text-nano">{c.internal_credit_cost}N</Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
