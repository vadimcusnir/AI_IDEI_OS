/**
 * EmptyState — Reusable empty/zero-data state with optional CTA.
 * Two visual tones: "default" (muted), "active" (dashed primary border).
 */
import { LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** "default" → bare; "active" → dashed border card highlighting CTA */
  tone?: "default" | "active";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  tone = "default",
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex flex-col items-center justify-center text-center px-6",
        tone === "active"
          ? "py-12 sm:py-16 border-2 border-dashed border-border rounded-2xl bg-muted/20"
          : "py-12",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center mb-4",
          tone === "active"
            ? "h-12 w-12 bg-primary/10 text-primary"
            : "h-14 w-14 bg-muted text-muted-foreground/50",
        )}
      >
        <Icon className={cn(tone === "active" ? "h-6 w-6" : "h-7 w-7")} aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-micro text-muted-foreground max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction} className="gap-1.5">
              {actionLabel}
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          {secondaryLabel && onSecondary && (
            <Button size="sm" variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
