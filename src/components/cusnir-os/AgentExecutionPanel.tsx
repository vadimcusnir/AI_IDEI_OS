/**
 * AgentExecutionPanel — Agent Swarm control surface
 * Launch agents with AI, monitor live executions, view results
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Bot, Play, Loader2, CheckCircle2, XCircle, Clock,
  Zap, Activity, AlertTriangle, Eye, Brain, Network,
  Target, Megaphone, Shield, Sparkles, Boxes, TrendingUp,
  Workflow, Layers, Search,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface OSAgent {
  id: string;
  role: string;
  capabilities: string[];
  agent_type: string;
  status: string;
  performance_score: number;
  last_active_at: string | null;
  metadata?: Record<string, unknown>;
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

interface AgentExecutionPanelProps {
  agents: OSAgent[];
  executions: OSExecution[];
  onStartExecution: (agentId: string, input?: Record<string, unknown>) => Promise<{ success: boolean; error?: string; execution_id?: string }>;
  onCompleteExecution: (executionId: string) => Promise<{ success: boolean }>;
  executing: string | null;
}

const AGENT_ICONS: Record<string, typeof Bot> = {
  identity_sim: Eye,
  behavioral_scanner: Target,
  narrative_dom: Megaphone,
  influence_graph: Network,
  viral_gen: Sparkles,
  reputation_sys: Shield,
  offer_mult: Boxes,
  pricing_intel: TrendingUp,
  funnel_auto: Workflow,
  stepback: Layers,
  agent_swarm: Bot,
  knowledge_arb: Search,
};

const TYPE_COLORS: Record<string, string> = {
  cognitive: "text-purple-400 bg-purple-400/10",
  social: "text-blue-400 bg-blue-400/10",
  commercial: "text-emerald-400 bg-emerald-400/10",
  infrastructure: "text-amber-400 bg-amber-400/10",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-status-validated/10 text-status-validated",
  standby: "bg-muted text-muted-foreground",
};

const EXEC_STATUS: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  running: { color: "text-primary", icon: Loader2 },
  completed: { color: "text-status-validated", icon: CheckCircle2 },
  failed: { color: "text-destructive", icon: XCircle },
};

const CREDIT_COSTS: Record<string, number> = {
  cognitive: 15,
  social: 12,
  commercial: 18,
  infrastructure: 20,
};

export function AgentExecutionPanel({
  agents,
  executions,
  onStartExecution,
  onCompleteExecution,
  executing,
}: AgentExecutionPanelProps) {
  const [view, setView] = useState<"agents" | "history">("agents");
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [expandedExec, setExpandedExec] = useState<string | null>(null);

  const activeExecs = executions.filter(e => e.status === "running");
  const historyExecs = executions.filter(e => e.status !== "running").slice(0, 15);

  return (
    <div className="space-y-4">
      {/* Live Executions Banner */}
      <AnimatePresence>
        {activeExecs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs font-semibold text-primary">
                    {activeExecs.length} execuție{activeExecs.length > 1 ? "i" : ""} activă{activeExecs.length > 1 ? "e" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {activeExecs.map(exec => {
                    const agent = agents.find(a => a.id === exec.agent_id);
                    return (
                      <div key={exec.id} className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                          <span className="text-xs font-medium">{agent?.role || "Agent"}</span>
                          <Badge variant="outline" className="text-nano">{exec.credits_cost}N</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-micro"
                          onClick={() => onCompleteExecution(exec.id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Finalizează
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle */}
      <div className="flex gap-1 border-b border-border/30">
        {(["agents", "history"] as const).map(v => (
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
            {v === "agents" ? `Agent Swarm (${agents.length})` : `Istoric (${historyExecs.length})`}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      {view === "agents" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.map(agent => {
            const moduleKey = (agent.metadata as Record<string, string>)?.module_key || "";
            const AgentIcon = AGENT_ICONS[moduleKey] || Bot;
            const cost = CREDIT_COSTS[agent.agent_type] || 10;
            const isExecuting = executing === agent.id;
            const isStandby = agent.status === "standby";

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "transition-all",
                  isStandby && "opacity-60"
                )}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center",
                          TYPE_COLORS[agent.agent_type] || "bg-muted"
                        )}>
                          <AgentIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-tight">{agent.role}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge className={cn("text-nano h-4", STATUS_BADGE[agent.status])}>
                              {agent.status}
                            </Badge>
                            <span className="text-micro text-muted-foreground capitalize">{agent.agent_type}</span>
                          </div>
                        </div>
                      </div>
                      {/* Performance */}
                      <div className="text-right">
                        <div className="text-micro text-muted-foreground">Performance</div>
                        <div className={cn(
                          "text-sm font-bold tabular-nums",
                          agent.performance_score >= 0.85 ? "text-status-validated" :
                          agent.performance_score >= 0.7 ? "text-warning" : "text-destructive"
                        )}>
                          {(agent.performance_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map(cap => (
                        <Badge key={cap} variant="outline" className="text-nano font-normal">
                          {cap.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>

                    {/* Prompt Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Prompt pentru ${agent.role}...`}
                        className="h-7 text-micro"
                        value={prompts[agent.id] || ""}
                        onChange={e => setPrompts(p => ({ ...p, [agent.id]: e.target.value }))}
                        disabled={isStandby || isExecuting}
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-micro text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        <span>{cost}N / execuție</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-micro gap-1"
                        disabled={isStandby || isExecuting}
                        onClick={() => {
                          const prompt = prompts[agent.id] || undefined;
                          onStartExecution(agent.id, prompt ? { prompt } : { mode: "standard" });
                          setPrompts(p => ({ ...p, [agent.id]: "" }));
                        }}
                      >
                        {isExecuting ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Execuție AI...</>
                        ) : (
                          <><Play className="h-3 w-3" /> Execută AI</>
                        )}
                      </Button>
                    </div>

                    {/* Last active */}
                    {agent.last_active_at && (
                      <div className="text-nano text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Ultima activitate: {format(new Date(agent.last_active_at), "dd MMM HH:mm")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Execution History */}
      {view === "history" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Istoric Execuții
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {historyExecs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nicio execuție înregistrată.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {historyExecs.map(exec => {
                  const agent = agents.find(a => a.id === exec.agent_id);
                  const statusInfo = EXEC_STATUS[exec.status] || EXEC_STATUS.completed;
                  const StatusIcon = statusInfo.icon;
                  const hasOutput = exec.output && Object.keys(exec.output).length > 0 && !('error' in exec.output);
                  const isExpanded = expandedExec === exec.id;

                  return (
                    <div key={exec.id}>
                      <button
                        className="w-full p-3 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left"
                        onClick={() => hasOutput && setExpandedExec(isExpanded ? null : exec.id)}
                      >
                        <StatusIcon className={cn(
                          "h-4 w-4 shrink-0",
                          statusInfo.color,
                          exec.status === "running" && "animate-spin"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{agent?.role || "Agent necunoscut"}</p>
                          <div className="flex items-center gap-2 text-micro text-muted-foreground mt-0.5">
                            <span>{format(new Date(exec.created_at), "dd MMM HH:mm")}</span>
                            {exec.duration_ms && <span>· {(exec.duration_ms / 1000).toFixed(1)}s</span>}
                            <span>· {exec.credits_cost}N</span>
                            {hasOutput && <Badge variant="outline" className="text-nano h-3.5 text-primary">AI Output ↓</Badge>}
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-nano", statusInfo.color)}>
                          {exec.status}
                        </Badge>
                      </button>
                      <AnimatePresence>
                        {isExpanded && hasOutput && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3">
                              <div className="bg-muted/30 rounded-lg p-3 text-micro font-mono max-h-60 overflow-auto whitespace-pre-wrap text-foreground/80">
                                {JSON.stringify(exec.output, null, 2)}
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
    </div>
  );
}
