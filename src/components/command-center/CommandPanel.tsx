/**
 * CommandPanel — T8.5: User-facing command suggestions panel.
 * Shows AI-prioritized next actions with one-click execution.
 * Integrates with command-engine Edge Function.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Zap, DollarSign, TrendingUp, Shield,
  AlertTriangle, Target, Play, ChevronDown, ChevronUp,
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

interface CommandResult {
  decision_id: string;
  command_type: string;
  priority_score: number;
  next_actions: NextAction[];
  priority_tasks: Array<{ title: string; urgency: string }>;
  warnings: Array<{ message: string; severity: string }>;
  pipeline_duration_ms: number;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  generate_revenue: DollarSign,
  improve_conversion: TrendingUp,
  build_authority: Shield,
  optimize_system: Zap,
  reduce_risk: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  generate_revenue: "text-status-validated",
  improve_conversion: "text-primary",
  build_authority: "text-blue-500",
  optimize_system: "text-amber-500",
  reduce_risk: "text-destructive",
};

const TYPE_LABELS: Record<string, string> = {
  generate_revenue: "Revenue",
  improve_conversion: "Conversion",
  build_authority: "Authority",
  optimize_system: "System",
  reduce_risk: "Risk",
};

interface CommandPanelProps {
  onExecuteAction?: (action: NextAction) => void;
}

export function CommandPanel({ onExecuteAction }: CommandPanelProps) {
  const [result, setResult] = useState<CommandResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const analyze = useCallback(async (goal: string) => {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("command-engine", {
        body: { action: "analyze", user_goal: goal },
      });
      if (error) throw error;
      setResult(data);
      setExpanded(true);
    } catch (err: any) {
      toast.error(err.message || "Command engine error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExecute = useCallback(async (action: NextAction) => {
    if (onExecuteAction) {
      onExecuteAction(action);
    }
    if (result?.decision_id) {
      await supabase.functions.invoke("command-engine", {
        body: { action: "execute", decision_id: result.decision_id },
      });
      toast.success(`Executing: ${action.title}`);
    }
  }, [result, onExecuteAction]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Quick Goal Input */}
      <div className="p-3 flex gap-2">
        <input
          type="text"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze(goalInput)}
          placeholder="What do you want to achieve?"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          disabled={loading}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => analyze(goalInput)}
          disabled={loading || !goalInput.trim()}
          className="h-7 gap-1 text-xs"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
          Analyze
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="border-t border-border">
          {/* Header */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = TYPE_ICONS[result.command_type] || Zap;
                return <Icon className={cn("h-3.5 w-3.5", TYPE_COLORS[result.command_type])} />;
              })()}
              <span className="text-xs font-medium">
                {TYPE_LABELS[result.command_type] || result.command_type}
              </span>
              <Badge variant="outline" className="text-[9px]">
                P{result.priority_score.toFixed(1)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {result.next_actions.length} actions • {result.pipeline_duration_ms}ms
              </span>
            </div>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Warnings */}
          {expanded && result.warnings.length > 0 && (
            <div className="px-3 pb-2 space-y-1">
              {result.warnings.map((w, i) => (
                <div key={i} className={cn(
                  "rounded-md px-3 py-1.5 text-[10px] flex items-center gap-2",
                  w.severity === "critical" ? "bg-destructive/10 text-destructive" :
                  w.severity === "warn" ? "bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {w.message}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {expanded && (
            <div className="px-3 pb-3 space-y-1.5">
              {result.next_actions.map((action, i) => {
                const Icon = TYPE_ICONS[action.type] || Zap;
                return (
                  <div key={i} className="rounded-lg border border-border bg-background p-2.5 flex items-center gap-2.5 hover:bg-muted/20 transition-colors group">
                    <div className="h-6 w-6 rounded-md bg-card border border-border flex items-center justify-center shrink-0">
                      <Icon className={cn("h-3 w-3", TYPE_COLORS[action.type])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium truncate">{action.title}</span>
                        <Badge variant="secondary" className="text-[8px] shrink-0">
                          P{action.priority_score.toFixed(1)}
                        </Badge>
                      </div>
                      <p className="text-[9px] text-muted-foreground truncate">{action.reason}</p>
                    </div>
                    {action.estimated_credits > 0 && (
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {action.estimated_credits}N
                      </span>
                    )}
                    {action.service_unit_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleExecute(action)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
