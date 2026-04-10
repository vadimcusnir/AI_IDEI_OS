/**
 * AdminLogsTab — Real logs from compliance_log, decision_ledger, and anomaly_alerts.
 * Replaces the previous fake log view built from credit_transactions + failed jobs.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { RefreshCw, Loader2, ChevronLeft, ChevronRight, Shield, AlertTriangle, Info } from "lucide-react";

interface LogEntry {
  id: string;
  source: "compliance" | "ledger" | "anomaly";
  severity: string;
  action: string;
  actor: string;
  target: string;
  description: string;
  timestamp: string;
}

const PAGE_SIZE = 30;

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive",
  high: "bg-destructive/10 text-destructive",
  error: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  warn: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
  info: "bg-primary/10 text-primary",
};

export function AdminLogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Resolve user IDs to emails via profiles
  const resolveEmails = async (ids: string[]): Promise<Record<string, string>> => {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return {};
    const { data } = await supabase.from("profiles").select("user_id, email").in("user_id", unique);
    const map: Record<string, string> = {};
    (data || []).forEach((p: any) => { if (p.email) map[p.user_id] = p.email; });
    return map;
  };

  const formatActor = (id: string | null, emailMap: Record<string, string>) => {
    if (!id) return "system";
    return emailMap[id] || id.substring(0, 8) + "…";
  };

  const load = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const entries: LogEntry[] = [];
    const actorIds: string[] = [];

    // Fetch from compliance_log
    let complianceQuery = supabase.from("compliance_log")
      .select("id, action_type, actor_id, target_id, target_type, description, severity, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (severityFilter !== "all") {
      complianceQuery = complianceQuery.eq("severity", severityFilter);
    }

    const [{ data: complianceLogs }, { data: ledgerLogs }, { data: anomalyLogs }] = await Promise.all([
      complianceQuery,
      supabase.from("decision_ledger")
        .select("id, event_type, actor_id, verdict, reason, target_resource, created_at")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1),
      supabase.from("anomaly_alerts")
        .select("id, alert_type, metric_name, severity, current_value, threshold_value, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE),
    ]);

    // Collect all actor IDs for batch resolution
    (complianceLogs || []).forEach((l: any) => { if (l.actor_id) actorIds.push(l.actor_id); if (l.target_id) actorIds.push(l.target_id); });
    (ledgerLogs || []).forEach((l: any) => { if (l.actor_id) actorIds.push(l.actor_id); });
    (anomalyLogs || []).forEach((l: any) => { if (l.user_id) actorIds.push(l.user_id); });

    const emailMap = await resolveEmails(actorIds);

    (complianceLogs || []).forEach((log: any) => {
      entries.push({
        id: log.id,
        source: "compliance",
        severity: log.severity || "info",
        action: log.action_type,
        actor: formatActor(log.actor_id, emailMap),
        target: log.target_type ? `${log.target_type}:${formatActor(log.target_id, emailMap)}` : "—",
        description: log.description || "",
        timestamp: log.created_at,
      });
    });

    (ledgerLogs || []).forEach((log: any) => {
      entries.push({
        id: log.id,
        source: "ledger",
        severity: log.verdict === "deny" ? "high" : "info",
        action: log.event_type,
        actor: formatActor(log.actor_id, emailMap),
        target: log.target_resource || "—",
        description: log.reason || log.verdict || "",
        timestamp: log.created_at,
      });
    });

    (anomalyLogs || []).forEach((log: any) => {
      entries.push({
        id: log.id,
        source: "anomaly",
        severity: log.severity || "medium",
        action: log.alert_type,
        actor: formatActor(log.user_id, emailMap),
        target: log.metric_name,
        description: `${log.metric_name}: ${log.current_value} (threshold: ${log.threshold_value})`,
        timestamp: log.created_at,
      });
    });

    // Sort all by timestamp descending
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(entries.slice(0, PAGE_SIZE));
    setHasMore(entries.length >= PAGE_SIZE);
    setLoading(false);
  }, [page, severityFilter]);

  useEffect(() => { load(); }, [load]);

  const SeverityIcon = ({ severity }: { severity: string }) => {
    if (severity === "critical" || severity === "high" || severity === "error")
      return <AlertTriangle className="h-3 w-3" />;
    if (severity === "medium" || severity === "warn")
      return <Shield className="h-3 w-3" />;
    return <Info className="h-3 w-3" />;
  };

  if (loading && logs.length === 0) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-7 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-micro w-16">Source</TableHead>
              <TableHead className="text-micro w-20">Severity</TableHead>
              <TableHead className="text-micro">Action</TableHead>
              <TableHead className="text-micro">Actor</TableHead>
              <TableHead className="text-micro">Target</TableHead>
              <TableHead className="text-micro">Description</TableHead>
              <TableHead className="text-micro">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={`${log.source}-${log.id}`}>
                <TableCell>
                  <span className={cn(
                    "text-nano font-mono px-1.5 py-0.5 rounded",
                    log.source === "compliance" ? "bg-primary/10 text-primary" :
                    log.source === "anomaly" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  )}>{log.source}</span>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-nano font-mono px-1.5 py-0.5 rounded",
                    SEVERITY_STYLES[log.severity] || "bg-muted text-muted-foreground"
                  )}>
                    <SeverityIcon severity={log.severity} />
                    {log.severity}
                  </span>
                </TableCell>
                <TableCell className="text-micro font-mono">{log.action}</TableCell>
                <TableCell className="text-micro font-mono text-muted-foreground">{log.actor}</TableCell>
                <TableCell className="text-micro font-mono text-muted-foreground max-w-[120px] truncate">{log.target}</TableCell>
                <TableCell className="text-micro max-w-[250px] truncate">{log.description}</TableCell>
                <TableCell className="text-micro text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                  No logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-1 pt-1">
        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-micro text-muted-foreground px-2">Pagina {page + 1}</span>
        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => p + 1)} disabled={!hasMore}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
