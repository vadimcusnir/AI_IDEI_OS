/**
 * PatternDashboard — Aggregate view of detected patterns across user's neurons
 * Shows pattern frequency, cross-neuron connections, and actionable insights
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Zap, TrendingUp, Layers, ArrowRight, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PatternGroup {
  pattern_type: string;
  count: number;
  examples: string[];
  avg_confidence: number;
}

interface AxisSummary {
  axis: string;
  total: number;
  avg_confidence: number;
}

export function PatternDashboard() {
  const { user } = useAuth();
  const [patterns, setPatterns] = useState<PatternGroup[]>([]);
  const [axisSummary, setAxisSummary] = useState<AxisSummary[]>([]);
  const [totalNeurons, setTotalNeurons] = useState(0);
  const [analyzedNeurons, setAnalyzedNeurons] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [neuronsRes, axisRes, classRes] = await Promise.all([
      supabase.from("neurons").select("id", { count: "exact" }).eq("author_id", user.id),
      (supabase.from("axis_extraction_results") as any)
        .select("axis, confidence, neuron_id")
        .eq("user_id", user.id),
      (supabase.from("classification_results") as any)
        .select("dimension, label, score, neuron_id")
        .eq("classified_by", user.id),
    ]);

    setTotalNeurons(neuronsRes.count ?? 0);

    // Axis summary
    const axisData = axisRes.data || [];
    const axisMap = new Map<string, { total: number; confSum: number }>();
    const analyzedIds = new Set<number>();
    axisData.forEach((r: any) => {
      analyzedIds.add(r.neuron_id);
      const existing = axisMap.get(r.axis) || { total: 0, confSum: 0 };
      existing.total++;
      existing.confSum += (r.confidence || 0);
      axisMap.set(r.axis, existing);
    });
    setAnalyzedNeurons(analyzedIds.size);
    setAxisSummary(
      Array.from(axisMap.entries()).map(([axis, data]) => ({
        axis,
        total: data.total,
        avg_confidence: data.total > 0 ? data.confSum / data.total : 0,
      }))
    );

    // Classification patterns
    const classData = classRes.data || [];
    const patternMap = new Map<string, { count: number; examples: Set<string>; scoreSum: number }>();
    classData.forEach((c: any) => {
      const key = `${c.dimension}:${c.label}`;
      const existing = patternMap.get(key) || { count: 0, examples: new Set<string>(), scoreSum: 0 };
      existing.count++;
      existing.scoreSum += (c.score || 0);
      if (existing.examples.size < 3) existing.examples.add(c.label);
      patternMap.set(key, existing);
    });

    setPatterns(
      Array.from(patternMap.entries())
        .map(([key, data]) => ({
          pattern_type: key.split(":")[0],
          count: data.count,
          examples: Array.from(data.examples),
          avg_confidence: data.count > 0 ? data.scoreSum / data.count : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
    );

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const AXIS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    psychological: { label: "Psihologic", icon: <Brain className="h-4 w-4" />, color: "text-purple-400" },
    narrative: { label: "Narativ", icon: <Layers className="h-4 w-4" />, color: "text-sky-400" },
    commercial: { label: "Comercial", icon: <TrendingUp className="h-4 w-4" />, color: "text-emerald-400" },
  };

  const coveragePercent = totalNeurons > 0 ? Math.round((analyzedNeurons / totalNeurons) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Coverage */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Acoperire Analiză</span>
            <span className="text-xs text-muted-foreground">
              {analyzedNeurons} / {totalNeurons} neuroni analizați
            </span>
          </div>
          <Progress value={coveragePercent} className="h-2" />
          <p className="text-[10px] text-muted-foreground mt-1">
            {coveragePercent}% din neuronii tăi au extracție 3-Axis completă
          </p>
        </CardContent>
      </Card>

      {/* 3-Axis Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["psychological", "narrative", "commercial"] as const).map(axis => {
          const data = axisSummary.find(a => a.axis === axis);
          const cfg = AXIS_LABELS[axis];
          return (
            <Card key={axis}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className="text-sm font-semibold">{cfg.label}</span>
                </div>
                <div className="text-2xl font-bold">{data?.total ?? 0}</div>
                <p className="text-[10px] text-muted-foreground">
                  extracții • {data ? Math.round(data.avg_confidence * 100) : 0}% confidence medie
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Patterns */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Tipare Detectate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid gap-2">
              {patterns.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{p.pattern_type}</Badge>
                    <span className="text-xs text-foreground/70">{p.examples[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">×{p.count}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(p.avg_confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {patterns.length === 0 && axisSummary.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
          <p>Nu există încă date de inteligență.</p>
          <p className="text-xs mt-1">Extrage neuroni din conținut pentru a popula dashboard-ul.</p>
        </div>
      )}
    </div>
  );
}
