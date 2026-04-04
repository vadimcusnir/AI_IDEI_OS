/**
 * CusnirOSLedger — Append-only audit ledger viewer for governance events.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, AlertTriangle, Info, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface LedgerEntry {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_resource: string | null;
  payload: Record<string, unknown>;
  severity: string;
  created_at: string;
}

const SEVERITY_CONFIG = {
  info: { icon: Info, color: "text-muted-foreground", bg: "bg-muted/10" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/5" },
  critical: { icon: Shield, color: "text-red-400", bg: "bg-red-500/5" },
  audit: { icon: Eye, color: "text-sky-400", bg: "bg-sky-500/5" },
};

export function CusnirOSLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await (supabase.from("cusnir_os_ledger") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setEntries((data || []) as LedgerEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Governance Ledger — append-only, tamper-protected</p>
        <span className="text-[10px] text-muted-foreground/30">{entries.length} entries</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No ledger entries yet. Events are logged automatically.
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map(entry => {
            const sev = SEVERITY_CONFIG[entry.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
            const Icon = sev.icon;
            return (
              <div key={entry.id} className={cn("flex items-start gap-2.5 px-3 py-2 rounded-md border border-border/10", sev.bg)}>
                <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", sev.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{entry.event_type.replace(/_/g, " ")}</span>
                    <span className={cn("text-[10px] uppercase tracking-wider font-semibold", sev.color)}>{entry.severity}</span>
                  </div>
                  {entry.target_resource && (
                    <p className="text-[10px] text-muted-foreground/40">Target: {entry.target_resource}</p>
                  )}
                  {Object.keys(entry.payload).length > 0 && (
                    <pre className="text-[10px] text-muted-foreground/40 mt-1 bg-background/30 rounded p-1.5 overflow-auto max-h-16">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground/30 shrink-0">
                  {format(new Date(entry.created_at), "MMM d HH:mm")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
