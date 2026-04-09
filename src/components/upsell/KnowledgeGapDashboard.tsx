/**
 * KnowledgeGapDashboard — Visual overview of user's knowledge completeness.
 * Shows gaps, completion %, and anchored offers.
 */
import { useNeuronGapAnalysis } from "@/hooks/useNeuronGapAnalysis";
import { CompletionOfferCard } from "./CompletionOfferCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import type { CompletionOffer } from "@/hooks/useNeuronGapAnalysis";

interface Props {
  className?: string;
  compact?: boolean;
}

export function KnowledgeGapDashboard({ className, compact = false }: Props) {
  const { gaps, overallCompletionPct, totalNeurons, offers, loading } = useNeuronGapAnalysis();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleAction = useCallback((offer: CompletionOffer) => {
    navigate("/services");
  }, [navigate]);

  const handleDismiss = useCallback((id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  }, []);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (totalNeurons === 0) return null;
  if (gaps.length === 0 && overallCompletionPct >= 100) {
    return (
      <div className={cn("rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3", className)}>
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Knowledge Profile Complete</p>
          <p className="text-xs text-muted-foreground">Your {totalNeurons} neurons cover all expected dimensions.</p>
        </div>
      </div>
    );
  }

  const visibleOffers = offers.filter(o => !dismissed.has(o.id));

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall completion */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Knowledge Completeness</p>
          <span className="ml-auto text-sm font-mono font-bold text-primary">{overallCompletionPct}%</span>
        </div>
        <Progress value={overallCompletionPct} className="h-2 mb-3" />
        <p className="text-xs text-muted-foreground">
          {totalNeurons} neurons extracted • {gaps.length} dimension{gaps.length !== 1 ? "s" : ""} incomplete
        </p>
      </div>

      {/* Gap breakdown */}
      {!compact && gaps.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-3">Gap Analysis</p>
          <div className="space-y-2">
            {gaps.slice(0, compact ? 3 : 8).map(gap => (
              <div key={gap.dimension} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{gap.label}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-micro",
                          gap.severity === "critical" && "border-destructive/30 text-destructive",
                          gap.severity === "moderate" && "border-amber-500/30 text-amber-600",
                          gap.severity === "low" && "border-muted-foreground/30 text-muted-foreground",
                        )}
                      >
                        {gap.severity === "critical" && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                        {gap.current}/{gap.expected}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={gap.completionPct} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion offers */}
      {visibleOffers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
            Recommended Actions
          </p>
          {visibleOffers.map(offer => (
            <CompletionOfferCard
              key={offer.id}
              offer={offer}
              onAction={handleAction}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
