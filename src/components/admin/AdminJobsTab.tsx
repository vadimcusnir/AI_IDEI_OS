/**
 * AdminJobsTab — Phase 4: retry, cancel, requeue, refund (real cost), bulk actions, live monitoring.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw, Loader2, ChevronLeft, ChevronRight, Search,
  RotateCcw, XCircle, Undo2, ListRestart, CheckCircle2, Clock, AlertTriangle,
  Radio, Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/AdminSubComponents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobRow {
  id: string; worker_type: string; status: string; neuron_id: number;
  author_id: string; created_at: string; completed_at: string | null;
  error_message: string | null; retry_count: number;
}

const PAGE_SIZE = 30;
const STATUSES = ["all", "pending", "queued", "running", "processing", "completed", "failed", "cancelled"];

export function AdminJobsTab() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;

    let query = supabase.from("neuron_jobs")
      .select("id, worker_type, status, neuron_id, author_id, created_at, completed_at, error_message, retry_count")
      .order("created_at", { ascending: false });

    let countQuery = supabase.from("neuron_jobs")
      .select("id", { count: "exact", head: true });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
      countQuery = countQuery.eq("status", statusFilter);
    }

    if (search.trim()) {
      query = query.or(`worker_type.ilike.%${search}%,id.ilike.%${search}%`);
      countQuery = countQuery.or(`worker_type.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const [{ data }, { count }] = await Promise.all([
      query.range(from, from + PAGE_SIZE - 1),
      countQuery,
    ]);

    setJobs(data as JobRow[] || []);
    setTotal(count || 0);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setSelected(new Set());
    setLoading(false);
  }, [page, search, statusFilter]);

  const loadStats = useCallback(async () => {
    const statuses = ["queued", "processing", "completed", "failed", "cancelled"];
    const results = await Promise.all(
      statuses.map((s) =>
        supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("status", s)
      )
    );
    const m: Record<string, number> = {};
    statuses.forEach((s, i) => { m[s] = results[i].count || 0; });
    setStats(m);
  }, []);

  useEffect(() => { load(); loadStats(); }, [load, loadStats]);
  useEffect(() => { setPage(0); }, [search, statusFilter]);

  // ── Realtime live mode ──
  useEffect(() => {
    if (!live) {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      return;
    }
    const ch = supabase
      .channel("admin-jobs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "neuron_jobs" }, () => {
        load();
        loadStats();
      })
      .subscribe();
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [live, load, loadStats]);

  const auditJobAction = async (jobId: string, action: string, details: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("compliance_log" as any).insert({
      actor_id: user?.id,
      action_type: `job_${action}`,
      target_type: "job",
      target_id: jobId,
      description: details,
      severity: action === "refund" ? "high" : "medium",
    });
  };

  const retryJob = async (jobId: string) => {
    const { error } = await supabase.from("neuron_jobs")
      .update({ status: "queued", completed_at: null, error_message: null })
      .eq("id", jobId);
    if (error) { toast.error("Retry failed"); return; }
    await auditJobAction(jobId, "retry", `Job ${jobId.substring(0, 8)} re-queued for retry`);
    toast.success("Job re-queued for retry");
    load();
  };

  const cancelJob = async (jobId: string) => {
    const { error } = await supabase.from("neuron_jobs")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", jobId);
    if (error) { toast.error("Cancel failed"); return; }
    await auditJobAction(jobId, "cancel", `Job ${jobId.substring(0, 8)} cancelled`);
    toast.success("Job cancelled");
    load(); loadStats();
  };

  const requeueJob = async (job: JobRow) => {
    const { error } = await supabase.from("neuron_jobs").insert({
      neuron_id: job.neuron_id,
      worker_type: job.worker_type,
      author_id: job.author_id,
      status: "queued",
      retry_count: 0,
    });
    if (error) { toast.error("Requeue failed"); return; }
    await auditJobAction(job.id, "requeue", `Job ${job.id.substring(0, 8)} re-queued as new job`);
    toast.success("New job created from original parameters");
    load(); loadStats();
  };

  const refundJob = async (job: JobRow) => {
    // Look up actual cost from credit_transactions
    const { data: txn } = await supabase
      .from("credit_transactions")
      .select("amount")
      .eq("description", `ilike.%${job.id.substring(0, 8)}%`)
      .limit(1)
      .maybeSingle();

    const refundAmount = txn?.amount ? Math.abs(txn.amount) : 50;

    const { error } = await supabase.from("credit_transactions").insert({
      user_id: job.author_id,
      amount: refundAmount,
      type: "refund",
      description: `Refund ${refundAmount}N for job ${job.id.substring(0, 8)} (${job.worker_type})`,
      service_key: job.worker_type,
    });
    if (error) { toast.error("Refund failed"); return; }
    await auditJobAction(job.id, "refund", `${refundAmount}N refunded for job ${job.id.substring(0, 8)}`);
    toast.success(`${refundAmount} credits refunded`);
  };

  // ── Bulk actions ──
  const bulkRetryFailed = async () => {
    const failedSelected = jobs.filter(j => selected.has(j.id) && j.status === "failed");
    if (!failedSelected.length) { toast.error("No failed jobs selected"); return; }
    for (const j of failedSelected) await retryJob(j.id);
    toast.success(`${failedSelected.length} jobs re-queued`);
    loadStats();
  };

  const bulkCancelQueued = async () => {
    const queuedSelected = jobs.filter(j => selected.has(j.id) && (j.status === "queued" || j.status === "processing"));
    if (!queuedSelected.length) { toast.error("No queued/processing jobs selected"); return; }
    for (const j of queuedSelected) await cancelJob(j.id);
    toast.success(`${queuedSelected.length} jobs cancelled`);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === jobs.length) setSelected(new Set());
    else setSelected(new Set(jobs.map(j => j.id)));
  };

  if (loading && jobs.length === 0) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {/* Stats cards */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { key: "queued", icon: Clock, color: "text-amber-500" },
          { key: "processing", icon: Loader2, color: "text-info" },
          { key: "completed", icon: CheckCircle2, color: "text-status-validated" },
          { key: "failed", icon: AlertTriangle, color: "text-destructive" },
          { key: "cancelled", icon: XCircle, color: "text-muted-foreground" },
        ].map(({ key, icon: Icon, color }) => (
          <button
            key={key}
            className={cn(
              "p-2.5 rounded-lg border bg-card text-center transition-colors hover:bg-muted/50",
              statusFilter === key && "ring-1 ring-primary"
            )}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
          >
            <Icon className={cn("h-3.5 w-3.5 mx-auto mb-1", color)} />
            <p className="text-sm font-bold">{stats[key] || 0}</p>
            <p className="text-nano text-muted-foreground capitalize">{key}</p>
          </button>
        ))}
      </div>

      {/* Filters + bulk + live */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..." className="h-7 text-xs pl-8" />
        </div>

        {selected.size > 0 && (
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={bulkRetryFailed}>
              <RotateCcw className="h-3 w-3" /> Retry ({jobs.filter(j => selected.has(j.id) && j.status === "failed").length})
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={bulkCancelQueued}>
              <XCircle className="h-3 w-3" /> Cancel ({jobs.filter(j => selected.has(j.id) && (j.status === "queued" || j.status === "processing")).length})
            </Button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={live ? "default" : "outline"}
            size="sm"
            className={cn("h-7 text-xs gap-1", live && "bg-status-validated/20 text-status-validated border-status-validated/30")}
            onClick={() => setLive(!live)}
          >
            <Radio className={cn("h-3 w-3", live && "animate-pulse")} /> {live ? "Live" : "Live"}
          </Button>
          <span className="text-xs text-muted-foreground shrink-0">{total} jobs</span>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => { load(); loadStats(); }} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Jobs table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox checked={selected.size === jobs.length && jobs.length > 0} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="text-micro">ID</TableHead>
              <TableHead className="text-micro">Worker</TableHead>
              <TableHead className="text-micro">Status</TableHead>
              <TableHead className="text-micro">Retries</TableHead>
              <TableHead className="text-micro">Created</TableHead>
              <TableHead className="text-micro">Duration</TableHead>
              <TableHead className="text-micro">Error</TableHead>
              <TableHead className="text-micro text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(j => {
              const duration = j.completed_at
                ? Math.round((new Date(j.completed_at).getTime() - new Date(j.created_at).getTime()) / 1000)
                : null;
              return (
                <TableRow key={j.id} className={cn(selected.has(j.id) && "bg-primary/5")}>
                  <TableCell>
                    <Checkbox checked={selected.has(j.id)} onCheckedChange={() => toggleSelect(j.id)} />
                  </TableCell>
                  <TableCell className="text-micro font-mono text-muted-foreground">{j.id.substring(0, 8)}</TableCell>
                  <TableCell className="text-xs">{j.worker_type.replace(/-/g, " ")}</TableCell>
                  <TableCell><StatusBadge status={j.status} /></TableCell>
                  <TableCell className="text-xs font-mono text-center">{j.retry_count || 0}</TableCell>
                  <TableCell className="text-micro text-muted-foreground">{new Date(j.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-mono">{duration !== null ? `${duration}s` : "—"}</TableCell>
                  <TableCell className="max-w-[150px]">
                    {j.error_message && (
                      <span className="text-nano text-destructive truncate block" title={j.error_message}>
                        {j.error_message.substring(0, 50)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {j.status === "failed" && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => retryJob(j.id)} title="Retry">
                          <RotateCcw className="h-3 w-3 text-primary" />
                        </Button>
                      )}
                      {(j.status === "queued" || j.status === "processing") && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => cancelJob(j.id)} title="Cancel">
                          <XCircle className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                      {(j.status === "failed" || j.status === "cancelled") && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => requeueJob(j)} title="Requeue as new">
                          <ListRestart className="h-3 w-3 text-amber-500" />
                        </Button>
                      )}
                      {j.status === "failed" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Refund credits">
                              <Undo2 className="h-3 w-3 text-status-validated" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Refund Credits?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Credits for job {j.id.substring(0, 8)} ({j.worker_type}) will be refunded. This action is logged and audited.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => refundJob(j)}>Refund</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-micro text-muted-foreground">
          {total > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} din ${total}` : "0 results"}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => p + 1)} disabled={!hasMore}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
