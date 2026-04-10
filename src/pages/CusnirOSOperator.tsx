import { useOSOperator } from "@/hooks/useOSOperator";
import { useOSSuperlayer } from "@/hooks/useOSSuperlayer";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";
import {
  ShieldAlert, Activity, Server, Cpu, Clock, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Terminal, Zap, ScrollText,
  Brain, Users, TrendingUp, Layers, Eye, Target, Megaphone,
  Network, Sparkles, Shield, Workflow, Bot, Search, Boxes,
  Coins, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EconomyLayerPanel } from "@/components/cusnir-os/EconomyLayerPanel";
import { MemoryLayerPanel } from "@/components/cusnir-os/MemoryLayerPanel";
import { AgentExecutionPanel } from "@/components/cusnir-os/AgentExecutionPanel";
import { LockinScorePanel } from "@/components/cusnir-os/LockinScorePanel";
const HEALTH_COLORS: Record<string, string> = {
  healthy: "text-status-validated bg-status-validated/10",
  warning: "text-warning bg-warning/10",
  critical: "text-destructive bg-destructive/10",
};

const HEALTH_ICONS: Record<string, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-status-validated/10 text-status-validated",
  locked: "bg-muted text-muted-foreground",
  deprecated: "bg-destructive/10 text-destructive",
  experimental: "bg-warning/10 text-warning",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-status-validated",
  medium: "text-warning",
  high: "text-semantic-amber",
  critical: "text-destructive",
};

// ─── Superlayer Module Definitions ───

interface SuperModule {
  key: string;
  name: string;
  icon: typeof Brain;
  axis: string;
  status: "active" | "standby" | "experimental";
  inputs: string[];
  outputs: string[];
}

const SUPER_MODULES: SuperModule[] = [
  // Psychological
  { key: "identity_sim", name: "Identity Simulation Engine", icon: Eye, axis: "Psihologică", status: "active", inputs: ["audience_profile", "market_context"], outputs: ["behavioral_predictions", "optimized_messages"] },
  { key: "behavioral_scanner", name: "Behavioral Leverage Scanner", icon: Target, axis: "Psihologică", status: "active", inputs: ["funnel", "content"], outputs: ["leverage_points", "optimization_map"] },
  { key: "narrative_dom", name: "Narrative Domination Engine", icon: Megaphone, axis: "Psihologică", status: "experimental", inputs: ["brand", "market"], outputs: ["dominant_narrative", "positioning_framework"] },
  // Social
  { key: "influence_graph", name: "Influence Graph Engine", icon: Network, axis: "Socială", status: "active", inputs: ["niche", "actors"], outputs: ["influence_map"] },
  { key: "viral_gen", name: "Viral Structure Generator", icon: Sparkles, axis: "Socială", status: "active", inputs: ["content"], outputs: ["viral_structures"] },
  { key: "reputation_sys", name: "Reputation Accumulation System", icon: Shield, axis: "Socială", status: "standby", inputs: ["outputs"], outputs: ["reputation_index"] },
  // Commercial
  { key: "offer_mult", name: "Offer Multiplication Engine", icon: Boxes, axis: "Comercială", status: "active", inputs: ["asset"], outputs: ["multi_offer_system"] },
  { key: "pricing_intel", name: "Pricing Intelligence System", icon: TrendingUp, axis: "Comercială", status: "active", inputs: ["product", "demand_signals"], outputs: ["optimal_price"] },
  { key: "funnel_auto", name: "Funnel Autogenerator", icon: Workflow, axis: "Comercială", status: "experimental", inputs: ["offer"], outputs: ["full_funnel"] },
  // Infrastructure
  { key: "stepback", name: "Stepback Compiler", icon: Layers, axis: "Infrastructură", status: "active", inputs: ["domain", "outcome"], outputs: ["system_library"] },
  { key: "agent_swarm", name: "Agent Swarm Orchestrator", icon: Bot, axis: "Infrastructură", status: "active", inputs: ["goal"], outputs: ["completed_execution"] },
  { key: "knowledge_arb", name: "Knowledge Arbitrage Engine", icon: Search, axis: "Infrastructură", status: "standby", inputs: ["knowledge_graph"], outputs: ["arbitrage_opportunities"] },
];

