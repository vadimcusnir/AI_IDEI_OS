/**
 * ServiceCard — Grid and list card for a single service.
 */
import { motion } from "framer-motion";
import { Coins, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TierBadge, tierSatisfied } from "@/components/premium/PremiumPaywall";

interface ServiceCardProps {
  service: {
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
  };
  viewMode: "grid" | "list";
  index: number;
  userTier: string;
  categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }>;
  classBadge: Record<string, { label: string; description: string; className: string }>;
  onClick: () => void;
  onCompareToggle?: () => void;
  isComparing?: boolean;
}

export function ServiceCard({
  service, viewMode, index, userTier,
  categoryConfig, classBadge, onClick,
  onCompareToggle, isComparing,
}: ServiceCardProps) {
  const catCfg = categoryConfig[service.category];
  const clsBadge = classBadge[service.service_class] || classBadge.A;
  const locked = !tierSatisfied(userTier, service.access_tier);

  if (viewMode === "list") {
    return (
      <motion.div
        key={service.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: Math.min(index * 0.01, 0.2) }}
        onClick={onClick}
        className={cn(
          "group flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all cursor-pointer",
          locked && "opacity-75",
          isComparing && "ring-2 ring-primary/40"
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
        {locked ? (
          <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        ) : (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary shrink-0" />
        )}
        {onCompareToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onCompareToggle(); }}
            className={cn(
              "shrink-0 text-[9px] font-medium px-2 py-1 rounded-md transition-colors",
              isComparing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {isComparing ? "✓" : "⊕"}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      key={service.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      onClick={onClick}
      className={cn(
        "group relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer",
        locked && "opacity-75",
        isComparing && "ring-2 ring-primary/40"
      )}
    >
      {onCompareToggle && (
        <button
          onClick={(e) => { e.stopPropagation(); onCompareToggle(); }}
          className={cn(
            "absolute top-2 right-2 text-[9px] font-medium px-2 py-1 rounded-md transition-colors z-10",
            isComparing ? "bg-primary text-primary-foreground" : "bg-muted/80 text-muted-foreground hover:bg-muted"
          )}
        >
          {isComparing ? "✓ Compare" : "Compare"}
        </button>
      )}

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
}
