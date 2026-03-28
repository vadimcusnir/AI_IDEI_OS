import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/AdminSubComponents";

interface JobRow {
  id: string; worker_type: string; status: string; neuron_id: number;
  author_id: string; created_at: string; completed_at: string | null;
}

export function AdminJobsTab() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("neuron_jobs")
      .select("id, worker_type, status, neuron_id, author_id, created_at, completed_at")
      .order("created_at", { ascending: false }).limit(50);
    setJobs(data as JobRow[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load}>
          <RefreshCw className="h-3 w-3" /> Refresh
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
    </div>
  );
}
