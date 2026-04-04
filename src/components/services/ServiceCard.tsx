/**
 * ServiceCard — Decision-focused card with outcome, pricing breakdown, and CTA.
 * Grid mode = conversion card. List mode = compact row.
 */
import { motion } from "framer-motion";
import { Coins, ArrowRight, Lock, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TierBadge, tierSatisfied } from "@/components/premium/PremiumPaywall";
import { Button } from "@/components/ui/button";

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

/** Estimate outputs and time from service class */
function getServiceMeta(serviceClass: string, creditsCost: number) {
  const costPerNeuron = 0.002;
  const usd = (creditsCost * costPerNeuron).toFixed(2);
  switch (serviceClass) {
    case "S":
      return { outputs: "50+", time: "~5min", costPerOutput: (creditsCost * costPerNeuron / 50).toFixed(2) };
    case "C":
      return { outputs: "30-50", time: "~5min", costPerOutput: (creditsCost * costPerNeuron / 40).toFixed(2) };
    case "B":
      return { outputs: "10-30", time: "~2min", costPerOutput: (creditsCost * costPerNeuron / 20).toFixed(2) };
    default:
      return { outputs: "5-15", time: "~30s", costPerOutput: (creditsCost * costPerNeuron / 10).toFixed(2) };
  }
}

export function ServiceCard({
  service, viewMode, index, userTier,
  categoryConfig, classBadge, onClick,
  onCompareToggle, isComparing,
}: ServiceCardProps) {
  const catCfg = categoryConfig[service.category];
  const clsBadge = classBadge[service.service_class] || classBadge.A;
  const locked = !tierSatisfied(userTier, service.access_tier);
  const showTierBadge = service.access_tier && service.access_tier !== "free" && service.access_tier !== "authenticated";
  const meta = getServiceMeta(service.service_class, service.credits_cost);
  const costUsd = (service.credits_cost * 0.002).toFixed(2);

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
          <p className="text-micro text-muted-foreground line-clamp-1">{service.description}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-micro text-muted-foreground shrink-0">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {meta.outputs}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {meta.time}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Coins className="h-3 w-3 text-ai-accent" />
          <span className="text-xs font-bold font-mono w-8 text-right">{service.credits_cost}</span>
        </div>
        {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
        {!locked && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary shrink-0" />}
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
        "group relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer flex flex-col",
        locked && "opacity-75",
        isComparing && "ring-2 ring-primary/40"
      )}
    >
      {/* Top row: category + class */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {catCfg && <catCfg.icon className={cn("h-3.5 w-3.5", catCfg.color)} />}
          <span className={cn("text-nano font-semibold uppercase tracking-wider", catCfg?.color || "text-muted-foreground")}>
            {catCfg?.label || service.category}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("text-nano font-bold uppercase px-1.5 py-0.5 rounded-md cursor-help", clsBadge.className)}>
              {clsBadge.label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            <p className="font-semibold mb-0.5">Class {service.service_class}: {clsBadge.label}</p>
            <p className="text-muted-foreground">{clsBadge.description}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
        {service.name}
      </h3>
      <p className="text-dense text-muted-foreground leading-relaxed line-clamp-2 mb-3">
        {service.description}
      </p>

      {/* Output meta row */}
      <div className="flex items-center gap-3 text-micro text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-primary/50" />
          <span className="font-semibold text-foreground">{meta.outputs}</span> outputs
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-primary/50" />
          {meta.time}
        </span>
      </div>

      {/* Footer: pricing breakdown */}
      <div className="mt-auto pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Coins className="h-3 w-3 text-ai-accent" />
            <span className="text-xs font-bold font-mono">{service.credits_cost}</span>
            <span className="text-nano text-muted-foreground">N</span>
            <span className="text-nano text-muted-foreground/60 ml-1">~${costUsd}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {showTierBadge && <TierBadge tier={service.access_tier} />}
            {locked ? (
              <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
            ) : (
              <span className="text-nano text-primary/70 font-mono">${meta.costPerOutput}/output</span>
            )}
          </div>
        </div>
        
        {/* CTA */}
        <Button
          variant={locked ? "outline" : "default"}
          size="sm"
          className="w-full h-8 text-dense font-semibold gap-1.5"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          {locked ? (
            <>
              <Lock className="h-3 w-3" />
              Upgrade necesar
            </>
          ) : (
            <>
              Rulează
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
