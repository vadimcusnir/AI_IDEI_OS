import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreRow {
  id: string;
  axis: string;
  score: number;
  rationale: string | null;
  created_at: string;
}

const AXIS_META: Record<string, { label: string; color: string }> = {
  clarity: { label: "Clarity", color: "bg-blue-400" },
  depth: { label: "Depth", color: "bg-purple-400" },
  originality: { label: "Originality", color: "bg-amber-400" },
  applicability: { label: "Applicability", color: "bg-emerald-400" },
  commercial_potential: { label: "Commercial", color: "bg-rose-400" },
};

const ALL_AXES = ["clarity", "depth", "originality", "applicability", "commercial_potential"];

interface Props {
  neuronId: number;
}

export function ScoringRadar({ neuronId }: Props) {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("scoring_results") as any)
      .select("*")
      .eq("neuron_id", neuronId);
    setScores((data as ScoreRow[]) || []);
    setLoading(false);
  }, [neuronId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  const avg = scores.length > 0
    ? scores.reduce((s, r) => s + Number(r.score), 0) / scores.length
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold">Multi-Axial Scoring</h4>
        </div>
        {scores.length > 0 && (
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full",
            avg >= 7 ? "bg-emerald-500/10 text-emerald-400" :
            avg >= 4 ? "bg-amber-500/10 text-amber-400" :
            "bg-red-500/10 text-red-400"
          )}>
            Avg: {avg.toFixed(1)}/10
          </span>
        )}
      </div>
      <div className="space-y-2">
        {ALL_AXES.map(axis => {
          const result = scores.find(s => s.axis === axis);
          const meta = AXIS_META[axis];
          const score = result ? Number(result.score) : 0;
          return (
            <div key={axis} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{meta.label}</span>
                <span className="font-mono text-foreground">{result ? score.toFixed(1) : "—"}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={cn("h-1.5 rounded-full transition-all", meta.color)}
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
              {result?.rationale && (
                <p className="text-[10px] text-muted-foreground italic pl-1">{result.rationale}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
