import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Layers, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChainNode {
  id: string;
  neuron_id: number | null;
  pattern_id: string | null;
  layer: number;
  layer_label: string;
  title: string;
  content: string;
  parent_node_id: string | null;
  depth_score: number;
  created_at: string;
}

const LAYER_META: Record<string, { color: string; bg: string }> = {
  insight: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  idea: { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  pattern: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  formula: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  application: { color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  contradiction: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
};

const LAYER_ORDER = ["insight", "idea", "pattern", "formula", "application", "contradiction"];

interface Props {
  neuronId?: number;
  userId?: string;
}

export function CognitiveChainViewer({ neuronId, userId }: Props) {
  const [nodes, setNodes] = useState<ChainNode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = (supabase.from("cognitive_chain_nodes") as any)
      .select("*")
      .order("layer", { ascending: true });
    if (neuronId) query = query.eq("neuron_id", neuronId);
    if (userId) query = query.eq("created_by", userId);
    const { data } = await query;
    setNodes((data as ChainNode[]) || []);
    setLoading(false);
  }, [neuronId, userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  const grouped = LAYER_ORDER.map(label => ({
    label,
    nodes: nodes.filter(n => n.layer_label === label),
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold">Cognitive Chain (6 Layers)</h4>
      </div>

      {nodes.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No cognitive chain nodes.</p>
      ) : (
        <div className="space-y-1">
          {/* Layer flow indicator */}
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {LAYER_ORDER.map((label, i) => {
              const count = grouped[i].nodes.length;
              const meta = LAYER_META[label];
              return (
                <div key={label} className="flex items-center gap-1">
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded border font-medium",
                    count > 0 ? meta.bg : "bg-muted/30 border-border text-muted-foreground"
                  )}>
                    L{i + 1} {label} ({count})
                  </span>
                  {i < LAYER_ORDER.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                </div>
              );
            })}
          </div>

          {/* Nodes per layer */}
          {grouped.filter(g => g.nodes.length > 0).map(group => {
            const meta = LAYER_META[group.label];
            return (
              <div key={group.label} className="space-y-1.5">
                {group.nodes.map(node => (
                  <div key={node.id} className={cn("border rounded-md p-3 space-y-1", meta.bg)}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-medium", meta.color)}>{node.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        depth: {(node.depth_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    {node.content && (
                      <p className="text-[11px] text-muted-foreground line-clamp-3">{node.content}</p>
                    )}
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      {node.neuron_id && <span>N{node.neuron_id}</span>}
                      {node.parent_node_id && <span>↑ parent</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
