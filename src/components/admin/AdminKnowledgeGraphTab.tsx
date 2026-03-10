import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Zap, RefreshCw, Loader2, BarChart3, Link2, Tag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KGStats {
  totalEntities: number;
  publishedEntities: number;
  totalRelations: number;
  totalTopics: number;
  byType: Record<string, number>;
  topEntities: Array<{ title: string; entity_type: string; importance_score: number; idea_rank: number; slug: string }>;
}

export function AdminKnowledgeGraphTab() {
  const [stats, setStats] = useState<KGStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [projecting, setProjecting] = useState(false);
  const [computing, setComputing] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const [entAll, entPub, rels, topics, byTypeRes, topRes] = await Promise.all([
      supabase.from("entities").select("id", { count: "exact", head: true }),
      supabase.from("entities").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("entity_relations").select("id", { count: "exact", head: true }),
      supabase.from("topics").select("id", { count: "exact", head: true }),
      supabase.from("entities").select("entity_type").eq("is_published", true),
      supabase.from("entities")
        .select("title, entity_type, importance_score, idea_rank, slug")
        .eq("is_published", true)
        .order("importance_score", { ascending: false })
        .limit(15),
    ]);

    const byType: Record<string, number> = {};
    (byTypeRes.data || []).forEach((e: any) => {
      byType[e.entity_type] = (byType[e.entity_type] || 0) + 1;
    });

    setStats({
      totalEntities: entAll.count ?? 0,
      publishedEntities: entPub.count ?? 0,
      totalRelations: rels.count ?? 0,
      totalTopics: topics.count ?? 0,
      byType,
      topEntities: (topRes.data as any[]) || [],
    });
    setLoading(false);
  }, []);

  const projectEntities = async () => {
    setProjecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-entities", {
        body: { action: "project_all" },
      });
      if (error) throw error;
      toast.success(`Projected: ${data.created} new, ${data.updated} updated, ${data.relationsCreated} relations`);
      await loadStats();
    } catch (err: any) {
      toast.error(err.message || "Projection failed");
    } finally {
      setProjecting(false);
    }
  };

  const computeIdeaRank = async () => {
    setComputing(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-entities", {
        body: { action: "compute_idearank" },
      });
      if (error) throw error;
      toast.success("IdeaRank computed successfully");
      await loadStats();
    } catch (err: any) {
      toast.error(err.message || "IdeaRank computation failed");
    } finally {
      setComputing(false);
    }
  };

  // Auto-load on first render
  if (!stats && !loading) {
    loadStats();
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={projectEntities} disabled={projecting} size="sm" className="gap-1.5">
          {projecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Project Neurons → Entities
        </Button>
        <Button onClick={computeIdeaRank} disabled={computing} size="sm" variant="outline" className="gap-1.5">
          {computing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
          Compute IdeaRank
        </Button>
        <Button onClick={loadStats} disabled={loading} size="sm" variant="ghost" className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {stats && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KGKpi icon={Brain} label="Total Entities" value={stats.totalEntities} />
            <KGKpi icon={Brain} label="Published" value={stats.publishedEntities} color="text-primary" />
            <KGKpi icon={Link2} label="Relations" value={stats.totalRelations} />
            <KGKpi icon={Tag} label="Topics" value={stats.totalTopics} />
          </div>

          {/* Entity type breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" /> Entity Distribution
            </h3>
            {Object.keys(stats.byType).length === 0 ? (
              <p className="text-xs text-muted-foreground">No entities yet. Project neurons to populate the knowledge graph.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const max = Math.max(...Object.values(stats.byType));
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{type}s</span>
                          <span className="font-mono font-bold">{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* IdeaRank Leaderboard */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> IdeaRank Leaderboard
            </h3>
            {stats.topEntities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No ranked entities yet.</p>
            ) : (
              <div className="space-y-1">
                {stats.topEntities.map((e, i) => (
                  <div key={e.slug} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-xs truncate flex-1">{e.title}</span>
                    <span className="text-[9px] uppercase text-muted-foreground/60">{e.entity_type}</span>
                    <span className="text-[10px] font-mono text-primary">{e.importance_score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KGKpi({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-lg font-bold font-mono", color)}>{value}</p>
    </div>
  );
}
