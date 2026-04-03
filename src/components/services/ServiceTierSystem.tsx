/**
 * ServiceTierSystem — OTOS/MMS/LCSS hierarchy display.
 * OTOS = atomic (hidden from direct access, used as building blocks)
 * MMS = products (primary UI, user-facing systems)
 * LCSS = premium orchestration (long-term systems)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Atom, Layers, Crown, ChevronRight, Zap, ArrowRight,
  CheckCircle2, Lock, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ServiceTier = "otos" | "mms" | "lcss";

interface TierConfig {
  key: ServiceTier;
  label: string;
  fullLabel: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  count: string;
  access: string;
  badge: string;
  features: string[];
}

const TIERS: TierConfig[] = [
  {
    key: "otos",
    label: "Action",
    fullLabel: "Quick Actions",
    tagline: "Acțiuni Rapide",
    description: "Fiecare acțiune produce un singur output determinist. Sunt blocurile fundamentale din care se construiesc sistemele mai mari.",
    icon: Atom,
    count: "1200+",
    access: "Indirect (via Systems)",
    badge: "QUICK",
    features: [
      "Output determinist per acțiune",
      "Execuție < 30s",
      "Cost: 2-50 NEURONS",
      "Auto-selectate de engine",
    ],
  },
  {
    key: "mms",
    label: "System",
    fullLabel: "Execution Systems",
    tagline: "Sisteme de Producție",
    description: "Combină acțiuni într-un pipeline inteligent care produce 10-50+ livrabile. Acesta este stratul principal cu care interacționezi.",
    icon: Layers,
    count: "260+",
    access: "Direct",
    badge: "PRODUCT",
    features: [
      "Pipeline multi-step",
      "10-50+ deliverables per run",
      "Cost: 200-2000 NEURONS",
      "Preview outputs + cost estimation",
    ],
  },
  {
    key: "lcss",
    label: "Program",
    fullLabel: "Growth Programs",
    tagline: "Programe de Creștere",
    description: "Orchestrare pe termen lung cu feedback loops. Programele rulează continuu, învață din rezultate și ajustează automat execuția.",
    icon: Crown,
    count: "5",
    access: "Pro+",
    badge: "PREMIUM",
    features: [
      "Feedback loops automate",
      "Auto-ajustare execuție",
      "Monitorizare continuă",
      "Acces: Pro / VIP",
    ],
  },
];

interface ServiceTierSystemProps {
  activeTier: ServiceTier | null;
  onTierChange: (tier: ServiceTier | null) => void;
}

export function ServiceTierSystem({ activeTier, onTierChange }: ServiceTierSystemProps) {
  const [expanded, setExpanded] = useState<ServiceTier | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold tracking-tight">Arhitectura Serviciilor</h2>
        <span className="text-[10px] text-muted-foreground ml-auto">3 nivele • 1460+ sisteme</span>
      </div>

      {/* Visual hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TIERS.map((tier, i) => {
          const Icon = tier.icon;
          const isActive = activeTier === tier.key;
          const isExpanded = expanded === tier.key;
          const isPrimary = tier.key === "mms";

          return (
            <motion.div
              key={tier.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <button
                onClick={() => {
                  if (tier.key === "otos") return; // Actions not directly accessible
                  onTierChange(isActive ? null : tier.key);
                }}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all duration-200",
                  isPrimary && "ring-1 ring-primary/20",
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/5"
                    : tier.key === "otos"
                      ? "border-border/30 bg-muted/30 opacity-70 cursor-default"
                      : "border-border/40 bg-card hover:border-primary/20 hover:bg-primary/[0.02]"
                )}
              >
                {/* Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    tier.key === "otos" && "bg-muted text-muted-foreground",
                    tier.key === "mms" && "bg-primary/15 text-primary",
                    tier.key === "lcss" && "bg-semantic-amber/15 text-semantic-amber",
                  )}>
                    {tier.badge}
                  </span>
                  {tier.key === "otos" && <Lock className="h-3 w-3 text-muted-foreground/50" />}
                  {isPrimary && (
                    <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-auto">
                      RECOMANDAT
                    </span>
                  )}
                </div>

                {/* Icon + title */}
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn(
                    "h-5 w-5",
                    tier.key === "otos" && "text-muted-foreground",
                    tier.key === "mms" && "text-primary",
                    tier.key === "lcss" && "text-semantic-amber",
                  )} />
                  <div>
                    <h3 className="text-sm font-bold">{tier.label}</h3>
                    <p className="text-[10px] text-muted-foreground">{tier.tagline}</p>
                  </div>
                </div>

                {/* Count */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-mono font-bold text-foreground">{tier.count}</span>
                  <span className="text-[10px] text-muted-foreground">sisteme</span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground/80 mt-2 leading-relaxed line-clamp-2">
                  {tier.description}
                </p>

                {/* Features */}
                <div className="mt-3 space-y-1">
                  {tier.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <CheckCircle2 className={cn(
                        "h-2.5 w-2.5 shrink-0",
                        tier.key === "otos" && "text-muted-foreground/40",
                        tier.key === "mms" && "text-primary/60",
                        tier.key === "lcss" && "text-semantic-amber/60",
                      )} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Access indicator */}
                <div className="mt-3 pt-2 border-t border-border/20 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Acces: <span className="font-medium text-foreground">{tier.access}</span>
                  </span>
                  {tier.key !== "otos" && (
                    <ChevronRight className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform",
                      isActive && "rotate-90 text-primary"
                    )} />
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Flow visualization */}
      <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-muted-foreground">
        <span className="bg-muted/50 px-2 py-1 rounded-full">Actions (quick)</span>
        <ArrowRight className="h-3 w-3" />
        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Systems (products)</span>
        <ArrowRight className="h-3 w-3" />
        <span className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-full">Programs (growth)</span>
      </div>
    </div>
  );
}
