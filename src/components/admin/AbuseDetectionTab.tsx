import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface AbuseEvent {
  id: string;
  user_id: string;
  abuse_type: string;
  severity: string;
  details: Record<string, any>;
  action_taken: string;
  resolved_at: string | null;
  created_at: string;
}

export function AbuseDetectionTab() {
  const { t } = useTranslation("common");
  const [events, setEvents] = useState<AbuseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("abuse_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setEvents((data as AbuseEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string, action: string) => {
    const { error } = await supabase
      .from("abuse_events")
      .update({ action_taken: action, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("event_marked_as", { action }));
    load();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3" /> Abuse Detection — Threat Events
        </h3>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted-foreground">No abuse events detected. System is clean.</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Time</TableHead>
                <TableHead className="text-micro">User</TableHead>
                <TableHead className="text-micro">Type</TableHead>
                <TableHead className="text-micro">Severity</TableHead>
                <TableHead className="text-micro">Details</TableHead>
                <TableHead className="text-micro">Action</TableHead>
                <TableHead className="text-micro w-32">Resolve</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-micro text-muted-foreground whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-micro font-mono">{e.user_id.substring(0, 8)}…</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-nano font-mono px-1.5 py-0.5 rounded",
                      e.abuse_type === "prompt_probing" ? "bg-orange-500/10 text-orange-600" :
                      "bg-destructive/10 text-destructive"
                    )}>{e.abuse_type.replace(/_/g, " ")}</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-nano font-mono px-1.5 py-0.5 rounded",
                      e.severity === "critical" ? "bg-destructive/15 text-destructive" :
                      e.severity === "warning" ? "bg-orange-500/10 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    )}>{e.severity}</span>
                  </TableCell>
                  <TableCell className="text-micro font-mono text-muted-foreground max-w-[200px] truncate">
                    {JSON.stringify(e.details)}
                  </TableCell>
                  <TableCell className="text-micro">{e.action_taken}</TableCell>
                  <TableCell>
                    {!e.resolved_at ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-nano" onClick={() => resolve(e.id, "dismissed")}>
                          Dismiss
                        </Button>
                        <Button size="sm" variant="destructive" className="h-6 text-nano" onClick={() => resolve(e.id, "suspended")}>
                          Suspend
                        </Button>
                      </div>
                    ) : (
                      <span className="text-nano text-muted-foreground">Resolved</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
