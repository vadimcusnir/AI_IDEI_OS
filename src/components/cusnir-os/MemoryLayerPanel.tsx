/**
 * MemoryLayerPanel — Persistent learning, pattern storage, feedback loops
 * Spec section 8 (Memory + Learning)
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Brain, Repeat, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { format } from "date-fns";

interface MemoryPattern {
  id: string;
  pattern_type: string;
  category: string;
  frequency: number;
  effectiveness_score: number;
  last_used_at: string | null;
  created_at: string;
}

interface OSExecution {
  id: string;
  status: string;
  credits_cost: number;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  success: "text-status-validated bg-status-validated/10",
  failure: "text-destructive bg-destructive/10",
  optimization: "text-primary bg-primary/10",
};

const STATUS_ICON: Record<string, typeof TrendingUp> = {
  completed: TrendingUp,
  failed: TrendingDown,
  pending: Clock,
  running: Repeat,
};

interface MemoryLayerPanelProps {
  patterns: MemoryPattern[];
  executions: OSExecution[];
}

export function MemoryLayerPanel({ patterns, executions }: MemoryLayerPanelProps) {
  const successRate = executions.length > 0
    ? Math.round((executions.filter(e => e.status === "completed").length / executions.length) * 100)
    : 0;

  const avgDuration = executions.filter(e => e.duration_ms).length > 0
    ? Math.round(executions.filter(e => e.duration_ms).reduce((s, e) => s + (e.duration_ms || 0), 0) / executions.filter(e => e.duration_ms).length)
    : 0;

  const totalCredits = executions.reduce((s, e) => s + (Number(e.credits_cost) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Memory Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MemStatCard label="Patterns" value={patterns.length} />
        <MemStatCard label="Executions" value={executions.length} />
        <MemStatCard label="Success Rate" value={`${successRate}%`} />
        <MemStatCard label="Avg Duration" value={avgDuration > 0 ? `${avgDuration}ms` : "—"} />
      </div>

      {/* Feedback Loop Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" /> Feedback Loop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 py-3">
            {["Generate", "Score", "Filter", "Deploy", "Learn"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium">{step}</span>
                </div>
                {i < 4 && (
                  <div className="w-4 sm:w-8 h-px bg-border/30" />
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Toate output-urile sunt stocate → modelele sunt actualizate → deciziile se îmbunătățesc autonom.
          </p>
        </CardContent>
      </Card>

      {/* Learned Patterns */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> Learned Patterns ({patterns.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {patterns.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground/40">
              Niciun pattern învățat încă. Sistemul va începe să acumuleze pattern-uri pe măsură ce execuțiile se procesează.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {patterns.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <Badge className={cn("text-[9px]", TYPE_COLORS[p.pattern_type] || "bg-muted text-muted-foreground")}>
                    {p.pattern_type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/80 capitalize">{p.category}</p>
                    <p className="text-[10px] text-muted-foreground/40">
                      Frecvență: {p.frequency} · Eficacitate: {Number(p.effectiveness_score).toFixed(1)}
                    </p>
                  </div>
                  {p.last_used_at && (
                    <span className="text-[9px] text-muted-foreground/30 tabular-nums">
                      {format(new Date(p.last_used_at), "dd MMM")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Recent Executions ({executions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {executions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground/40">
              Nicio execuție înregistrată.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Credits</th>
                    <th className="text-right p-3 font-medium">Duration</th>
                    <th className="text-right p-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.slice(0, 15).map((e) => {
                    const SIcon = STATUS_ICON[e.status] || Minus;
                    return (
                      <tr key={e.id} className="border-b border-border/30">
                        <td className="p-3">
                          <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium",
                            e.status === "completed" ? "text-status-validated" :
                            e.status === "failed" ? "text-destructive" :
                            "text-muted-foreground"
                          )}>
                            <SIcon className="h-3 w-3" /> {e.status}
                          </span>
                        </td>
                        <td className="p-3 text-right tabular-nums">{Number(e.credits_cost).toFixed(0)}N</td>
                        <td className="p-3 text-right tabular-nums text-muted-foreground">
                          {e.duration_ms ? `${e.duration_ms}ms` : "—"}
                        </td>
                        <td className="p-3 text-right tabular-nums text-muted-foreground">
                          {format(new Date(e.created_at), "dd MMM HH:mm")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalCredits > 0 && (
                <div className="px-4 py-2 text-[10px] text-muted-foreground/50 text-right border-t border-border/20">
                  Total consumat: {totalCredits.toFixed(0)} NEURONS
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MemStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-1">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
