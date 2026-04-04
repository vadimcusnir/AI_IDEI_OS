/**
 * AdminKernelTab — CRUD on service_units, prompt_vault, deliverable_contracts, release gate.
 * Phase 7 / T7.1
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Server, Search, RefreshCw, Plus, Edit2, Archive, Eye, EyeOff,
  ShieldCheck, CheckCircle, XCircle, Loader2, Lock, FileText, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ServiceUnit {
  id: string;
  name: string;
  level: string;
  single_output: string;
  single_function: string;
  mechanism: string;
  role: string;
  status: string;
  neurons_cost: number;
  created_at: string;
}

interface PromptVaultEntry {
  prompt_id: string;
  service_unit_id: string;
  purpose: string;
  access_scope: string;
  version: number;
  created_at: string;
}

interface DeliverableContract {
  deliverable_id: string;
  service_unit_id: string;
  asset_type: string;
  reuse_value: string;
  ownership: string;
  created_at: string;
}

interface ReleaseLogEntry {
  id: string;
  service_unit_id: string;
  atomicity_check: boolean;
  duplication_check: boolean;
  schema_check: boolean;
  monetization_check: boolean;
  root2_check: boolean;
  total_score: number;
  approval_status: string;
  created_at: string;
}

const PAGE_SIZE = 20;

export function AdminKernelTab() {
  const [subTab, setSubTab] = useState("units");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Server className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold">Kernel Registry Control</h2>
          <p className="text-micro text-muted-foreground">CRUD on service contracts, prompts, deliverables & release gates</p>
        </div>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="units" className="text-micro gap-1"><Package className="h-3 w-3" /> Units</TabsTrigger>
          <TabsTrigger value="prompts" className="text-micro gap-1"><Lock className="h-3 w-3" /> Vault</TabsTrigger>
          <TabsTrigger value="deliverables" className="text-micro gap-1"><FileText className="h-3 w-3" /> Deliverables</TabsTrigger>
          <TabsTrigger value="gates" className="text-micro gap-1"><ShieldCheck className="h-3 w-3" /> Gates</TabsTrigger>
        </TabsList>

        <TabsContent value="units"><ServiceUnitsPanel /></TabsContent>
        <TabsContent value="prompts"><PromptVaultPanel /></TabsContent>
        <TabsContent value="deliverables"><DeliverablesPanel /></TabsContent>
        <TabsContent value="gates"><ReleaseGatePanel /></TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════
// SERVICE UNITS PANEL
// ═══════════════════════════════════════
function ServiceUnitsPanel() {
  const [units, setUnits] = useState<ServiceUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editUnit, setEditUnit] = useState<ServiceUnit | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("service_units").select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) q = q.ilike("name", `%${search}%`);

    const { data, count } = await q;
    setUnits((data as any[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("service_units").update({ status } as any).eq("id", id);
    toast.success(`Unit ${status}`);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search units..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1 text-xs h-8">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
        <Badge variant="secondary" className="text-nano">{total} units</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Name</TableHead>
                <TableHead className="text-micro">Level</TableHead>
                <TableHead className="text-micro">Output</TableHead>
                <TableHead className="text-micro">Role</TableHead>
                <TableHead className="text-micro">Cost</TableHead>
                <TableHead className="text-micro">Status</TableHead>
                <TableHead className="text-micro text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs font-medium max-w-[200px] truncate">{u.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-nano">{u.level}</Badge></TableCell>
                  <TableCell className="text-micro text-muted-foreground max-w-[150px] truncate">{u.single_output}</TableCell>
                  <TableCell className="text-micro">{u.role}</TableCell>
                  <TableCell className="text-micro font-mono">{u.neurons_cost}N</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status === "active" ? "default" : u.status === "archived" ? "secondary" : "outline"}
                      className="text-nano"
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditUnit(u)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Archive className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive "{u.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This will deactivate the service unit. It can be restored later.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => updateStatus(u.id, "archived")}>Archive</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-micro text-muted-foreground">
          {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-micro" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <Button variant="outline" size="sm" className="h-7 text-micro" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Edit Dialog */}
      {editUnit && (
        <EditUnitDialog unit={editUnit} onClose={() => setEditUnit(null)} onSaved={load} />
      )}
    </div>
  );
}

