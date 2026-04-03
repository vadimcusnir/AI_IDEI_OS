import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/admin/AdminSubComponents";

interface JobRow {
  id: string; worker_type: string; status: string; neuron_id: number;
  author_id: string; created_at: string; completed_at: string | null;
}

const PAGE_SIZE = 30;

export function AdminJobsTab() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;

    const [{ data }, { count }] = await Promise.all([
      supabase.from("neuron_jobs")
        .select("id, worker_type, status, neuron_id, author_id, created_at, completed_at")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1),
      supabase.from("neuron_jobs")
        .select("id", { count: "exact", head: true }),
    ]);

    setJobs(data as JobRow[] || []);
    setTotal(count || 0);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading && jobs.length === 0) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{total} jobs total · Pagina {page + 1}</span>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load} disabled={loading}>
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
              <TableHead className="text-[10px]">Completed</TableHead>
              <TableHead className="text-[10px] text-right">Duration</TableHead>
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
                  <TableCell className="text-[10px] text-muted-foreground">{j.completed_at ? new Date(j.completed_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{duration !== null ? `${duration}s` : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted-foreground">
          {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} din {total}
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
