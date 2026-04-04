import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Brain, Heart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassificationRow {
  id: string;
  dimension: "cognitive" | "emotional" | "behavioral";
  label: string;
  score: number;
  sub_labels: string[];
  model_version: string | null;
  created_at: string;
}

const DIMENSION_META: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  cognitive: { icon: Brain, color: "text-blue-400", label: "Cognitive" },
  emotional: { icon: Heart, color: "text-rose-400", label: "Emotional" },
  behavioral: { icon: Activity, color: "text-emerald-400", label: "Behavioral" },
};

interface Props {
  neuronId: number;
}

export function ClassificationEngine({ neuronId }: Props) {
  const [results, setResults] = useState<ClassificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("classification_results") as any)
      .select("*")
      .eq("neuron_id", neuronId)
      .order("dimension");
    setResults((data as ClassificationRow[]) || []);
    setLoading(false);
  }, [neuronId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  const dimensions: ("cognitive" | "emotional" | "behavioral")[] = ["cognitive", "emotional", "behavioral"];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold flex items-center gap-2">
        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
        Classification Engine (3D)
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {dimensions.map(dim => {
          const result = results.find(r => r.dimension === dim);
          const meta = DIMENSION_META[dim];
          const Icon = meta.icon;
          return (
            <div key={dim} className="border border-border rounded-md p-3 bg-card space-y-2">
              <div className="flex items-center gap-1.5">
                <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{meta.label}</span>
              </div>
              {result ? (
                <>
                  <p className="text-sm font-medium text-foreground">{result.label}</p>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={cn("h-1.5 rounded-full", meta.color.replace("text-", "bg-"))}
                      style={{ width: `${result.score * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{(result.score * 100).toFixed(0)}% confidence</span>
                  {result.sub_labels && Array.isArray(result.sub_labels) && result.sub_labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.sub_labels.map((sl, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{sl}</span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">Not classified</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
