import { motion } from "framer-motion";
import { Zap, Layers, Server, ArrowRight, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ServiceAny } from "@/types/services";

const LEVEL_CONFIG = {
  L3: { label: "Quick Service", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  L2: { label: "Service Pack", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  L1: { label: "Master System", icon: Server, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
} as const;

interface ServiceLevelCardProps {
  service: ServiceAny;
  index: number;
  onClick: (s: ServiceAny) => void;
}

export function ServiceLevelCard({ service, index, onClick }: ServiceLevelCardProps) {
  const cfg = LEVEL_CONFIG[service.level];
  const Icon = cfg.icon;
  const deliveryMin = Math.ceil(service.estimated_delivery_seconds / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => onClick(service)}
      className={cn(
        "group relative bg-card border rounded-xl p-4 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer flex flex-col",
        cfg.border, "hover:border-primary/30"
      )}
    >
      {/* Level badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", cfg.bg)}>
            <Icon className={cn("h-4 w-4", cfg.color)} />
          </div>
          <Badge variant="outline" className={cn("text-nano", cfg.border, cfg.color)}>
            {cfg.label}
          </Badge>
        </div>
        <Badge variant="outline" className="text-nano text-muted-foreground">
          {service.category}
        </Badge>
      </div>

      {/* Title & description */}
      <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
        {service.service_name}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">
        {service.description_public}
      </p>

      {/* Deliverable & time */}
      <div className="flex items-center gap-3 text-micro text-muted-foreground mb-3">
        <span className="font-medium text-foreground">{service.deliverable_name}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ~{deliveryMin}min
        </span>
      </div>

      {/* Price footer */}
      <div className="mt-auto pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-primary" />
            <span className="text-sm font-bold">${service.price_usd}</span>
          </div>
          <span className="text-nano text-muted-foreground font-mono">
            {service.internal_credit_cost}N
          </span>
        </div>
        <Button
          variant="default"
          size="sm"
          className="w-full h-8 text-xs font-semibold gap-1.5"
          onClick={e => { e.stopPropagation(); onClick(service); }}
        >
          Detalii
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}