const AXIS_COLORS: Record<string, string> = {
  "Psihologică": "text-purple-400",
  "Socială": "text-blue-400",
  "Comercială": "text-emerald-400",
  "Infrastructură": "text-amber-400",
};

const MODULE_STATUS_COLORS: Record<string, string> = {
  active: "bg-status-validated/10 text-status-validated",
  standby: "bg-muted text-muted-foreground",
  experimental: "bg-warning/10 text-warning",
};

type Tab = "modules" | "superlayer" | "agents" | "economy" | "memory" | "ledger" | "lockin";

export default function CusnirOSOperator() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { modules, stats, ledger, loading } = useOSOperator();
  const { unlocks, patterns, executions, agents, stats: supStats, loading: supLoading, activateUnlock, revokeUnlock, toggling, startExecution, completeExecution, executing } = useOSSuperlayer();
  const { xp } = useGamification();
  const [tab, setTab] = useState<Tab>("modules");

  if (authLoading || adminLoading || loading || supLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
        <ShieldAlert className="h-12 w-12 text-destructive/40" />
        <h1 className="text-lg font-semibold">Acces Restricționat</h1>
        <p className="text-sm text-muted-foreground">CusnirOS Operator Layer — doar pentru administratori.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 overflow-auto">
        <SEOHead title="CusnirOS — Operator Layer" description="System control surface for OS modules, health monitoring, and decision audit." />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* System Indicators Bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { icon: Terminal, label: "OS Version", value: stats.os_version },
                { icon: Cpu, label: "Prompt System", value: stats.prompt_system_version },
                { icon: Activity, label: "Avg Latency", value: `${Math.round(stats.avg_latency_ms)}ms` },
                { icon: Server, label: "Queue Depth", value: String(stats.queue_depth) },
                { icon: Zap, label: "Active Jobs", value: String(stats.active_jobs) },
                { icon: ScrollText, label: "Ledger 24h", value: String(stats.decision_ledger_24h) },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <IndicatorCard icon={item.icon} label={item.label} value={item.value} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Module Health Summary */}
          {stats && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Modules:</span>
              <Badge variant="outline" className="gap-1 text-status-validated"><CheckCircle2 className="h-3 w-3" /> {stats.healthy_modules} healthy</Badge>
              {stats.warning_modules > 0 && <Badge variant="outline" className="gap-1 text-amber-500"><AlertTriangle className="h-3 w-3" /> {stats.warning_modules} warning</Badge>}
              {stats.critical_modules > 0 && <Badge variant="outline" className="gap-1 text-destructive"><XCircle className="h-3 w-3" /> {stats.critical_modules} critical</Badge>}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-border/30 pb-0 overflow-x-auto">
            {(["modules", "superlayer", "agents", "economy", "memory", "ledger", "lockin"] as Tab[]).map(t => {
              const labels: Record<Tab, string> = {
                modules: "Module Registry",
                superlayer: "Superlayer Axes",
                agents: "Agent Swarm",
                economy: "Economy Layer",
                memory: "Memory Engine",
                ledger: "Decision Ledger",
                lockin: "Lock-in Score",
              };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                    tab === t
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {tab === "modules" && (
              <motion.div key="modules" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4 text-primary" /> Module Registry ({modules.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left p-3 font-medium">Module</th>
                            <th className="text-left p-3 font-medium">Type</th>
                            <th className="text-left p-3 font-medium">Version</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Health</th>
                            <th className="text-left p-3 font-medium">Risk</th>
                            <th className="text-right p-3 font-medium">Latency</th>
                            <th className="text-right p-3 font-medium">Error %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modules.map((m) => {
                            const HealthIcon = HEALTH_ICONS[m.health_status] || Activity;
                            return (
                              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20">
                                <td className="p-3">
                                  <div className="font-medium">{m.module_name}</div>
                                  <div className="text-muted-foreground text-micro mt-0.5 max-w-[200px] truncate">{m.description}</div>
                                </td>
                                <td className="p-3 capitalize">{m.module_type}</td>
                                <td className="p-3 font-mono">{m.version}</td>
                                <td className="p-3">
                                  <Badge className={cn("text-micro", STATUS_COLORS[m.status] || "")}>{m.status}</Badge>
                                </td>
                                <td className="p-3">
                                  <span className={cn("inline-flex items-center gap-1", HEALTH_COLORS[m.health_status] || "")}>
                                    <HealthIcon className="h-3 w-3" /> {m.health_status}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={cn("font-medium", RISK_COLORS[m.risk_level] || "")}>{m.risk_level}</span>
                                </td>
                                <td className="p-3 text-right tabular-nums">{m.avg_latency_ms}ms</td>
                                <td className="p-3 text-right tabular-nums">{(m.error_rate * 100).toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {tab === "superlayer" && (
              <motion.div key="superlayer" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                <div className="space-y-4">
                  {["Psihologică", "Socială", "Comercială", "Infrastructură"].map(axis => {
                    const axisModules = SUPER_MODULES.filter(m => m.axis === axis);
                    return (
                      <Card key={axis}>
                        <CardHeader className="pb-2">
                          <CardTitle className={cn("text-sm flex items-center gap-2", AXIS_COLORS[axis] || "")}>
                            {axis === "Psihologică" && <Brain className="h-4 w-4" />}
                            {axis === "Socială" && <Users className="h-4 w-4" />}
                            {axis === "Comercială" && <TrendingUp className="h-4 w-4" />}
                            {axis === "Infrastructură" && <Layers className="h-4 w-4" />}
                            Axa {axis}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y divide-border/50">
                            {axisModules.map(mod => (
                              <div key={mod.key} className="p-4 flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                                  <mod.icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-foreground">{mod.name}</p>
                                    <Badge className={cn("text-nano", MODULE_STATUS_COLORS[mod.status])}>{mod.status}</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-3 text-micro">
                                    <div>
                                      <span className="text-muted-foreground/50">Inputs: </span>
                                      <span className="text-muted-foreground">{mod.inputs.join(", ")}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground/50">Outputs: </span>
                                      <span className="text-foreground/70">{mod.outputs.join(", ")}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {tab === "agents" && (
              <motion.div key="agents" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                <AgentExecutionPanel
                  agents={agents}
                  executions={executions}
                  onStartExecution={startExecution}
                  onCompleteExecution={completeExecution}
                  executing={executing}
                />
              </motion.div>
            )}

            {tab === "economy" && (
              <motion.div key="economy" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                <EconomyLayerPanel
                  unlocks={unlocks}
                  stats={supStats}
                  userXP={xp.total_xp}
                  onActivate={activateUnlock}
                  onRevoke={revokeUnlock}
                  toggling={toggling}
                />
              </motion.div>
            )}

            {tab === "memory" && (
              <motion.div key="memory" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                <MemoryLayerPanel patterns={patterns} executions={executions} />
              </motion.div>
            )}

            {tab === "ledger" && (
              <motion.div key="ledger" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-primary" /> Decision Ledger (recent)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {ledger.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">Nicio intrare în ledger.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left p-3 font-medium">Timestamp</th>
                              <th className="text-left p-3 font-medium">Event</th>
                              <th className="text-left p-3 font-medium">Resource</th>
                              <th className="text-left p-3 font-medium">Verdict</th>
                              <th className="text-left p-3 font-medium">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ledger.map((e) => (
                              <tr key={e.id} className="border-b border-border/50">
                                <td className="p-3 tabular-nums text-muted-foreground">{format(new Date(e.created_at), "dd MMM HH:mm")}</td>
                                <td className="p-3 font-medium">{e.event_type}</td>
                                <td className="p-3">{e.target_resource || "—"}</td>
                                <td className="p-3">
                                  {e.verdict && (
                                    <Badge variant="outline" className={cn("text-micro",
                                      e.verdict === "ALLOW" ? "text-status-validated" :
                                      e.verdict === "DENY" ? "text-destructive" : ""
                                    )}>{e.verdict}</Badge>
                                  )}
                                </td>
                                <td className="p-3 text-muted-foreground max-w-[200px] truncate">{e.reason || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}

function IndicatorCard({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-micro font-medium">{label}</span>
      </div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
