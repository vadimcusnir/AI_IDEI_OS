import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shapes, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtractedPattern {
  id: string;
  source_neuron_ids: number[];
  pattern_type: string;
  title: string;
  description: string;
  evidence: unknown[];
  frequency: number;
  confidence: number;
  tags: string[];
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  behavioral: "bg-emerald-500/10 text-emerald-400",
  rhetorical: "bg-blue-500/10 text-blue-400",
  strategic: "bg-amber-500/10 text-amber-400",
  cognitive: "bg-purple-500/10 text-purple-400",
  emotional: "bg-rose-500/10 text-rose-400",
};

interface Props {
  neuronIds?: number[];
  userId?: string;
}

export function PatternExtractor({ neuronIds, userId }: Props) {
  const [patterns, setPatterns] = useState<ExtractedPattern[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = (supabase.from("extracted_patterns") as any)
      .select("*")
      .order("frequency", { ascending: false })
      .limit(50);
    if (userId) query = query.eq("created_by", userId);
    const { data } = await query;
    setPatterns((data as ExtractedPattern[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shapes className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold">Extracted Patterns ({patterns.length})</h4>
      </div>
      {patterns.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No patterns extracted yet.</p>
      ) : (
        <div className="space-y-2">
          {patterns.map(p => (
            <div key={p.id} className="border border-border rounded-md p-3 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[p.pattern_type] || "bg-muted text-muted-foreground")}>
                    {p.pattern_type}
                  </span>
                  <span className="text-xs font-medium text-foreground">{p.title}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>×{p.frequency}</span>
                  <span>{(p.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              {p.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
              )}
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" />{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground">
                Sources: {p.source_neuron_ids.map(id => `N${id}`).join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
