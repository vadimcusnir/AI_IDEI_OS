/**
 * ServiceFilters — Expandable filters panel for service catalog.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ServiceFiltersProps {
  show: boolean;
  activeCategory: string | null;
  onSetCategory: (cat: string | null) => void;
  costRange: number;
  onSetCostRange: (r: number) => void;
  categories: [string, number][];
  totalCount: number;
  categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }>;
  costRanges: { label: string; min: number; max: number }[];
}

export function ServiceFilters({
  show, activeCategory, onSetCategory, costRange, onSetCostRange,
  categories, totalCount, categoryConfig, costRanges,
}: ServiceFiltersProps) {
  const { t } = useTranslation("pages");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden mb-5"
        >
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {/* Category filter */}
            <div>
              <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("services.filter_category")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onSetCategory(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    !activeCategory
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  All ({totalCount})
                </button>
                {categories.map(([cat, count]) => {
                  const cfg = categoryConfig[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => onSetCategory(activeCategory === cat ? null : cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                        activeCategory === cat
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {cfg && <cfg.icon className="h-3 w-3" />}
                      {cfg?.label || cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cost filter */}
            <div>
              <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("services.filter_cost")}
              </p>
              <div className="flex gap-1.5">
                {costRanges.map((range, i) => (
                  <button
                    key={i}
                    onClick={() => onSetCostRange(costRange === i ? 0 : i)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium font-mono transition-all",
                      costRange === i
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(activeCategory || costRange > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => { onSetCategory(null); onSetCostRange(0); }}
              >
                <X className="h-3 w-3 mr-1" /> {t("services.clear_filters")}
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
