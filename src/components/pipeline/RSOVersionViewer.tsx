import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, ChevronDown, ChevronUp, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RSOVersion {
  id: string;
  version: number;
  raw_output: Record<string, unknown>;
  source_context: string | null;
  model_used: string | null;
  confidence: number;
  token_count: number;
  created_at: string;
}

interface Props {
  neuronId: number;
}

export function RSOVersionViewer({ neuronId }: Props) {
  const [versions, setVersions] = useState<RSOVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("rso_versions") as any)
      .select("*")
      .eq("neuron_id", neuronId)
      .order("version", { ascending: false });
    setVersions((data as RSOVersion[]) || []);
    setLoading(false);
  }, [neuronId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  if (versions.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">No RSO versions recorded.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold">RSO Versions ({versions.length})</h4>
      </div>
      {versions.map(v => (
        <div key={v.id} className="border border-border rounded-md bg-card">
          <button
            onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium text-foreground">v{v.version}</span>
              <span className="text-muted-foreground">{v.model_used || "unknown"}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                v.confidence > 0.8 ? "bg-emerald-500/10 text-emerald-400" :
                v.confidence > 0.5 ? "bg-amber-500/10 text-amber-400" :
                "bg-red-500/10 text-red-400"
              )}>
                {(v.confidence * 100).toFixed(0)}%
              </span>
            </div>
            {expandedId === v.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {expandedId === v.id && (
            <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
              <div className="flex gap-4 text-[10px] text-muted-foreground">
                <span>{v.token_count} tokens</span>
                <span>{new Date(v.created_at).toLocaleDateString()}</span>
              </div>
              {v.source_context && (
                <p className="text-[11px] text-muted-foreground italic">{v.source_context}</p>
              )}
              <div className="bg-muted/50 rounded p-2 max-h-48 overflow-auto">
                <pre className="text-[10px] font-mono text-foreground whitespace-pre-wrap">
                  {JSON.stringify(v.raw_output, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
