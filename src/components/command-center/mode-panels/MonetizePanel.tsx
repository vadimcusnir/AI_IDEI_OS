/**
 * MonetizePanel — Package, price, publish to marketplace.
 */
import { motion } from "framer-motion";
import { DollarSign, Package, Tag, ShoppingBag, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonetizePanelProps {
  onCommand: (prompt: string) => void;
}

const MONETIZE_ACTIONS = [
  { icon: Package, label: "Împachetează Asset", desc: "Creează knowledge asset", prompt: "/monetize package neurons as knowledge asset", accent: "bg-gold/10 text-gold" },
  { icon: Tag, label: "Calculează Preț", desc: "Root2 pricing engine", prompt: "/monetize calculate optimal pricing for asset", accent: "bg-success/10 text-success" },
  { icon: ShoppingBag, label: "Publică Marketplace", desc: "Listează spre vânzare", prompt: "/monetize publish asset to marketplace", accent: "bg-info/10 text-info" },
  { icon: TrendingUp, label: "Revenue Report", desc: "Statistici venituri", prompt: "/monetize show revenue analytics", accent: "bg-destructive/10 text-destructive" },
];

export function MonetizePanel({ onCommand }: MonetizePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="py-2 space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <DollarSign className="h-3 w-3 text-gold" />
          <span className="text-micro font-medium text-muted-foreground/70">Monetizare & Marketplace</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {MONETIZE_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onCommand(action.prompt)}
              className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/40 hover:bg-card/80 hover:border-border/50 transition-all text-left"
            >
              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", action.accent)}>
                <action.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-dense font-medium text-foreground/90 leading-tight">{action.label}</p>
                <p className="text-nano text-muted-foreground/50 leading-tight">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
