/**
 * ThreeAxisViewer — Displays 3-axis extraction results (psychological, narrative, commercial)
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Brain, BookOpen, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AXIS_CONFIG = {
  psychological: { icon: Brain, label: "Psihologic", color: "text-purple-400", bg: "bg-purple-500/10" },
  narrative: { icon: BookOpen, label: "Narativ", color: "text-sky-400", bg: "bg-sky-500/10" },
  commercial: { icon: TrendingUp, label: "Comercial", color: "text-emerald-400", bg: "bg-emerald-500/10" },
} as const;

interface AxisResult {
  axis: string;
  extraction: Record<string, unknown>;
  confidence: number;
  created_at: string;
}

export function ThreeAxisViewer({ neuronId }: { neuronId: number }) {
  const [results, setResults] = useState<AxisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("axis_extraction_results") as any)
      .select("axis, extraction, confidence, created_at")
      .eq("neuron_id", neuronId)
      .order("created_at", { ascending: false });
    
    // Keep latest per axis
    const latest = new Map<string, AxisResult>();
    (data || []).forEach((r: AxisResult) => {
      if (!latest.has(r.axis)) latest.set(r.axis, r);
    });
    setResults(Array.from(latest.values()));
    setLoading(false);
  }, [neuronId]);

  useEffect(() => { load(); }, [load]);

  const runExtraction = async () => {
    setExtracting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sign in required"); return; }

      const resp = await supabase.functions.invoke("extract-three-axis", {
        body: { neuron_id: neuronId },
      });

      if (resp.error) throw resp.error;
      toast.success("3-axis extraction complete");
      await load();
    } catch (e) {
      toast.error("Extraction failed");
      console.error(e);
    } finally {
      setExtracting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">3-Axis Intelligence Extraction</p>
        <Button size="sm" variant="outline" onClick={runExtraction} disabled={extracting} className="text-xs gap-1.5">
          {extracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {results.length ? "Re-extract" : "Extract"}
        </Button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No extraction results yet. Click Extract to run the 3-axis motor.
        </div>
      ) : (
        <div className="grid gap-3">
          {results.map((r) => {
            const cfg = AXIS_CONFIG[r.axis as keyof typeof AXIS_CONFIG];
            if (!cfg) return null;
            const Icon = cfg.icon;
            return (
              <div key={r.axis} className="border border-border/20 rounded-lg overflow-hidden">
                <div className={cn("px-3 py-2 flex items-center gap-2 border-b border-border/10", cfg.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                  <span className="text-xs font-semibold">{cfg.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {Math.round(r.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {Object.entries(r.extraction).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1">
                        {key.replace(/_/g, " ")}
                      </p>
                      {Array.isArray(val) ? (
                        <ul className="space-y-0.5">
                          {(val as string[]).slice(0, 5).map((item, i) => (
                            <li key={i} className="text-xs text-foreground/70">• {typeof item === "string" ? item : JSON.stringify(item)}</li>
                          ))}
                        </ul>
                      ) : typeof val === "object" && val !== null ? (
                        <pre className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2 overflow-auto max-h-24">
                          {JSON.stringify(val, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-foreground/70">{String(val)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
