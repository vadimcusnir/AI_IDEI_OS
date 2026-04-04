import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Brain, Zap, RefreshCw, Loader2, BarChart3, Link2, Tag, TrendingUp, Activity, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KGStats {
  totalEntities: number;
  publishedEntities: number;
  totalRelations: number;
  totalTopics: number;
  byType: Record<string, number>;
  topEntities: Array<{ title: string; entity_type: string; importance_score: number; slug: string }>;
}

interface PVSMetrics {
  node_id: string;
  title: string;
  entity_type: string;
  activation_score: number;
  growth_score: number;
  acceleration_score: number;
  pagerank_score: number;
  betweenness_score: number;
  authority_score: number;
  economic_conversion_score: number;
  novelty_score: number;
  decay_risk_score: number;
  propagation_value_score: number;
  amplification_probability: number;
  emergence_score: number;
  connectivity_growth: number;
  centrality_delta: number;
  structural_rarity: number;
  is_emerging: boolean;
  model_version: string;
  computed_at: string;
}

export function AdminKnowledgeGraphTab() {
  const { t } = useTranslation(["common", "errors"]);
  const [stats, setStats] = useState<KGStats | null>(null);
  const [pvsMetrics, setPvsMetrics] = useState<PVSMetrics[]>([]);
  const [emergingIdeas, setEmergingIdeas] = useState<PVSMetrics[]>([]);
  const [earlySignals, setEarlySignals] = useState<PVSMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [projecting, setProjecting] = useState(false);
  const [computing, setComputing] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const [entAll, entPub, rels, topics, byTypeRes, topRes, metricsRes, emergingRes, earlyRes] = await Promise.all([
      supabase.from("entities").select("id", { count: "exact", head: true }),
      supabase.from("entities").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("entity_relations").select("id", { count: "exact", head: true }),
      supabase.from("topics").select("id", { count: "exact", head: true }),
      supabase.from("entities").select("entity_type").eq("is_published", true),
      supabase.from("entities")
        .select("title, entity_type, importance_score, slug")
        .eq("is_published", true)
        .order("importance_score", { ascending: false })
        .limit(15),
      supabase.from("idea_metrics")
        .select("node_id, activation_score, growth_score, acceleration_score, pagerank_score, betweenness_score, authority_score, economic_conversion_score, novelty_score, decay_risk_score, propagation_value_score, amplification_probability, emergence_score, connectivity_growth, centrality_delta, structural_rarity, is_emerging, model_version, computed_at")
        .order("propagation_value_score", { ascending: false })
        .limit(20),
      // Rising Ideas: emerging = true, sorted by emergence_score
      supabase.from("idea_metrics")
        .select("node_id, activation_score, growth_score, acceleration_score, novelty_score, emergence_score, connectivity_growth, centrality_delta, structural_rarity, is_emerging, propagation_value_score, authority_score, economic_conversion_score, pagerank_score, betweenness_score, decay_risk_score, amplification_probability, model_version, computed_at")
        .eq("is_emerging", true)
        .order("emergence_score", { ascending: false })
        .limit(15),
      // Early Signals: high acceleration + low pagerank
      supabase.from("idea_metrics")
        .select("node_id, activation_score, growth_score, acceleration_score, novelty_score, emergence_score, connectivity_growth, centrality_delta, structural_rarity, is_emerging, propagation_value_score, authority_score, economic_conversion_score, pagerank_score, betweenness_score, decay_risk_score, amplification_probability, model_version, computed_at")
        .gt("acceleration_score", 0)
        .order("acceleration_score", { ascending: false })
        .limit(10),
    ]);

    const byType: Record<string, number> = {};
    (byTypeRes.data || []).forEach((e: any) => {
      byType[e.entity_type] = (byType[e.entity_type] || 0) + 1;
    });

    // Collect all node_ids to enrich with titles
    const allMetrics = [...(metricsRes.data || []), ...(emergingRes.data || []), ...(earlyRes.data || [])];
    const uniqueNodeIds = [...new Set(allMetrics.map((m: any) => m.node_id))];

    let entityMap = new Map<string, { title: string; entity_type: string }>();
    if (uniqueNodeIds.length > 0) {
      const { data: entities } = await supabase
        .from("entities")
        .select("id, title, entity_type")
        .in("id", uniqueNodeIds);
      entityMap = new Map((entities || []).map((e: any) => [e.id, e]));
    }

    const enrichMetrics = (data: any[]): PVSMetrics[] =>
      data.map((m: any) => {
        const ent = entityMap.get(m.node_id) || { title: "Unknown", entity_type: "unknown" };
        return { ...m, title: ent.title, entity_type: ent.entity_type };
      });

    setStats({
      totalEntities: entAll.count ?? 0,
      publishedEntities: entPub.count ?? 0,
      totalRelations: rels.count ?? 0,
      totalTopics: topics.count ?? 0,
      byType,
      topEntities: (topRes.data as any[]) || [],
    });
    setPvsMetrics(enrichMetrics(metricsRes.data || []));
    setEmergingIdeas(enrichMetrics(emergingRes.data || []));
    setEarlySignals(enrichMetrics(earlyRes.data || []));
    setLoading(false);
  }, []);

  const projectEntities = async () => {
    setProjecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-entities", {
        body: { action: "project_all" },
      });
      if (error) throw error;
      toast.success(t("common:projected_entities", { created: data.created, updated: data.updated, relations: data.relationsCreated }));
      await loadStats();
    } catch (err: any) {
      toast.error(err.message || t("errors:projection_failed"));
    } finally {
      setProjecting(false);
    }
  };

  const computePVS = async () => {
    setComputing(true);
    try {
      const { error } = await supabase.functions.invoke("generate-entities", {
        body: { action: "compute_idearank" },
      });
      if (error) throw error;
      toast.success(t("common:pvs_computed"));
      await loadStats();
    } catch (err: any) {
      toast.error(err.message || t("errors:computation_failed"));
    } finally {
      setComputing(false);
    }
  };

  if (!stats && !loading) loadStats();

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
        <Button onClick={computePVS} disabled={computing} size="sm" variant="outline" className="gap-1.5">
          {computing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
          Compute PVS + Emergence
        </Button>
        <Button onClick={loadStats} disabled={loading} size="sm" variant="ghost" className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
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

          {/* Entity type distribution */}
          <div className="bg-card border border-border rounded-xl p-5">
            <SectionHeader icon={BarChart3} label="Entity Distribution" />
            {Object.keys(stats.byType).length === 0 ? (
              <p className="text-xs text-muted-foreground">No entities yet.</p>
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
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ═══ EMERGENCE DETECTION ═══ */}
          {/* Rising Ideas */}
          <div className="bg-card border border-border rounded-xl p-5">
            <SectionHeader icon={Sparkles} label="Rising Ideas (Emerging)" count={emergingIdeas.length} />
            {emergingIdeas.length === 0 ? (
              <p className="text-xs text-muted-foreground">No emerging ideas detected. Compute PVS + Emergence first.</p>
            ) : (
              <div className="space-y-0.5">
                <div className="grid grid-cols-[24px_1fr_56px_48px_48px_48px_48px_48px] gap-1 px-2 py-1 text-nano font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <span>#</span>
                  <span>Entity</span>
                  <span className="text-right">Emrg</span>
                  <span className="text-right">Nov</span>
                  <span className="text-right">Acc</span>
                  <span className="text-right">Conn↑</span>
                  <span className="text-right">Cen↑</span>
                  <span className="text-right">Rare</span>
                </div>
                {emergingIdeas.map((m, i) => (
                  <div key={m.node_id} className="grid grid-cols-[24px_1fr_56px_48px_48px_48px_48px_48px] gap-1 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors items-center">
                    <span className="text-micro font-mono text-muted-foreground">{i + 1}</span>
                    <div className="truncate">
                      <span className="text-xs">{m.title}</span>
                      <span className="text-nano uppercase text-muted-foreground/50 ml-1.5">{m.entity_type}</span>
                    </div>
                    <span className="text-right text-xs font-mono font-bold text-semantic-emerald">
                      {(m.emergence_score * 100).toFixed(1)}
                    </span>
                    <PVSBar value={m.novelty_score} color="bg-semantic-purple/70" />
                    <PVSBar value={m.acceleration_score} color="bg-semantic-blue/70" />
                    <PVSBar value={Math.min(1, m.connectivity_growth)} color="bg-semantic-amber/70" />
                    <PVSBar value={Math.min(1, m.centrality_delta * 10)} color="bg-semantic-rose/70" />
                    <PVSBar value={m.structural_rarity} color="bg-semantic-teal/70" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Early Signals */}
          <div className="bg-card border border-border rounded-xl p-5">
            <SectionHeader icon={AlertTriangle} label="Early Signals (Pre-Trend)" count={earlySignals.length} />
            {earlySignals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No acceleration signals detected.</p>
            ) : (
              <div className="space-y-0.5">
                <div className="grid grid-cols-[24px_1fr_56px_48px_48px_48px] gap-1 px-2 py-1 text-nano font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <span>#</span>
                  <span>Entity</span>
                  <span className="text-right">Acc</span>
                  <span className="text-right">PR</span>
                  <span className="text-right">Grw</span>
                  <span className="text-right">Nov</span>
                </div>
                {earlySignals.map((m, i) => (
                  <div key={m.node_id} className="grid grid-cols-[24px_1fr_56px_48px_48px_48px] gap-1 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors items-center">
                    <span className="text-micro font-mono text-muted-foreground">{i + 1}</span>
                    <div className="truncate">
                      <span className="text-xs">{m.title}</span>
                      <span className="text-nano uppercase text-muted-foreground/50 ml-1.5">{m.entity_type}</span>
                      {m.is_emerging && <span className="text-nano ml-1 px-1 py-0.5 rounded bg-success/20 text-success">EMERGING</span>}
                    </div>
                    <span className="text-right text-xs font-mono font-bold text-semantic-blue">
                      {(m.acceleration_score * 100).toFixed(1)}
                    </span>
                    <PVSBar value={m.pagerank_score} color="bg-violet-500/70" />
                    <PVSBar value={m.growth_score} color="bg-emerald-500/70" />
                    <PVSBar value={m.novelty_score} color="bg-amber-500/70" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PVS Leaderboard */}
          <div className="bg-card border border-border rounded-xl p-5">
            <SectionHeader icon={Activity} label="PVS Leaderboard" count={pvsMetrics.length} />
            {pvsMetrics.length === 0 ? (
              <p className="text-xs text-muted-foreground">No PVS metrics yet.</p>
            ) : (
              <div className="space-y-0.5">
                <div className="grid grid-cols-[24px_1fr_60px_48px_48px_48px_48px_48px_56px] gap-1 px-2 py-1 text-nano font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <span>#</span>
                  <span>Entity</span>
                  <span className="text-right">PVS</span>
                  <span className="text-right">Act</span>
                  <span className="text-right">Grw</span>
                  <span className="text-right">Cen</span>
                  <span className="text-right">Auth</span>
                  <span className="text-right">Econ</span>
                  <span className="text-right">Amp%</span>
                </div>
                {pvsMetrics.map((m, i) => (
                  <div key={m.node_id} className="grid grid-cols-[24px_1fr_60px_48px_48px_48px_48px_48px_56px] gap-1 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors items-center">
                    <span className="text-micro font-mono text-muted-foreground">{i + 1}</span>
                    <div className="truncate">
                      <span className="text-xs">{m.title}</span>
                      <span className="text-nano uppercase text-muted-foreground/50 ml-1.5">{m.entity_type}</span>
                      {m.is_emerging && <span className="text-nano ml-1 px-1 py-0.5 rounded bg-success/20 text-success">↑</span>}
                    </div>
                    <span className="text-right text-xs font-mono font-bold text-primary">
                      {(m.propagation_value_score * 100).toFixed(1)}
                    </span>
                    <PVSBar value={m.activation_score} color="bg-semantic-emerald/70" />
                    <PVSBar value={m.growth_score} color="bg-semantic-blue/70" />
                    <PVSBar value={m.pagerank_score} color="bg-semantic-purple/70" />
                    <PVSBar value={m.authority_score} color="bg-semantic-amber/70" />
                    <PVSBar value={m.economic_conversion_score} color="bg-semantic-rose/70" />
                    <span className="text-right text-micro font-mono text-muted-foreground">
                      {(m.amplification_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            {pvsMetrics.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-nano text-muted-foreground/50 flex-wrap">
                <span>Model: {pvsMetrics[0].model_version}</span>
                <span>Computed: {new Date(pvsMetrics[0].computed_at).toLocaleString()}</span>
                <span className="ml-auto">PVS = 0.30·Act + 0.20·Grw + 0.20·Cen + 0.15·Auth + 0.15·Econ</span>
              </div>
            )}
          </div>

          {/* Importance Score (derived) */}
          <div className="bg-card border border-border rounded-xl p-5">
            <SectionHeader icon={TrendingUp} label="Importance Score (PVS-derived)" />
            {stats.topEntities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No ranked entities yet.</p>
            ) : (
              <div className="space-y-1">
                {stats.topEntities.map((e, i) => (
                  <div key={e.slug} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-micro font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-xs truncate flex-1">{e.title}</span>
                    <span className="text-nano uppercase text-muted-foreground/60">{e.entity_type}</span>
                    <span className="text-micro font-mono text-primary">{e.importance_score?.toFixed(1)}</span>
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

function SectionHeader({ icon: Icon, label, count }: { icon: any; label: string; count?: number }) {
  return (
    <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
      <Icon className="h-3 w-3" /> {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 text-nano font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{count}</span>
      )}
    </h3>
  );
}

function KGKpi({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-lg font-bold font-mono", color)}>{value}</p>
    </div>
  );
}

function PVSBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <div className="w-6 h-1 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
      <span className="text-nano font-mono text-muted-foreground w-6 text-right">
        {(value * 100).toFixed(0)}
      </span>
    </div>
  );
}
