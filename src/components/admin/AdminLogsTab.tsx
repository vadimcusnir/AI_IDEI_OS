import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, ScrollText, Loader2 } from "lucide-react";
import { LogLevelBadge } from "@/components/admin/AdminSubComponents";

interface LogEntry {
  id: string;
  function_name: string;
  level: string;
  message: string;
  timestamp: string;
}

export function AdminLogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [txResult, failedJobsResult] = await Promise.all([
      supabase.from("credit_transactions")
        .select("id, user_id, amount, type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("neuron_jobs")
        .select("id, worker_type, status, created_at, completed_at, result")
        .in("status", ["failed", "running"])
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const entries: LogEntry[] = [];

    (txResult.data || []).forEach((tx: any) => {
      entries.push({
        id: tx.id,
        function_name: "credit-engine",
        level: tx.type === "denied" ? "error" : tx.type === "release" ? "warn" : "info",
        message: `[${tx.type.toUpperCase()}] ${tx.description} | amount: ${tx.amount} | user: ${tx.user_id.substring(0, 8)}…`,
        timestamp: tx.created_at,
      });
    });

    (failedJobsResult.data || []).forEach((j: any) => {
      const resultMsg = j.result?.error || j.result?.reason || "";
      entries.push({
        id: `job-${j.id}`,
        function_name: j.worker_type || "run-service",
        level: j.status === "failed" ? "error" : "warn",
        message: `[JOB ${j.status.toUpperCase()}] ${j.worker_type} | ${resultMsg}`.trim(),
        timestamp: j.created_at,
      });
    });

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(entries.slice(0, 80));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ScrollText className="h-3 w-3" /> System Logs
        </h3>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={load}>
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {logs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No logs available</p>
      ) : (
        <div className="space-y-0.5 max-h-[600px] overflow-y-auto font-mono text-[11px]">
          {logs.map(log => (
            <div
              key={log.id}
              className={cn(
                "flex items-start gap-2 px-2 py-1.5 rounded",
                log.level === "error" ? "bg-destructive/5" :
                log.level === "warn" ? "bg-warning/5" :
                "hover:bg-muted/30"
              )}
            >
              <LogLevelBadge level={log.level} />
              <span className="text-[10px] text-muted-foreground shrink-0 w-[130px]">
                {new Date(log.timestamp).toLocaleString()}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0 bg-muted text-muted-foreground">
                {log.function_name}
              </span>
              <span className="text-xs break-all">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
