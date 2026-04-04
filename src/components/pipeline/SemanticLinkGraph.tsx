import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Network, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SemanticLink {
  id: string;
  source_neuron_id: number;
  target_neuron_id: number;
  relation_type: string;
  strength: number;
  context: string | null;
  created_at: string;
}

const RELATION_COLORS: Record<string, string> = {
  supports: "text-emerald-400 bg-emerald-500/10",
  contradicts: "text-red-400 bg-red-500/10",
  extends: "text-blue-400 bg-blue-500/10",
  derives: "text-purple-400 bg-purple-500/10",
  opposes: "text-orange-400 bg-orange-500/10",
  complements: "text-cyan-400 bg-cyan-500/10",
};

interface Props {
  neuronId: number;
}

export function SemanticLinkGraph({ neuronId }: Props) {
  const [links, setLinks] = useState<SemanticLink[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: outgoing } = await (supabase.from("semantic_links") as any)
      .select("*")
      .eq("source_neuron_id", neuronId);
    const { data: incoming } = await (supabase.from("semantic_links") as any)
      .select("*")
      .eq("target_neuron_id", neuronId);
    const all = [...(outgoing || []), ...(incoming || [])];
    const unique = Array.from(new Map(all.map((l: SemanticLink) => [l.id, l])).values());
    setLinks(unique as SemanticLink[]);
    setLoading(false);
  }, [neuronId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Network className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold">Semantic Links ({links.length})</h4>
      </div>
      {links.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No semantic links found.</p>
      ) : (
        <div className="space-y-1.5">
          {links.map(link => {
            const isOutgoing = link.source_neuron_id === neuronId;
            const otherNeuron = isOutgoing ? link.target_neuron_id : link.source_neuron_id;
            const colors = RELATION_COLORS[link.relation_type] || "text-muted-foreground bg-muted";
            return (
              <div key={link.id} className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-card text-xs">
                <span className="font-mono text-muted-foreground">N{neuronId}</span>
                <ArrowRight className={cn("h-3 w-3", isOutgoing ? "text-muted-foreground" : "rotate-180 text-muted-foreground")} />
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", colors)}>
                  {link.relation_type}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-foreground">N{otherNeuron}</span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-12 bg-muted rounded-full h-1">
                    <div className="h-1 rounded-full bg-primary" style={{ width: `${link.strength * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{(link.strength * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
