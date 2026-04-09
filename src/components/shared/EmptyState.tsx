/**
 * EmptyState — Reusable empty/zero-data state with CTA.
 */
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-micro text-muted-foreground max-w-xs mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="gap-1.5">
          {actionLabel}
          <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </motion.div>
  );
}
