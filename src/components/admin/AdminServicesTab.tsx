import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";

interface ServiceRow {
  id: string; service_key: string; name: string; category: string;
  credits_cost: number; is_active: boolean; service_class: string;
}

export function AdminServicesTab() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("service_catalog")
      .select("id, service_key, name, category, credits_cost, is_active, service_class")
      .order("created_at", { ascending: false });
    setServices(data as ServiceRow[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("service_catalog").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Service ${!current ? "activated" : "deactivated"}`);
    load();
  };

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
              <TableHead className="text-[10px]">Key</TableHead>
              <TableHead className="text-[10px]">Name</TableHead>
              <TableHead className="text-[10px]">Category</TableHead>
              <TableHead className="text-[10px]">Class</TableHead>
              <TableHead className="text-[10px] text-right">Cost</TableHead>
              <TableHead className="text-[10px]">Status</TableHead>
              <TableHead className="text-[10px] w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map(s => (
              <TableRow key={s.id}>
                <TableCell className="text-[10px] font-mono">{s.service_key}</TableCell>
                <TableCell className="text-xs font-medium">{s.name}</TableCell>
                <TableCell>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.category}</span>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded",
                    s.service_class === "A" ? "bg-primary/10 text-primary" :
                    s.service_class === "B" ? "bg-warning/10 text-warning" :
                    "bg-destructive/10 text-destructive"
                  )}>{s.service_class}</span>
                </TableCell>
                <TableCell className="text-xs font-mono text-right">{s.credits_cost}</TableCell>
                <TableCell>
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded",
                    s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>{s.is_active ? "ACTIVE" : "INACTIVE"}</span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(s.id, s.is_active)}>
                    {s.is_active ? <EyeOff className="h-3.5 w-3.5 text-destructive" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
