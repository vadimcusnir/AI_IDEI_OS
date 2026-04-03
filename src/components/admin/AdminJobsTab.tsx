import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Loader2, ChevronLeft, ChevronRight, Search, RotateCcw, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/admin/AdminSubComponents";
import { toast } from "sonner";

interface JobRow {
  id: string; worker_type: string; status: string; neuron_id: number;
  author_id: string; created_at: string; completed_at: string | null;
}

const PAGE_SIZE = 30;
const STATUSES = ["all", "queued", "processing", "completed", "failed", "cancelled"];

export function AdminJobsTab() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;

    let query = supabase.from("neuron_jobs")
      .select("id, worker_type, status, neuron_id, author_id, created_at, completed_at")
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
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [search, statusFilter]);

  const retryJob = async (jobId: string) => {
    const { error } = await supabase.from("neuron_jobs")
      .update({ status: "queued", completed_at: null })
      .eq("id", jobId);
    if (error) { toast.error("Retry failed"); return; }
    toast.success("Job re-queued");
    load();
  };

  const cancelJob = async (jobId: string) => {
    const { error } = await supabase.from("neuron_jobs")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", jobId);
    if (error) { toast.error("Cancel failed"); return; }
    toast.success("Job cancelled");
    load();
  };

  if (loading && jobs.length === 0) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..." className="h-7 text-xs pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-7 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s} className="text-xs">{s === "all" ? "All statuses" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground shrink-0">{total} jobs · Page {page + 1}</span>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0 ml-auto" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px]">ID</TableHead>
              <TableHead className="text-[10px]">Worker</TableHead>
              <TableHead className="text-[10px]">Status</TableHead>
              <TableHead className="text-[10px]">Neuron</TableHead>
              <TableHead className="text-[10px]">Created</TableHead>
              <TableHead className="text-[10px]">Duration</TableHead>
              <TableHead className="text-[10px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(j => {
              const duration = j.completed_at
                ? Math.round((new Date(j.completed_at).getTime() - new Date(j.created_at).getTime()) / 1000)
                : null;
              return (
                <TableRow key={j.id}>
                  <TableCell className="text-[10px] font-mono text-muted-foreground">{j.id.substring(0, 8)}</TableCell>
                  <TableCell className="text-xs">{j.worker_type.replace(/-/g, " ")}</TableCell>
                  <TableCell><StatusBadge status={j.status} /></TableCell>
                  <TableCell className="text-xs font-mono text-primary">{j.neuron_id}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{new Date(j.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-mono">{duration !== null ? `${duration}s` : "—"}</TableCell>
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
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted-foreground">
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
