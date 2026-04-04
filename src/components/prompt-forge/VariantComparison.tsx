import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Copy, Star, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RatingStars } from "./RatingStars";

export interface Variant {
  index: number;
  result: string;
  loading: boolean;
  rating?: number;
}

interface VariantComparisonProps {
  variants: Variant[];
  onRate: (index: number, rating: number) => void;
  onSelect: (index: number) => void;
  selectedIndex?: number;
}

export function VariantComparison({ variants, onRate, onSelect, selectedIndex }: VariantComparisonProps) {
  const { t } = useTranslation("pages");

  const copyVariant = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("prompt_forge.copied"));
  }, [t]);

  if (variants.every(v => !v.result && !v.loading)) return null;

  return (
    <div className="space-y-3">
      <span className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
        {t("prompt_forge.variants_label", { defaultValue: "Variante generate" })}
      </span>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {variants.map((v) => (
          <div
            key={v.index}
            onClick={() => v.result && onSelect(v.index)}
            className={cn(
              "rounded-xl border p-4 cursor-pointer transition-all min-h-[200px] max-h-[50vh] overflow-y-auto",
              selectedIndex === v.index
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-micro font-bold text-muted-foreground">
                V{v.index + 1}
              </span>
              <div className="flex items-center gap-1">
                {v.result && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => { e.stopPropagation(); copyVariant(v.result); }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            {v.loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : v.result ? (
              <div className="prose prose-sm max-w-none dark:prose-invert text-xs">
                <ReactMarkdown>{v.result}</ReactMarkdown>
              </div>
            ) : null}

            {/* Rating */}
            {v.result && !v.loading && (
              <div className="mt-3 pt-3 border-t border-border" onClick={e => e.stopPropagation()}>
                <RatingStars
                  value={v.rating || 0}
                  onChange={(r) => onRate(v.index, r)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
