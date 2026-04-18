/**
 * AuthFlowMonitor — Live telemetry view of the auth pipeline.
 *
 * Reads from `analytics_events` filtering on event_name LIKE 'auth%' / known auth events,
 * groups by correlation_id (session_id column), and renders flow traces.
 * Drop into any admin page: <AuthFlowMonitor />
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

interface AuthEventRow {
  id: string;
  event_name: string;
  event_params: Record<string, any> | null;
  session_id: string | null;
  created_at: string;
}

interface SpikeAlert {
  id: string;
  title: string;
  description: string | null;
  occurrences: number | null;
  last_seen: string;
}

const AUTH_EVENTS = [
  "auth_attempt_started",
  "provider_redirect_started",
  "callback_received",
  "code_exchange_failed",
  "session_created",
  "session_restore_failed",
  "guard_redirect_triggered",
  "post_login_redirect_completed",
  "logout_completed",
  "auth_error_normalized",
  "bad_jwt_recovered",
];

const FAILURE_EVENTS = new Set(["code_exchange_failed", "session_restore_failed", "bad_jwt_recovered", "auth_error_normalized"]);

export function AuthFlowMonitor() {
  const [rows, setRows] = useState<AuthEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("id, event_name, event_params, session_id, created_at")
        .in("event_name", AUTH_EVENTS)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (error) {
        console.error("[AuthFlowMonitor]", error);
        setLoading(false);
        return;
      }
      setRows((data ?? []) as AuthEventRow[]);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Group by correlation_id
  const flows = new Map<string, AuthEventRow[]>();
  for (const row of rows) {
    const key = row.session_id || "no-correlation";
    if (!flows.has(key)) flows.set(key, []);
    flows.get(key)!.push(row);
  }

  // Stats
  const failures = rows.filter(r => FAILURE_EVENTS.has(r.event_name)).length;
  const sessions = rows.filter(r => r.event_name === "session_created").length;
  const redirects = rows.filter(r => r.event_name === "post_login_redirect_completed").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Auth Flow Telemetry</span>
          <div className="flex gap-2 text-xs font-normal">
            <Badge variant="secondary">{sessions} sessions</Badge>
            <Badge variant="secondary">{redirects} redirects</Badge>
            {failures > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {failures} failures
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        {flows.size === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No auth events recorded yet.</p>
        )}
        {Array.from(flows.entries()).slice(0, 30).map(([corrId, events]) => {
          const sorted = [...events].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          const hasFailure = sorted.some(e => FAILURE_EVENTS.has(e.event_name));
          return (
            <div key={corrId} className="border border-border/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <code className="text-muted-foreground">{corrId.slice(0, 32)}</code>
                <span className="text-muted-foreground">
                  {new Date(sorted[0].created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-1.5">
                {sorted.map((evt, idx) => (
                  <div key={evt.id} className="flex items-center gap-1.5">
                    <Badge
                      variant={FAILURE_EVENTS.has(evt.event_name) ? "destructive" : "outline"}
                      className="text-xs gap-1"
                    >
                      {FAILURE_EVENTS.has(evt.event_name) ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : evt.event_name === "session_created" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : null}
                      {evt.event_name.replace(/_/g, " ")}
                    </Badge>
                    {idx < sorted.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              {hasFailure && (
                <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                  {sorted
                    .filter(e => FAILURE_EVENTS.has(e.event_name))
                    .map(e => e.event_params?.error || e.event_name)
                    .join(" · ")}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
