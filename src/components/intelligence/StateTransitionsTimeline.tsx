import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Clock, Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Transition {
  id: string;
  profile_id: string;
  from_status: string | null;
  to_status: string;
  decided_by: string | null;
  decided_at: string;
  reason_code: string | null;
  guardrail_results: any;
}

interface StateTransitionsTimelineProps {
  profileId: string;
}

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  draft: Clock,
  review: Shield,
  published: CheckCircle2,
  blocked: XCircle,
};

const STATUS_COLOR: Record<string, string> = {
  draft: "text-muted-foreground",
  review: "text-warning",
  published: "text-status-validated",
  blocked: "text-destructive",
};

export function StateTransitionsTimeline({ profileId }: StateTransitionsTimelineProps) {
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await (supabase.from("intelligence_profile_state_transitions") as any)
      .select("*")
      .eq("profile_id", profileId)
      .order("decided_at", { ascending: false })
      .limit(20);
    setTransitions((data as Transition[]) || []);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-xs text-muted-foreground py-2">Loading audit trail…</div>;

  if (transitions.length === 0) {
    return <div className="text-xs text-muted-foreground py-2">No state transitions recorded yet.</div>;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-primary" /> Audit Trail
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {transitions.map((t) => {
          const ToIcon = STATUS_ICON[t.to_status] || AlertTriangle;
          const guardrailFails = t.guardrail_results?.checks?.filter((c: any) => c.status === "FAIL") || [];

          return (
            <div key={t.id} className="bg-muted/30 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs">
                {t.from_status && (
                  <>
                    <span className={cn("font-medium capitalize", STATUS_COLOR[t.from_status])}>
                      {t.from_status}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <ToIcon className={cn("h-3 w-3", STATUS_COLOR[t.to_status])} />
                <span className={cn("font-medium capitalize", STATUS_COLOR[t.to_status])}>
                  {t.to_status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-micro text-muted-foreground">
                <span>{format(new Date(t.decided_at), "dd MMM yyyy HH:mm")}</span>
                {t.reason_code && (
                  <span className="px-1.5 py-0.5 bg-muted rounded text-micro font-mono">
                    {t.reason_code}
                  </span>
                )}
              </div>

              {guardrailFails.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {guardrailFails.map((f: any, i: number) => (
                    <span key={i} className="text-micro px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">
                      {f.gate}: {f.reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
