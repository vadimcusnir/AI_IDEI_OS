/**
 * MemoryLayerPanel — Persistent learning, pattern storage, feedback loops
 * Auto-extracts patterns from agent executions via DB trigger
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain, Repeat, TrendingUp, TrendingDown, Minus, Clock,
  Bot, Zap, BarChart3, Target, Sparkles, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface MemoryPattern {
  id: string;
  pattern_type: string;
  category: string;
  frequency: number;
  effectiveness_score: number;
  last_used_at: string | null;
  created_at: string;
  pattern_data?: Record<string, unknown>;
}

interface OSExecution {
  id: string;
  agent_id?: string;
  status: string;
  credits_cost: number;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  output?: Record<string, unknown>;
  performance?: Record<string, unknown>;
}

const TYPE_COLORS: Record<string, string> = {
  success: "text-status-validated bg-status-validated/10",
  failure: "text-destructive bg-destructive/10",
  optimization: "text-primary bg-primary/10",
  agent_profile: "text-amber-400 bg-amber-400/10",
};

const TYPE_ICONS: Record<string, typeof Brain> = {
  success: TrendingUp,
  failure: TrendingDown,
  optimization: Target,
  agent_profile: Bot,
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

type MemView = "overview" | "patterns" | "agents" | "executions";

export function MemoryLayerPanel({ patterns, executions }: MemoryLayerPanelProps) {
  const [view, setView] = useState<MemView>("overview");
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const successRate = executions.length > 0
    ? Math.round((executions.filter(e => e.status === "completed").length / executions.length) * 100)
    : 0;

  const avgDuration = executions.filter(e => e.duration_ms).length > 0
    ? Math.round(executions.filter(e => e.duration_ms).reduce((s, e) => s + (e.duration_ms || 0), 0) / executions.filter(e => e.duration_ms).length)
    : 0;

  const totalCredits = executions.reduce((s, e) => s + (Number(e.credits_cost) || 0), 0);

  const agentPatterns = patterns.filter(p => p.pattern_type === "agent_profile");
  const learningPatterns = patterns.filter(p => p.pattern_type !== "agent_profile");
  const totalFrequency = patterns.reduce((s, p) => s + p.frequency, 0);
  const avgEffectiveness = patterns.length > 0
    ? patterns.reduce((s, p) => s + Number(p.effectiveness_score), 0) / patterns.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Memory Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <MemStatCard icon={Brain} label="Patterns" value={patterns.length} />
        <MemStatCard icon={Zap} label="Executions" value={executions.length} />
        <MemStatCard icon={TrendingUp} label="Success Rate" value={`${successRate}%`} highlight={successRate >= 80} />
        <MemStatCard icon={Clock} label="Avg Duration" value={avgDuration > 0 ? `${(avgDuration / 1000).toFixed(1)}s` : "—"} />
        <MemStatCard icon={BarChart3} label="Efectivitate" value={`${(avgEffectiveness * 100).toFixed(0)}%`} />
        <MemStatCard icon={Sparkles} label="Total Learn" value={totalFrequency} />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border/30">
        {(["overview", "patterns", "agents", "executions"] as MemView[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
              view === v
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {v === "overview" ? "Feedback Loop" :
             v === "patterns" ? `Patterns (${learningPatterns.length})` :
             v === "agents" ? `Agent Profiles (${agentPatterns.length})` :
             `Executions (${executions.length})`}
          </button>
        ))}
      </div>

      {/* Feedback Loop */}
      {view === "overview" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" /> Autonomous Learning Loop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 py-3">
                {[
                  { step: "Execute", desc: "Agent AI runs", icon: Zap },
                  { step: "Score", desc: "Quality evaluated", icon: Target },
                  { step: "Extract", desc: "Patterns detected", icon: Brain },
                  { step: "Store", desc: "Memory persisted", icon: BarChart3 },
                  { step: "Optimize", desc: "Future runs improved", icon: Sparkles },
                ].map((s, i) => (
                  <div key={s.step} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <s.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-micro font-semibold text-foreground">{s.step}</span>
                      <span className="text-nano text-muted-foreground hidden sm:block">{s.desc}</span>
                    </div>
                    {i < 4 && <div className="w-3 sm:w-6 h-px bg-primary/30" />}
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-muted/20 rounded-lg">
                <p className="text-micro text-muted-foreground">
                  <span className="text-foreground font-medium">Auto-Learning activ:</span> Fiecare execuție de agent generează automat pattern-uri de tip
                  <Badge variant="outline" className="mx-1 text-nano h-4">success</Badge>
                  <Badge variant="outline" className="mx-1 text-nano h-4">failure</Badge>
                  <Badge variant="outline" className="mx-1 text-nano h-4">agent_profile</Badge>
                  care îmbunătățesc deciziile viitoare.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick insight cards */}
          {agentPatterns.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agentPatterns.slice(0, 4).map(ap => {
                const data = ap.pattern_data || {};
                const successRateAgent = Number(data.success_rate || 0) * 100;
                return (
                  <Card key={ap.id} className="bg-card/50">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-semibold truncate">{ap.category}</span>
                        </div>
                        <Badge variant="outline" className="text-nano">{ap.frequency} runs</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-micro">
                        <span className={cn(
                          "font-medium",
                          successRateAgent >= 80 ? "text-status-validated" : successRateAgent >= 50 ? "text-warning" : "text-destructive"
                        )}>
                          {successRateAgent.toFixed(0)}% success
                        </span>
                        <span className="text-muted-foreground">
                          Eficacitate: {(Number(ap.effectiveness_score) * 100).toFixed(0)}%
                        </span>
                        {data.avg_duration_ms && (
                          <span className="text-muted-foreground">
                            ~{(Number(data.avg_duration_ms) / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Learned Patterns */}
      {view === "patterns" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Learned Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {learningPatterns.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground/40">
                Niciun pattern învățat încă. Execută agenți AI pentru a genera pattern-uri automat.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {learningPatterns.map((p) => {
                  const PIcon = TYPE_ICONS[p.pattern_type] || Brain;
                  const isExpanded = expandedPattern === p.id;
                  const data = p.pattern_data || {};

                  return (
                    <div key={p.id}>
                      <button
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left"
                        onClick={() => setExpandedPattern(isExpanded ? null : p.id)}
                      >
                        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", TYPE_COLORS[p.pattern_type])}>
                          <PIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-nano", TYPE_COLORS[p.pattern_type])}>
                              {p.pattern_type}
                            </Badge>
                            <span className="text-xs font-medium capitalize">{p.category}</span>
                          </div>
                          <div className="text-micro text-muted-foreground mt-0.5">
                            Freq: {p.frequency} · Score: {(Number(p.effectiveness_score) * 100).toFixed(0)}%
                            {data.last_agent && <span> · Agent: {String(data.last_agent)}</span>}
                          </div>
                        </div>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3">
                              <div className="bg-muted/30 rounded-lg p-3 text-micro font-mono max-h-40 overflow-auto whitespace-pre-wrap text-foreground/80">
                                {JSON.stringify(data, null, 2)}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Profiles */}
      {view === "agents" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-amber-400" /> Agent Memory Profiles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {agentPatterns.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground/40">
                Niciun profil de agent. Execuțiile AI vor genera automat profiluri de performanță.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {agentPatterns.map(ap => {
                  const data = ap.pattern_data || {};
                  const successRateAgent = Number(data.success_rate || 0) * 100;
                  const totalRuns = Number(data.total_runs || ap.frequency);
                  const avgDur = Number(data.avg_duration_ms || 0);

                  return (
                    <div key={ap.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-amber-400" />
                          <span className="text-xs font-semibold">{ap.category}</span>
                          <Badge variant="outline" className="text-nano capitalize">{String(data.agent_type || "")}</Badge>
                        </div>
                        <span className="text-micro text-muted-foreground">
                          {ap.last_used_at && format(new Date(ap.last_used_at), "dd MMM HH:mm")}
                        </span>
                      </div>
                      {/* Performance bars */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <span className="text-nano text-muted-foreground">Success Rate</span>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all",
                                successRateAgent >= 80 ? "bg-status-validated" : successRateAgent >= 50 ? "bg-warning" : "bg-destructive"
                              )}
                              style={{ width: `${successRateAgent}%` }}
                            />
                          </div>
                          <span className="text-micro font-bold">{successRateAgent.toFixed(0)}%</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-nano text-muted-foreground">Eficacitate</span>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Number(ap.effectiveness_score) * 100}%` }}
                            />
                          </div>
                          <span className="text-micro font-bold">{(Number(ap.effectiveness_score) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-nano text-muted-foreground">Total Runs</span>
                          <div className="text-sm font-bold tabular-nums">{totalRuns}</div>
                          {avgDur > 0 && <span className="text-nano text-muted-foreground">~{(avgDur / 1000).toFixed(1)}s avg</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Executions */}
      {view === "executions" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Execution History
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
                      <th className="text-right p-3 font-medium">Quality</th>
                      <th className="text-right p-3 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.slice(0, 15).map((e) => {
                      const SIcon = STATUS_ICON[e.status] || Minus;
                      const quality = e.performance ? Number((e.performance as Record<string, unknown>).quality || 0) : 0;
                      return (
                        <tr key={e.id} className="border-b border-border/30">
                          <td className="p-3">
                            <span className={cn("inline-flex items-center gap-1 text-micro font-medium",
                              e.status === "completed" ? "text-status-validated" :
                              e.status === "failed" ? "text-destructive" :
                              "text-muted-foreground"
                            )}>
                              <SIcon className="h-3 w-3" /> {e.status}
                            </span>
                          </td>
                          <td className="p-3 text-right tabular-nums">{Number(e.credits_cost).toFixed(0)}N</td>
                          <td className="p-3 text-right tabular-nums text-muted-foreground">
                            {e.duration_ms ? `${(e.duration_ms / 1000).toFixed(1)}s` : "—"}
                          </td>
                          <td className="p-3 text-right">
                            {quality > 0 ? (
                              <span className={cn("text-micro font-medium",
                                quality >= 0.8 ? "text-status-validated" : quality >= 0.6 ? "text-warning" : "text-destructive"
                              )}>
                                {(quality * 100).toFixed(0)}%
                              </span>
                            ) : "—"}
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
                  <div className="px-4 py-2 text-micro text-muted-foreground/50 text-right border-t border-border/20">
                    Total consumat: {totalCredits.toFixed(0)} NEURONS
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MemStatCard({ icon: Icon, label, value, highlight }: { icon: typeof Brain; label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-micro font-medium">{label}</span>
      </div>
      <div className={cn("text-sm font-bold tabular-nums", highlight && "text-status-validated")}>{value}</div>
    </div>
  );
}
