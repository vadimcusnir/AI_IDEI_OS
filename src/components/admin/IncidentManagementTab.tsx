import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, RefreshCw, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  related_user_id: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function IncidentManagementTab() {
  const { t } = useTranslation(["common", "errors"]);
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "medium" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setIncidents((data as Incident[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim()) { toast.error(t("errors:title_required")); return; }
    const { error } = await supabase.from("incidents").insert({
      title: form.title,
      description: form.description,
      severity: form.severity,
      assigned_to: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t("common:incident_created"));
    setForm({ title: "", description: "", severity: "medium" });
    setDialogOpen(false);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status, updated_at: new Date().toISOString() };
    if (status === "resolved") update.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("incidents").update(update).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("common:incident_status_updated", { status }));
    load();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" /> {t("incident.management")}
        </h3>
        <div className="flex gap-1.5">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> {t("incident.new")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("incident.create")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder={t("incident.title_placeholder")} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <Textarea placeholder={t("incident.description_placeholder")} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("incident.low")}</SelectItem>
                    <SelectItem value="medium">{t("incident.medium")}</SelectItem>
                    <SelectItem value="high">{t("incident.high")}</SelectItem>
                    <SelectItem value="critical">{t("incident.critical")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={create} className="w-full">{t("create")}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted-foreground">No incidents. Everything is operational.</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Created</TableHead>
                <TableHead className="text-micro">Title</TableHead>
                <TableHead className="text-micro">Severity</TableHead>
                <TableHead className="text-micro">Status</TableHead>
                <TableHead className="text-micro w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map(inc => (
                <TableRow key={inc.id}>
                  <TableCell className="text-micro text-muted-foreground whitespace-nowrap">
                    {new Date(inc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-xs font-medium">{inc.title}</p>
                      {inc.description && <p className="text-micro text-muted-foreground truncate max-w-[300px]">{inc.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-nano font-mono px-1.5 py-0.5 rounded",
                      inc.severity === "critical" ? "bg-destructive/15 text-destructive" :
                      inc.severity === "high" ? "bg-destructive/10 text-destructive" :
                      inc.severity === "medium" ? "bg-accent text-accent-foreground" :
                      "bg-muted text-muted-foreground"
                    )}>{inc.severity}</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-nano font-mono px-1.5 py-0.5 rounded",
                      inc.status === "open" ? "bg-destructive/10 text-destructive" :
                      inc.status === "investigating" ? "bg-accent text-accent-foreground" :
                      "bg-primary/10 text-primary"
                    )}>{inc.status}</span>
                  </TableCell>
                  <TableCell>
                    {inc.status !== "resolved" && (
                      <div className="flex gap-1">
                        {inc.status === "open" && (
                          <Button size="sm" variant="outline" className="h-6 text-nano" onClick={() => updateStatus(inc.id, "investigating")}>
                            Investigate
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-6 text-nano" onClick={() => updateStatus(inc.id, "resolved")}>
                          Resolve
                        </Button>
                      </div>
                    )}
                    {inc.status === "resolved" && (
                      <span className="text-nano text-muted-foreground">
                        {inc.resolved_at ? new Date(inc.resolved_at).toLocaleDateString() : "Resolved"}
                      </span>
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
