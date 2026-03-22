import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendingEntity {
  id: string;
  slug: string;
  title: string;
  entity_type: string;
  importance_score: number;
  is_emerging: boolean;
  propagation_value_score: number;
}

const TYPE_PATH: Record<string, string> = {
  insight: "insights",
  pattern: "patterns",
  formula: "formulas",
  application: "applications",
  contradiction: "contradictions",
  profile: "profiles",
};

export function TrendingIdeasWidget() {
  const [items, setItems] = useState<TrendingEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch top entities by importance_score (which is PVS * 100)
      const { data: entities } = await supabase
        .from("entities")
        .select("id, slug, title, entity_type, importance_score, idea_rank")
        .eq("is_published", true)
        .order("idea_rank", { ascending: false })
        .limit(10);

      if (!entities || entities.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch emergence status from idea_metrics
      const entityIds = entities.map((e) => e.id);
      const { data: metrics } = await supabase
        .from("idea_metrics")
        .select("node_id, is_emerging, propagation_value_score")
        .in("node_id", entityIds);

      const metricsMap = new Map(
        (metrics || []).map((m) => [m.node_id, m])
      );

      const merged: TrendingEntity[] = entities.map((e) => {
        const m = metricsMap.get(e.id);
        return {
          ...e,
          importance_score: e.importance_score ?? 0,
          is_emerging: m?.is_emerging ?? false,
          propagation_value_score: m?.propagation_value_score ?? 0,
        };
      });

      setItems(merged);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3 w-3" /> Trending Ideas
        </h3>
        <div className="flex items-center justify-center py-6">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3 w-3" /> Trending Ideas
        </h3>
        <p className="text-xs text-muted-foreground py-4 text-center">
          No published entities yet. Run the entity projection pipeline to populate.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" /> Trending Ideas
        </h3>
        <Link
          to="/insights"
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <Link
            key={item.id}
            to={`/${TYPE_PATH[item.entity_type] || "insights"}/${item.slug}`}
            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group"
          >
            <span className="text-[9px] font-mono text-muted-foreground/60 w-4 shrink-0">
              {idx + 1}
            </span>
            <span className="text-xs truncate flex-1 group-hover:text-primary transition-colors">
              {item.title}
            </span>
            {item.is_emerging && (
              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                <Sparkles className="h-2.5 w-2.5" />
                Rising
              </span>
            )}
            <span className={cn(
              "text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0",
              "bg-muted text-muted-foreground"
            )}>
              {(item as any).idea_rank ? `IR ${((item as any).idea_rank as number).toFixed(1)}` : item.importance_score.toFixed(0)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
