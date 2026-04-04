/**
 * NeuronInsights — AI-powered analytics panel for the neuron library.
 * Shows category distribution, quality heatmap, growth trends, and smart suggestions.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Lightbulb, Layers, Network, MessageSquareQuote,
  Target, Boxes, TrendingUp, AlertTriangle, Sparkles,
  BarChart3, Zap, ArrowRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { NeuronListItem } from "@/hooks/useNeuronList";

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string; bgColor: string }> = {
  insight: { icon: Lightbulb, color: "text-amber-500", bgColor: "bg-amber-500", label: "Insight" },
  framework: { icon: Layers, color: "text-blue-500", bgColor: "bg-blue-500", label: "Framework" },
  pattern: { icon: Network, color: "text-violet-500", bgColor: "bg-violet-500", label: "Pattern" },
  narrative: { icon: MessageSquareQuote, color: "text-emerald-500", bgColor: "bg-emerald-500", label: "Narrative" },
  commercial: { icon: Target, color: "text-rose-500", bgColor: "bg-rose-500", label: "Commercial" },
  psychological: { icon: Brain, color: "text-pink-500", bgColor: "bg-pink-500", label: "Psychological" },
  strategy: { icon: Boxes, color: "text-cyan-500", bgColor: "bg-cyan-500", label: "Strategy" },
};

interface NeuronInsightsProps {
  neurons: NeuronListItem[];
  onClose: () => void;
}

interface Suggestion {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  route: string;
  priority: "high" | "medium" | "low";
}

export function NeuronInsights({ neurons, onClose }: NeuronInsightsProps) {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = neurons.length;
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalScore = 0;
    let scoredCount = 0;
    let uncategorized = 0;
    let drafts = 0;
    const recentCount = neurons.filter(n => {
      const age = Date.now() - new Date(n.updated_at).getTime();
      return age < 7 * 86400000; // 7 days
    }).length;

    neurons.forEach(n => {
      byStatus[n.status] = (byStatus[n.status] || 0) + 1;
      if (n.content_category) {
        byCategory[n.content_category] = (byCategory[n.content_category] || 0) + 1;
      } else {
        uncategorized++;
      }
      if (n.score > 0) { totalScore += n.score; scoredCount++; }
      if (n.status === "draft") drafts++;
    });

    const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
    const publishedPct = total > 0 ? Math.round(((byStatus["published"] || 0) / total) * 100) : 0;
    const activePct = total > 0 ? Math.round(((byStatus["active"] || 0) / total) * 100) : 0;

    // Sort categories by count
    const categoryEntries = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
    const topCategory = categoryEntries[0];
    const weakestCategory = categoryEntries.length > 1 ? categoryEntries[categoryEntries.length - 1] : null;

    return {
      total, byStatus, byCategory, categoryEntries,
      avgScore, uncategorized, drafts, recentCount,
      publishedPct, activePct, topCategory, weakestCategory,
    };
  }, [neurons]);

  // Generate smart suggestions
  const suggestions = useMemo<Suggestion[]>(() => {
    const s: Suggestion[] = [];

    if (stats.uncategorized > 3) {
      s.push({
        id: "categorize",
        icon: Brain,
        title: `${stats.uncategorized} neurons uncategorized`,
        description: "Run AI categorization to organize your knowledge library",
        action: "Auto-categorize",
        route: "/home?q=/extract categorize uncategorized neurons",
        priority: "high",
      });
    }

    if (stats.drafts > 5) {
      s.push({
        id: "publish",
        icon: Sparkles,
        title: `${stats.drafts} neurons still in draft`,
        description: "Review and publish to make them available for AI services",
        action: "Review drafts",
        route: "/neurons?filter=draft",
        priority: "medium",
      });
    }

    if (stats.total > 10 && stats.avgScore < 50) {
      s.push({
        id: "quality",
        icon: TrendingUp,
        title: "Low average quality score",
        description: `Average score: ${stats.avgScore}. Enrich neurons with more context to improve quality.`,
        action: "Improve quality",
        route: "/home?q=/analyze neuron quality and suggest improvements",
        priority: "high",
      });
    }

    if (stats.total > 20 && stats.categoryEntries.length < 3) {
      s.push({
        id: "diversity",
        icon: Layers,
        title: "Low category diversity",
        description: "Most neurons are in the same category. Extract from different content sources.",
        action: "Diversify",
        route: "/extractor",
        priority: "medium",
      });
    }

    if (stats.total > 15 && stats.recentCount < 2) {
      s.push({
        id: "growth",
        icon: Zap,
        title: "Knowledge growth slowing",
        description: "No new neurons in the past week. Upload fresh content to keep growing.",
        action: "Upload content",
        route: "/extractor",
        priority: "low",
      });
    }

    return s;
  }, [stats]);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 300, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="border-l border-border bg-card flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold">Library Insights</span>
        <div className="flex-1" />
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Quick Stats */}
        <div className="px-4 py-3 border-b border-border/50">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Published", value: `${stats.publishedPct}%`, color: "text-status-validated" },
              { label: "Avg Score", value: stats.avgScore, color: "text-primary" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</div>
                <div className="text-nano text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="px-4 py-3 border-b border-border/50">
          <h4 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">Category Distribution</h4>
          <div className="space-y-2">
            {stats.categoryEntries.map(([cat, count]) => {
              const config = CATEGORY_CONFIG[cat];
              const pct = Math.round((count / stats.total) * 100);
              const Icon = config?.icon || Brain;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("h-3 w-3", config?.color || "text-muted-foreground")} />
                      <span className="text-micro font-medium">{config?.label || cat}</span>
                    </div>
                    <span className="text-nano text-muted-foreground tabular-nums">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={cn("h-full rounded-full", config?.bgColor || "bg-muted-foreground")}
                    />
                  </div>
                </div>
              );
            })}
            {stats.uncategorized > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-micro font-medium text-amber-500">Uncategorized</span>
                  </div>
                  <span className="text-nano text-muted-foreground tabular-nums">{stats.uncategorized}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500/50" style={{ width: `${Math.round((stats.uncategorized / stats.total) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="px-4 py-3 border-b border-border/50">
          <h4 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">Status Breakdown</h4>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <Badge key={status} variant="outline" className="text-nano gap-1">
                <div className={cn("h-1.5 w-1.5 rounded-full",
                  status === "published" ? "bg-status-validated" :
                  status === "active" ? "bg-primary" :
                  status === "draft" ? "bg-muted-foreground/40" : "bg-muted-foreground/20"
                )} />
                {status} ({count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="px-4 py-3 border-b border-border/50">
          <h4 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">Activity</h4>
          <div className="flex items-center gap-2">
            <TrendingUp className={cn("h-3.5 w-3.5", stats.recentCount > 3 ? "text-status-validated" : "text-amber-500")} />
            <span className="text-xs">
              <span className="font-bold">{stats.recentCount}</span> neurons updated this week
            </span>
          </div>
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 py-3">
            <h4 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
              Suggestions
            </h4>
            <div className="space-y-2">
              {suggestions.map(s => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-lg border p-2.5 transition-all hover:border-primary/30 cursor-pointer",
                      s.priority === "high" ? "border-amber-500/20 bg-amber-500/5" : "border-border"
                    )}
                    onClick={() => navigate(s.route)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0",
                        s.priority === "high" ? "text-amber-500" : "text-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-dense font-medium">{s.title}</p>
                        <p className="text-nano text-muted-foreground mt-0.5">{s.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <span className="text-nano text-primary flex items-center gap-0.5 font-medium">
                        {s.action} <ArrowRight className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
