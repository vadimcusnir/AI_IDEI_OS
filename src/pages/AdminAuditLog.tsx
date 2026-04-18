import { useState, useEffect, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import {
  Loader2, Shield, ScrollText, Search, Download, Filter,
  ShieldCheck, ShieldX, ShieldAlert, AlertTriangle, Info, Clock,
  User, RefreshCw, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AuthFlowMonitor } from "@/components/admin/AuthFlowMonitor";
import { Activity } from "lucide-react";

interface ComplianceEntry {
  id: string;
  actor_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  description: string;
  severity: string;
  ip_hint: string | null;
  created_at: string;
}

interface LedgerEntry {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_resource: string | null;
  verdict: string | null;
  reason: string | null;
  entry_hash: string | null;
  prev_hash: string | null;
  created_at: string;
}

interface AdminSession {
  id: string;
  admin_id: string;
  action_count: number;
  started_at: string;
  last_action_at: string;
  ip_hint: string | null;
  user_agent: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const VERDICT_ICONS: Record<string, { icon: typeof ShieldCheck; color: string }> = {
  ALLOW: { icon: ShieldCheck, color: "text-success" },
  DENY: { icon: ShieldX, color: "text-destructive" },
  PAYWALL: { icon: ShieldAlert, color: "text-warning" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function exportData(data: unknown[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported successfully");
}

export default function AdminAuditLog() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [tab, setTab] = useState("compliance");

  // Compliance state
  const [compliance, setCompliance] = useState<ComplianceEntry[]>([]);
  const [compLoading, setCompLoading] = useState(true);
  const [compSearch, setCompSearch] = useState("");
  const [compSeverity, setCompSeverity] = useState("all");

  // Ledger state
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Sessions state
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [sessLoading, setSessLoading] = useState(true);

  const loadCompliance = useCallback(async () => {
    setCompLoading(true);
    let q = supabase.from("compliance_log").select("*").order("created_at", { ascending: false }).limit(500);
    const { data } = await q;
    setCompliance((data as ComplianceEntry[]) || []);
    setCompLoading(false);
  }, []);

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    const { data } = await supabase.from("decision_ledger")
      .select("id, event_type, actor_id, target_resource, verdict, reason, entry_hash, prev_hash, created_at")
      .order("created_at", { ascending: false }).limit(500);
    setLedger((data as LedgerEntry[]) || []);
    setLedgerLoading(false);
  }, []);

  const loadSessions = useCallback(async () => {
    setSessLoading(true);
    const { data } = await supabase.from("admin_sessions").select("*")
      .order("last_action_at", { ascending: false }).limit(100);
    setSessions((data as AdminSession[]) || []);
    setSessLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadCompliance();
      loadLedger();
      loadSessions();
    }
  }, [isAdmin, loadCompliance, loadLedger, loadSessions]);

  if (adminLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return <Navigate to="/home" replace />;

  const filteredCompliance = compliance.filter(e => {
    if (compSeverity !== "all" && e.severity !== compSeverity) return false;
    if (compSearch && !e.action_type.toLowerCase().includes(compSearch.toLowerCase())
      && !e.description.toLowerCase().includes(compSearch.toLowerCase())
      && !e.target_type.toLowerCase().includes(compSearch.toLowerCase())) return false;
    return true;
  });

  const filteredLedger = ledger.filter(e => {
    if (ledgerSearch && !e.event_type.toLowerCase().includes(ledgerSearch.toLowerCase())
      && !(e.target_resource || "").toLowerCase().includes(ledgerSearch.toLowerCase())
      && !(e.reason || "").toLowerCase().includes(ledgerSearch.toLowerCase())) return false;
    return true;
  });

  const stats = {
    totalEvents: compliance.length,
    critical: compliance.filter(e => e.severity === "critical").length,
    warnings: compliance.filter(e => e.severity === "warning").length,
    ledgerEntries: ledger.length,
    activeSessions: sessions.filter(s => {
      const last = new Date(s.last_action_at).getTime();
      return Date.now() - last < 30 * 60 * 1000;
    }).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Audit Log — Admin" description="Full audit trail for compliance, decisions, and admin sessions." />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Audit Log</h1>
              <p className="text-xs text-muted-foreground">Compliance events, decision ledger & admin sessions</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { loadCompliance(); loadLedger(); loadSessions(); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total Events", value: stats.totalEvents, icon: ScrollText },
            { label: "Critical", value: stats.critical, icon: AlertTriangle, highlight: stats.critical > 0 },
            { label: "Warnings", value: stats.warnings, icon: AlertTriangle },
            { label: "Ledger Entries", value: stats.ledgerEntries, icon: Shield },
            { label: "Active Sessions", value: stats.activeSessions, icon: User },
          ].map(kpi => (
            <div key={kpi.label} className={cn(
              "bg-card border border-border rounded-lg p-3",
              kpi.highlight && "border-destructive/30"
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className={cn("h-3 w-3", kpi.highlight ? "text-destructive" : "text-muted-foreground")} />
                <span className="text-micro text-muted-foreground">{kpi.label}</span>
              </div>
              <span className={cn("text-lg font-bold", kpi.highlight && "text-destructive")}>{kpi.value}</span>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="compliance" className="text-xs gap-1"><ScrollText className="h-3 w-3" /> Compliance</TabsTrigger>
            <TabsTrigger value="ledger" className="text-xs gap-1"><Shield className="h-3 w-3" /> Decision Ledger</TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs gap-1"><User className="h-3 w-3" /> Admin Sessions</TabsTrigger>
            <TabsTrigger value="auth-flow" className="text-xs gap-1"><Activity className="h-3 w-3" /> Auth Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="auth-flow">
            <AuthFlowMonitor />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search events..." value={compSearch} onChange={e => setCompSearch(e.target.value)}
                  className="pl-8 h-8 text-xs" />
              </div>
              <Select value={compSeverity} onValueChange={setCompSeverity}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severity</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => exportData(filteredCompliance, "compliance-log")}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>

            {compLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : filteredCompliance.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No compliance events found</div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filteredCompliance.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors border border-transparent hover:border-border">
                    <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0",
                      entry.severity === "critical" ? "bg-destructive/10" : entry.severity === "warning" ? "bg-warning/10" : "bg-muted")}>
                      {entry.severity === "critical" ? <AlertTriangle className="h-3 w-3 text-destructive" /> :
                       entry.severity === "warning" ? <AlertTriangle className="h-3 w-3 text-warning" /> :
                       <Info className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{entry.action_type}</span>
                        <Badge variant="outline" className="text-nano px-1.5 py-0 h-4">{entry.target_type}</Badge>
                        <Badge className={cn("text-nano px-1.5 py-0 h-4", SEVERITY_COLORS[entry.severity])}>{entry.severity}</Badge>
                      </div>
                      <p className="text-micro text-muted-foreground truncate">{entry.description || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-micro text-muted-foreground/60 font-mono block">{formatDate(entry.created_at)}</span>
                      {entry.ip_hint && <span className="text-nano text-muted-foreground/40 font-mono">{entry.ip_hint}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Decision Ledger Tab */}
          <TabsContent value="ledger">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search ledger..." value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)}
                  className="pl-8 h-8 text-xs" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => exportData(filteredLedger, "decision-ledger")}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>

            {ledgerLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : filteredLedger.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No ledger entries found</div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filteredLedger.map(entry => {
                  const vi = VERDICT_ICONS[entry.verdict || ""] || null;
                  const VIcon = vi?.icon;
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors border border-transparent hover:border-border">
                      <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {VIcon ? <VIcon className={cn("h-3 w-3", vi.color)} /> : <Shield className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{entry.event_type}</span>
                          {entry.verdict && <Badge variant="outline" className="text-nano px-1.5 py-0 h-4">{entry.verdict}</Badge>}
                        </div>
                        <p className="text-micro text-muted-foreground truncate">
                          {entry.reason || entry.target_resource || "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-micro text-muted-foreground/60 font-mono block">{formatDate(entry.created_at)}</span>
                        {entry.entry_hash && (
                          <span className="text-nano text-muted-foreground/30 font-mono" title={entry.entry_hash}>
                            #{entry.entry_hash.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Admin Sessions Tab */}
          <TabsContent value="sessions">
            {sessLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No admin sessions recorded</div>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => {
                  const isActive = Date.now() - new Date(s.last_action_at).getTime() < 30 * 60 * 1000;
                  return (
                    <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        isActive ? "bg-success/10" : "bg-muted")}>
                        <User className={cn("h-4 w-4", isActive ? "text-success" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono">{s.admin_id.slice(0, 8)}…</span>
                          <Badge variant={isActive ? "default" : "outline"} className="text-nano h-4">
                            {isActive ? "Active" : "Ended"}
                          </Badge>
                          <span className="text-micro text-muted-foreground">{s.action_count} actions</span>
                        </div>
                        <div className="flex items-center gap-3 text-micro text-muted-foreground/60 mt-0.5">
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {formatDate(s.started_at)}</span>
                          {s.ip_hint && <span>{s.ip_hint}</span>}
                        </div>
                      </div>
                      {s.user_agent && (
                        <span className="text-nano text-muted-foreground/40 max-w-40 truncate hidden sm:block">
                          {s.user_agent}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
