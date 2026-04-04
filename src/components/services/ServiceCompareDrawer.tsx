/**
 * ServiceCompareDrawer — Side-by-side comparison of 2-3 selected services.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Zap, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Service {
  id: string;
  service_key: string;
  name: string;
  description: string;
  service_class: string;
  category: string;
  credits_cost: number;
  access_tier: string;
}

interface ServiceCompareDrawerProps {
  services: Service[];
  onRemove: (id: string) => void;
  onClear: () => void;
  categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }>;
  classBadge: Record<string, { label: string; description: string; className: string }>;
}

const ROWS = [
  { key: "category", label: "Category" },
  { key: "service_class", label: "Class" },
  { key: "credits_cost", label: "Cost (NEURONS)" },
  { key: "access_tier", label: "Required Tier" },
] as const;

export function ServiceCompareDrawer({ services, onRemove, onClear, categoryConfig, classBadge }: ServiceCompareDrawerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");

  if (services.length === 0) return null;

  const cheapest = services.reduce((a, b) => a.credits_cost < b.credits_cost ? a : b);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl shadow-black/20"
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {t("services.compare_title", "Compare Services")}
              <span className="text-xs text-muted-foreground font-normal">({services.length}/3)</span>
            </h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={onClear}>
              <X className="h-3 w-3" /> {t("services.clear_compare", "Clear")}
            </Button>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-micro text-muted-foreground font-semibold uppercase tracking-wider py-1.5 pr-4 w-28" />
                  {services.map(s => (
                    <th key={s.id} className="text-left py-1.5 px-3 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{s.name}</span>
                        <button
                          onClick={() => onRemove(s.id)}
                          className="shrink-0 h-4 w-4 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(row => (
                  <tr key={row.key} className="border-t border-border/50">
                    <td className="text-micro text-muted-foreground font-semibold uppercase tracking-wider py-2 pr-4">
                      {row.label}
                    </td>
                    {services.map(s => {
                      const val = s[row.key];
                      let display: React.ReactNode = val;

                      if (row.key === "category") {
                        const cfg = categoryConfig[val as string];
                        display = (
                          <span className={cn("flex items-center gap-1", cfg?.color)}>
                            {cfg && <cfg.icon className="h-3 w-3" />}
                            {cfg?.label || val}
                          </span>
                        );
                      } else if (row.key === "service_class") {
                        const cls = classBadge[val as string] || classBadge.A;
                        display = (
                          <span className={cn("text-micro font-bold uppercase px-1.5 py-0.5 rounded-md", cls.className)}>
                            {cls.label}
                          </span>
                        );
                      } else if (row.key === "credits_cost") {
                        const isCheapest = s.id === cheapest.id && services.length > 1;
                        display = (
                          <span className={cn("flex items-center gap-1 font-mono font-bold", isCheapest && "text-primary")}>
                            <Coins className="h-3 w-3 text-ai-accent" />
                            {val}
                            {isCheapest && <span className="text-nano text-primary bg-primary/10 px-1 rounded">Best</span>}
                          </span>
                        );
                      } else if (row.key === "access_tier") {
                        display = (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            {(val as string || "free").toUpperCase()}
                          </span>
                        );
                      }

                      return (
                        <td key={s.id} className="py-2 px-3">{display}</td>
                      );
                    })}
                  </tr>
                ))}
                {/* Description row */}
                <tr className="border-t border-border/50">
                  <td className="text-micro text-muted-foreground font-semibold uppercase tracking-wider py-2 pr-4">
                    Description
                  </td>
                  {services.map(s => (
                    <td key={s.id} className="py-2 px-3 text-dense text-muted-foreground leading-relaxed">
                      {s.description}
                    </td>
                  ))}
                </tr>
                {/* Action row */}
                <tr className="border-t border-border/50">
                  <td />
                  {services.map(s => (
                    <td key={s.id} className="py-2 px-3">
                      <Button
                        size="sm"
                        className="text-xs gap-1 h-7"
                        onClick={() => navigate(`/run/${s.service_key}`)}
                      >
                        Run <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