function EditUnitDialog({ unit, onClose, onSaved }: { unit: ServiceUnit; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(unit.name);
  const [output, setOutput] = useState(unit.single_output);
  const [func, setFunc] = useState(unit.single_function);
  const [mechanism, setMechanism] = useState(unit.mechanism);
  const [cost, setCost] = useState(unit.neurons_cost);
  const [status, setStatus] = useState(unit.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from("service_units").update({
      name, single_output: output, single_function: func,
      mechanism, neurons_cost: cost, status,
    } as any).eq("id", unit.id);
    toast.success("Unit updated");
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">Edit Service Unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-micro">Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-micro">Single Output</Label><Input value={output} onChange={e => setOutput(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-micro">Single Function</Label><Input value={func} onChange={e => setFunc(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-micro">Mechanism</Label><Input value={mechanism} onChange={e => setMechanism(e.target.value)} className="h-8 text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-micro">Neurons Cost</Label><Input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="h-8 text-xs" /></div>
            <div>
              <Label className="text-micro">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════
// PROMPT VAULT PANEL
// ═══════════════════════════════════════
function PromptVaultPanel() {
  const [entries, setEntries] = useState<PromptVaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [revealId, setRevealId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase.from("prompt_vault")
      .select("prompt_id, service_unit_id, purpose, access_scope, version, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setEntries((data as any[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-nano">{total} prompts</Badge>
        <Button variant="outline" size="sm" onClick={load} className="gap-1 text-xs h-8 ml-auto">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Prompt ID</TableHead>
                <TableHead className="text-micro">Purpose</TableHead>
                <TableHead className="text-micro">Scope</TableHead>
                <TableHead className="text-micro">Version</TableHead>
                <TableHead className="text-micro">Created</TableHead>
                <TableHead className="text-micro text-right">Visibility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.prompt_id}>
                  <TableCell className="text-micro font-mono">{e.prompt_id.slice(0, 8)}…</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{e.purpose}</TableCell>
                  <TableCell>
                    <Badge variant={e.access_scope === "admin" ? "destructive" : "outline"} className="text-nano">
                      {e.access_scope}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-micro font-mono">v{e.version}</TableCell>
                  <TableCell className="text-micro text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString("ro-RO")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost" size="sm" className="h-6 w-6 p-0"
                      onClick={() => setRevealId(revealId === e.prompt_id ? null : e.prompt_id)}
                    >
                      {revealId === e.prompt_id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-micro text-muted-foreground">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-micro" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <Button variant="outline" size="sm" className="h-7 text-micro" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// DELIVERABLES PANEL
// ═══════════════════════════════════════
function DeliverablesPanel() {
  const [items, setItems] = useState<DeliverableContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase.from("deliverable_contracts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setItems((data as any[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-nano">{total} contracts</Badge>
        <Button variant="outline" size="sm" onClick={load} className="gap-1 text-xs h-8 ml-auto">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">ID</TableHead>
                <TableHead className="text-micro">Asset Type</TableHead>
                <TableHead className="text-micro">Reuse Value</TableHead>
                <TableHead className="text-micro">Ownership</TableHead>
                <TableHead className="text-micro">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(d => (
                <TableRow key={d.deliverable_id}>
                  <TableCell className="text-micro font-mono">{d.deliverable_id.slice(0, 8)}…</TableCell>
                  <TableCell><Badge variant="outline" className="text-nano">{d.asset_type}</Badge></TableCell>
                  <TableCell className="text-micro">{d.reuse_value}</TableCell>
                  <TableCell className="text-micro">{d.ownership}</TableCell>
                  <TableCell className="text-micro text-muted-foreground">{new Date(d.created_at).toLocaleDateString("ro-RO")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-micro text-muted-foreground">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-micro" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <Button variant="outline" size="sm" className="h-7 text-micro" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// RELEASE GATE PANEL
// ═══════════════════════════════════════
function ReleaseGatePanel() {
  const [entries, setEntries] = useState<ReleaseLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase.from("service_release_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setEntries((data as any[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const passRate = entries.length > 0
    ? Math.round(entries.filter(e => e.approval_status === "approved").length / entries.length * 100)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-nano">{total} checks</Badge>
        <Badge variant={passRate >= 80 ? "default" : "destructive"} className="text-nano">
          {passRate}% pass rate
        </Badge>
        <Button variant="outline" size="sm" onClick={load} className="gap-1 text-xs h-8 ml-auto">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Unit ID</TableHead>
                <TableHead className="text-micro">Atomicity</TableHead>
                <TableHead className="text-micro">Dedup</TableHead>
                <TableHead className="text-micro">Schema</TableHead>
                <TableHead className="text-micro">Monetization</TableHead>
                <TableHead className="text-micro">Root2</TableHead>
                <TableHead className="text-micro">Score</TableHead>
                <TableHead className="text-micro">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-micro font-mono">{e.service_unit_id.slice(0, 8)}…</TableCell>
                  <TableCell>{e.atomicity_check ? <CheckCircle className="h-3.5 w-3.5 text-status-validated" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}</TableCell>
                  <TableCell>{e.duplication_check ? <CheckCircle className="h-3.5 w-3.5 text-status-validated" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}</TableCell>
                  <TableCell>{e.schema_check ? <CheckCircle className="h-3.5 w-3.5 text-status-validated" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}</TableCell>
                  <TableCell>{e.monetization_check ? <CheckCircle className="h-3.5 w-3.5 text-status-validated" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}</TableCell>
                  <TableCell>{e.root2_check ? <CheckCircle className="h-3.5 w-3.5 text-status-validated" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}</TableCell>
                  <TableCell className="text-micro font-mono font-bold">{(e.total_score * 100).toFixed(0)}%</TableCell>
                  <TableCell>
                    <Badge variant={e.approval_status === "approved" ? "default" : "destructive"} className="text-nano">
                      {e.approval_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-micro text-muted-foreground">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-micro" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <Button variant="outline" size="sm" className="h-7 text-micro" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
