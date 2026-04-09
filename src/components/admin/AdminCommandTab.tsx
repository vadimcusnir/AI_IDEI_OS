/**
 * AdminCommandTab — Strategic decision panel powered by command-engine.
 * Phase 8 / T8.4 — Now uses real backend pipeline.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw, Loader2, Compass, AlertTriangle,
  TrendingUp, Zap, Target, Shield, DollarSign,
  Send, Clock, CheckCircle, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NextAction {
  title: string;
  type: string;
  priority_score: number;
  estimated_credits: number;
  reason: string;
  service_unit_id: string | null;
}

interface Warning {
  message: string;
  severity: string;
}

interface DecisionResult {
  decision_id: string;
  command_type: string;
  priority_score: number;
  next_actions: NextAction[];
  warnings: Warning[];
  pipeline_duration_ms: number;
}

interface HistoryItem {
  id: string;
  user_goal: string;
  command_type: string;
  priority_score: number;
  status: string;
  created_at: string;
  warnings: Warning[] | null;
  next_actions: NextAction[] | null;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  generate_revenue: { icon: DollarSign, color: "text-status-validated" },
  improve_conversion: { icon: TrendingUp, color: "text-primary" },
  build_authority: { icon: Shield, color: "text-info" },
  optimize_system: { icon: Zap, color: "text-amber-500" },
  reduce_risk: { icon: AlertTriangle, color: "text-destructive" },
};

export function AdminCommandTab() {
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.functions.invoke("command-engine", {
      body: { action: "history", limit: 10 },
    });
    if (data?.decisions) setHistory(data.decisions);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const analyze = useCallback(async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("command-engine", {
        body: { action: "analyze", user_goal: goal.trim() },
      });
      if (error) throw error;
      setResult(data as DecisionResult);
      setShowHistory(false);
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [goal, loadHistory]);

  const executeDecision = useCallback(async (decisionId: string) => {
    const { error } = await supabase.functions.invoke("command-engine", {
      body: { action: "execute", decision_id: decisionId },
    });
    if (error) { toast.error("Execution failed"); return; }
    toast.success("Execution triggered");
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Compass className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Command Engine</h2>
            <p className="text-micro text-muted-foreground">6-stage decision pipeline with priority scoring</p>
          </div>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="gap-1 text-xs h-8"
        >
          <History className="h-3 w-3" />
          {showHistory ? "Back" : "History"}
        </Button>
      </div>

      {/* Goal Input */}
      {!showHistory && (
        <div className="flex gap-2">
          <Input
            placeholder="Describe your business objective..."
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && analyze()}
            className="text-sm"
            disabled={loading}
          />
          <Button onClick={analyze} disabled={loading || !goal.trim()} size="sm" className="gap-1 shrink-0">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Analyze
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-8 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Running 6-stage pipeline...</span>
        </div>
      )}

      {/* Result */}
      {result && !showHistory && <DecisionResultView result={result} onExecute={executeDecision} />}

      {/* History */}
      {showHistory && <DecisionHistory items={history} onSelect={(item) => {
        setResult({
          decision_id: item.id,
          command_type: item.command_type,
          priority_score: item.priority_score,
          next_actions: item.next_actions || [],
          warnings: item.warnings || [],
          pipeline_duration_ms: 0,
        });
        setShowHistory(false);
      }} />}
    </div>
  );
}

/* ═══ Sub-components ═══ */

function DecisionResultView({ result, onExecute }: { result: DecisionResult; onExecute: (id: string) => void }) {
  const config = TYPE_CONFIG[result.command_type] || TYPE_CONFIG.optimize_system;
  const TypeIcon = config.icon;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <TypeIcon className={cn("h-5 w-5", config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold capitalize">{result.command_type.replace(/_/g, " ")}</span>
            <Badge variant="outline" className="text-nano">Score {result.priority_score}</Badge>
            {result.pipeline_duration_ms > 0 && (
              <Badge variant="secondary" className="text-nano gap-1">
                <Clock className="h-2.5 w-2.5" />{result.pipeline_duration_ms}ms
              </Badge>
            )}
          </div>
          <p className="text-micro text-muted-foreground mt-0.5">{result.next_actions.length} actions identified</p>
        </div>
        <Button size="sm" variant="default" className="text-xs h-7 gap-1" onClick={() => onExecute(result.decision_id)}>
          <CheckCircle className="h-3 w-3" /> Execute
        </Button>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="space-y-1.5">
          {result.warnings.map((w, i) => (
            <div key={i} className={cn(
              "rounded-lg border px-3 py-2 flex items-center gap-2",
              w.severity === "critical" ? "border-destructive/30 bg-destructive/5" :
              w.severity === "warn" ? "border-primary/30 bg-primary/5" : "border-border bg-card"
            )}>
              <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0",
                w.severity === "critical" ? "text-destructive" : "text-primary"
              )} />
              <span className="text-xs">{w.message}</span>
              <Badge variant={w.severity === "critical" ? "destructive" : "secondary"} className="text-nano ml-auto shrink-0">
                {w.severity}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {result.next_actions.map((action, i) => {
          const ac = TYPE_CONFIG[action.type] || TYPE_CONFIG.optimize_system;
          const AIcon = ac.icon;
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                  <AIcon className={cn("h-3.5 w-3.5", ac.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold">{action.title}</span>
                    <Badge variant="outline" className="text-nano shrink-0">
                      P{action.priority_score}
                    </Badge>
                    {action.estimated_credits > 0 && (
                      <Badge variant="secondary" className="text-nano shrink-0">
                        {action.estimated_credits} N
                      </Badge>
                    )}
                  </div>
                  <p className="text-micro text-muted-foreground">{action.reason}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionHistory({ items, onSelect }: { items: HistoryItem[]; onSelect: (item: HistoryItem) => void }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-8">No decisions yet</p>;
  }
  return (
    <div className="space-y-2">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="w-full text-left rounded-xl border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold truncate">{item.user_goal}</span>
            <Badge variant={item.status === "suggested" ? "default" : item.status === "executing" ? "secondary" : "outline"} className="text-nano shrink-0 ml-2">
              {item.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-micro text-muted-foreground">
            <span className="capitalize">{item.command_type?.replace(/_/g, " ")}</span>
            <span>•</span>
            <span>Score {item.priority_score}</span>
            <span>•</span>
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
