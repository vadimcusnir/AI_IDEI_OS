/**
 * CompletionOfferCard — Shows gap-anchored completion offers.
 * Each offer is tied to a real detected gap in the user's knowledge.
 */
import { motion } from "framer-motion";
import { ArrowRight, Brain, Sparkles, Zap, Bot, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CompletionOffer } from "@/hooks/useNeuronGapAnalysis";

const levelIcons = [Brain, Sparkles, Zap, Bot, Monitor];
const levelColors = [
  "border-blue-500/20 bg-blue-500/5",
  "border-primary/20 bg-primary/5",
  "border-amber-500/20 bg-amber-500/5",
  "border-purple-500/20 bg-purple-500/5",
  "border-emerald-500/20 bg-emerald-500/5",
];

interface Props {
  offer: CompletionOffer;
  onAction?: (offer: CompletionOffer) => void;
  onDismiss?: (offerId: string) => void;
  className?: string;
}

export function CompletionOfferCard({ offer, onAction, onDismiss, className }: Props) {
  const Icon = levelIcons[offer.level - 1] || Brain;
  const colorClass = levelColors[offer.level - 1] || levelColors[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border p-4", colorClass, className)}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-background/60 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">{offer.title}</p>
            <Badge variant="outline" className="text-micro">{offer.levelLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{offer.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Anchored in: <span className="font-medium text-foreground">{offer.anchoredGap}</span> gap
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => onAction?.(offer)}>
              Explore <ArrowRight className="h-3 w-3" />
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => onDismiss(offer.id)}
              >
                Later
              </Button>
            )}
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              ~{offer.estimatedCost.toLocaleString()}N
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
