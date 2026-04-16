/**
 * PromptVaultApprovals — Admin panel for reviewing pending prompt vault change requests.
 * Approves, rejects, or applies modifications gated by the governance workflow.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Clock, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type ChangeRequest = {
  id: string;
  prompt_id: string | null;
  service_unit_id: string | null;
  requested_by: string;
  change_type: string;
  diff_summary: string | null;
  status: string;
  created_at: string;
  proposed_payload: any;
};

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { variant: "outline", icon: Clock },
  approved: { variant: "default", icon: CheckCircle2 },
  rejected: { variant: "destructive", icon: XCircle },
  applied: { variant: "secondary", icon: CheckCircle2 },
};

export function PromptVaultApprovals() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("prompt_vault_change_requests" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (filter === "pending") query = query.eq("status", "pending");
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setRequests((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (id: string, status: "approved" | "rejected", note?: string) => {
    setActioning(id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("prompt_vault_change_requests" as any)
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      })
      .eq("id", id);
    setActioning(null);
    if (error) toast.error(error.message);
    else { toast.success(`Request ${status}`); load(); }
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Prompt Vault Change Requests</h3>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={filter === "pending" ? "default" : "ghost"} onClick={() => setFilter("pending")} className="h-7 text-xs">Pending</Button>
          <Button size="sm" variant={filter === "all" ? "default" : "ghost"} onClick={() => setFilter("all")} className="h-7 text-xs">All</Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          No {filter === "pending" ? "pending" : ""} change requests.
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => {
            const cfg = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
            const Icon = cfg.icon;
            return (
              <div key={r.id} className="border border-border/40 rounded-md p-3 space-y-2 bg-background/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={cfg.variant} className="text-[10px] gap-1"><Icon className="h-2.5 w-2.5" />{r.status}</Badge>
                      <span className="text-xs font-medium">{r.change_type}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {r.diff_summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.diff_summary}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono truncate">
                      service_unit: {r.service_unit_id || "—"} · requested_by: {r.requested_by.slice(0, 8)}…
                    </p>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="default" disabled={actioning === r.id}
                        onClick={() => review(r.id, "approved")} className="h-7 text-xs">
                        {actioning === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={actioning === r.id}
                        onClick={() => review(r.id, "rejected")} className="h-7 text-xs">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[10px] text-muted-foreground/60 pt-2 border-t border-border/20">
        Approved requests must be applied manually via prompt_vault UPDATE. Locked prompts require unlock request first.
      </div>
    </div>
  );
}
