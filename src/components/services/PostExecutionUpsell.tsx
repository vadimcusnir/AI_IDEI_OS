/**
 * PostExecutionUpsell — Shown after a service execution completes.
 * Suggests related services and upgrade paths (L3→L2→L1).
 */
import { useServiceGapDetection, type UpsellSuggestion, type ServiceGap } from "@/hooks/useServiceGapDetection";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  /** The slug of the service just completed */
  completedServiceSlug?: string;
  /** The category of the completed service */
  completedCategory?: string;
  className?: string;
}

export function PostExecutionUpsell({ completedServiceSlug, completedCategory, className }: Props) {
  const { data, isLoading } = useServiceGapDetection();
  const navigate = useNavigate();

  if (isLoading || !data) return null;
  if (data.upsells.length === 0 && data.gaps.length === 0) return null;

  // Prioritize: upsells first, then complementary gaps in the same category
  const relevantGaps = completedCategory
    ? data.gaps.filter(g => g.category === completedCategory && g.service_slug !== completedServiceSlug).slice(0, 3)
    : data.gaps.filter(g => g.reason === "complementary").slice(0, 3);

  const topUpsell = data.upsells[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn("space-y-3", className)}
    >
      {/* Upgrade upsell */}
      {topUpsell && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Upgrade to {topUpsell.to_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You've already used {topUpsell.from_name} — get the full{" "}
                {topUpsell.to_level} pack and{" "}
                {topUpsell.savings_pct > 0 && (
                  <span className="text-primary font-bold">save {topUpsell.savings_pct}%</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-micro">
                  {topUpsell.to_level === "L2" ? "Pack" : "Master System"}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  {topUpsell.to_credit_cost}N
                </span>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-1"
              onClick={() => navigate(`/services/${topUpsell.to_slug}`)}
            >
              View <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Complementary services */}
      {relevantGaps.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Related services</p>
          </div>
          <div className="space-y-2">
            {relevantGaps.map(gap => (
              <button
                key={gap.service_id}
                onClick={() => navigate(`/services/${gap.service_slug}`)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{gap.service_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {gap.deliverable_type} • {gap.internal_credit_cost}N
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exploration progress */}
      {data.explorationPct > 0 && data.explorationPct < 100 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            You've explored <span className="font-bold text-foreground">{data.explorationPct}%</span> of available services
            ({data.totalServicesUsed}/{data.totalServicesAvailable})
          </p>
        </div>
      )}
    </motion.div>
  );
}
