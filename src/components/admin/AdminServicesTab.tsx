import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw, Loader2, ChevronLeft, ChevronRight, Search, Pencil, Save } from "lucide-react";

interface ServiceRow {
  id: string; service_key: string; name: string; category: string;
  credits_cost: number; is_active: boolean; service_class: string;
}

const PAGE_SIZE = 30;

export function AdminServicesTab() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", credits_cost: 0, category: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;

    let query = supabase.from("service_catalog")
      .select("id, service_key, name, category, credits_cost, is_active, service_class")
      .order("created_at", { ascending: false });

    let countQuery = supabase.from("service_catalog")
      .select("id", { count: "exact", head: true });

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,service_key.ilike.%${search}%,category.ilike.%${search}%`);
      countQuery = countQuery.or(`name.ilike.%${search}%,service_key.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const [{ data }, { count }] = await Promise.all([
      query.range(from, from + PAGE_SIZE - 1),
      countQuery,
    ]);

    setServices(data as ServiceRow[] || []);
    setTotal(count || 0);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [search]);

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("service_catalog").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Service ${!current ? "activated" : "deactivated"}`);
    load();
  };

  const openEdit = (s: ServiceRow) => {
    setEditing(s);
    setEditForm({ name: s.name, credits_cost: s.credits_cost, category: s.category });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("service_catalog").update({
      name: editForm.name,
      credits_cost: editForm.credits_cost,
      category: editForm.category,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Service updated");
    setEditing(null);
    load();
  };

  if (loading && services.length === 0) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." className="h-7 text-xs pl-8" />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{total} services · Page {page + 1}</span>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px]">Key</TableHead>
              <TableHead className="text-[10px]">Name</TableHead>
              <TableHead className="text-[10px]">Category</TableHead>
              <TableHead className="text-[10px]">Class</TableHead>
              <TableHead className="text-[10px] text-right">Cost</TableHead>
              <TableHead className="text-[10px]">Status</TableHead>
              <TableHead className="text-[10px] w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map(s => (
              <TableRow key={s.id}>
                <TableCell className="text-[10px] font-mono max-w-[120px] truncate">{s.service_key}</TableCell>
                <TableCell className="text-xs font-medium max-w-[180px] truncate">{s.name}</TableCell>
                <TableCell>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.category}</span>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded",
                    s.service_class === "S" ? "bg-primary/15 text-primary" :
                    s.service_class === "A" ? "bg-primary/10 text-primary" :
                    s.service_class === "B" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  )}>{s.service_class}</span>
                </TableCell>
                <TableCell className="text-xs font-mono text-right">{s.credits_cost}N</TableCell>
                <TableCell>
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded",
                    s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>{s.is_active ? "ACTIVE" : "OFF"}</span>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)} title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(s.id, s.is_active)}>
                    {s.is_active ? <EyeOff className="h-3.5 w-3.5 text-destructive" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted-foreground">
          {total > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}` : "0 results"}
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

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Cost (NEURONS)</Label>
              <Input type="number" value={editForm.credits_cost} onChange={e => setEditForm(f => ({ ...f, credits_cost: Number(e.target.value) }))} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Input value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className="h-8 text-xs" />
            </div>
            <Button onClick={saveEdit} disabled={saving} className="w-full gap-1.5 h-8 text-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}