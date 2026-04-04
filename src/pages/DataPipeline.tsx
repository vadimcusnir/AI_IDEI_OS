import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useDataCollection } from "@/hooks/useDataCollection";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Brain, Database, CheckCircle2, Sparkles, Layers, BarChart3, FileDown, Beaker, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { useTranslation } from "react-i18next";

interface PipelineStats {
  total_units: number;
  validated_units: number;
  llm_ready_units: number;
  avg_quality: number;
  avg_confidence: number;
  categories: number;
  datasets: number;
  total_samples: number;
  validated_samples: number;
  by_type: { unit_type: string; count: number; avg_quality: number }[];
  recent_runs: { id: string; source_type: string; status: string; units_extracted: number; units_validated: number; created_at: string }[];
}

export default function DataPipeline() {
  const { categories, units, stats, loading, selectedCategory, setSelectedCategory } = useDataCollection();
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const { t } = useTranslation("pages");

  useEffect(() => {
    supabase.rpc("data_pipeline_stats").then(({ data }) => {
      if (data) setPipelineStats(data as unknown as PipelineStats);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const validationRate = stats && stats.total_units > 0
    ? Math.round((stats.validated_units / stats.total_units) * 100) : 0;
  const llmReadyRate = stats && stats.total_units > 0
    ? Math.round((stats.llm_ready_units / stats.total_units) * 100) : 0;

  return (
    <PremiumGate requiredTier="pro" featureName="Data Pipeline" fallback="overlay">
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title={`${t("data_pipeline.title")} — AI-IDEI`} description={t("data_pipeline.subtitle")} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t("data_pipeline.title")}</h1>
              <p className="text-[10px] text-muted-foreground">{t("data_pipeline.subtitle")}</p>
            </div>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Brain} label={t("data_pipeline.cognitive_units")} value={stats?.total_units ?? 0} />
            <StatCard icon={CheckCircle2} label={t("data_pipeline.validated")} value={stats?.validated_units ?? 0} accent="text-status-validated" />
            <StatCard icon={Sparkles} label={t("data_pipeline.llm_ready")} value={stats?.llm_ready_units ?? 0} accent="text-primary" />
            <StatCard icon={BarChart3} label={t("data_pipeline.avg_quality")} value={`${((stats?.avg_quality ?? 0) * 100).toFixed(0)}%`} />
          </div>

          {/* Progress bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider">{t("data_pipeline.validation_rate")}</span>
                <span className="font-mono">{validationRate}%</span>
              </div>
              <Progress value={validationRate} className="h-2" />
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider">{t("data_pipeline.llm_readiness")}</span>
                <span className="font-mono">{llmReadyRate}%</span>
              </div>
              <Progress value={llmReadyRate} className="h-2" />
            </div>
          </div>

          {/* Training Datasets & Type Breakdown */}
          {pipelineStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Beaker className="h-3 w-3" /> {t("data_pipeline.training_datasets")}
                </h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono">{pipelineStats.datasets}</p>
                    <p className="text-[9px] text-muted-foreground">{t("data_pipeline.datasets")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono">{pipelineStats.total_samples}</p>
                    <p className="text-[9px] text-muted-foreground">{t("data_pipeline.samples")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono">{pipelineStats.validated_samples}</p>
                    <p className="text-[9px] text-muted-foreground">{t("data_pipeline.validated")}</p>
                  </div>
                </div>
                {pipelineStats.total_samples > 0 && (
                  <div>
                    <div className="flex justify-between text-[9px] mb-1">
                      <span className="text-muted-foreground">{t("data_pipeline.sample_validation")}</span>
                      <span className="font-mono">{Math.round((pipelineStats.validated_samples / pipelineStats.total_samples) * 100)}%</span>
                    </div>
                    <Progress value={(pipelineStats.validated_samples / pipelineStats.total_samples) * 100} className="h-1.5" />
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Layers className="h-3 w-3" /> {t("data_pipeline.by_unit_type")}
                </h3>
                {(pipelineStats.by_type || []).length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">{t("data_pipeline.no_data")}</p>
                ) : (
                  <div className="space-y-2">
                    {pipelineStats.by_type.slice(0, 6).map(tp => (
                      <div key={tp.unit_type}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="font-mono">{tp.unit_type}</span>
                          <span className="text-muted-foreground">{tp.count}</span>
                        </div>
                        <Progress value={(tp.avg_quality || 0) * 100} className="h-1" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Collection Runs */}
          {pipelineStats && (pipelineStats.recent_runs || []).length > 0 && (
            <div className="mb-6">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {t("data_pipeline.recent_runs")}
              </h3>
              <div className="space-y-1">
                {pipelineStats.recent_runs.map(run => (
                  <div key={run.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border">
                    <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0 h-4",
                      run.status === "completed" ? "text-status-validated border-status-validated/30" :
                      run.status === "failed" ? "text-destructive border-destructive/30" :
                      "text-primary border-primary/30"
                    )}>
                      {run.status}
                    </Badge>
                    <span className="text-xs flex-1">{run.source_type}</span>
                    <span className="text-[9px] text-muted-foreground">{run.units_extracted} {t("data_pipeline.extracted")}</span>
                    <span className="text-[9px] text-muted-foreground">{run.units_validated} {t("data_pipeline.validated").toLowerCase()}</span>
                    <span className="text-[9px] text-muted-foreground/60 font-mono">
                      {new Date(run.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors",
                !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("data_pipeline.all_categories")}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors",
                  selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Units list */}
          {units.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">{t("data_pipeline.no_units")}</p>
              <p className="text-[10px] text-muted-foreground/60">{t("data_pipeline.no_units_hint")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {units.map(unit => {
                const cat = categories.find(c => c.id === unit.category_id);
                return (
                  <div key={unit.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors">
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                      unit.llm_ready ? "bg-primary/10" :
                      unit.is_validated ? "bg-status-validated/10" :
                      "bg-muted"
                    )}>
                      {unit.llm_ready ? (
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      ) : unit.is_validated ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-status-validated" />
                      ) : (
                        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium truncate">{unit.title}</p>
                        {cat && (
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 shrink-0">
                            {cat.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{(unit.content ?? "").slice(0, 100)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {(unit.quality_score * 100).toFixed(0)}%
                      </span>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        unit.confidence > 0.7 ? "bg-status-validated" :
                        unit.confidence > 0.4 ? "bg-primary" :
                        "bg-destructive"
                      )} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
    </PremiumGate>
  );
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn("h-3.5 w-3.5", accent || "text-muted-foreground")} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-xl font-bold font-mono", accent)}>{value}</span>
    </div>
  );
}
