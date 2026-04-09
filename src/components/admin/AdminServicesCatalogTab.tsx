/**
 * AdminServicesCatalogTab — CRUD for the L1/L2/L3 service hierarchy.
 * Tabs for each level with inline editing, create, activate/deactivate.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ServiceCompositionEditor } from "@/components/admin/ServiceCompositionEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Eye, EyeOff, RefreshCw, Loader2, Search, Pencil, Save, Plus, Zap, Layers, Server,
} from "lucide-react";

type Level = "L3" | "L2" | "L1";

const TABLE_MAP: Record<Level, string> = {
  L3: "services_level_3",
  L2: "services_level_2",
  L1: "services_level_1",
};

const LEVEL_META: Record<Level, { label: string; icon: typeof Zap; color: string }> = {
  L3: { label: "Atomic (Quick)", icon: Zap, color: "text-emerald-500" },
  L2: { label: "Clusters (Pack)", icon: Layers, color: "text-blue-500" },
  L1: { label: "Master Systems", icon: Server, color: "text-purple-500" },
};

interface ServiceRow {
  id: string;
  service_name: string;
  service_slug: string;
  category: string;
  subcategory: string | null;
  description_public: string;
  price_usd: number;
  internal_credit_cost: number;
  deliverable_name: string;
  deliverable_type: string;
  estimated_delivery_seconds: number;
  status: string;
  visibility: string;
}

const EMPTY_FORM: Omit<ServiceRow, "id"> = {
  service_name: "",
  service_slug: "",
  category: "marketing",
  subcategory: null,
  description_public: "",
  price_usd: 0,
  internal_credit_cost: 0,
  deliverable_name: "",
  deliverable_type: "document",
  estimated_delivery_seconds: 30,
  status: "active",
  visibility: "public",
};

export function AdminServicesCatalogTab() {
  const [level, setLevel] = useState<Level>("L3");

  return (
    <div className="space-y-4">
      <Tabs value={level} onValueChange={(v) => setLevel(v as Level)}>
        <TabsList className="h-8">
          {(["L3", "L2", "L1"] as Level[]).map(l => {
            const meta = LEVEL_META[l];
            const Icon = meta.icon;
            return (
              <TabsTrigger key={l} value={l} className="text-xs gap-1.5 h-7">
                <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                {meta.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(["L3", "L2", "L1"] as Level[]).map(l => (
          <TabsContent key={l} value={l}>
            <LevelTable level={l} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function LevelTable({ level }: { level: Level }) {
  const tableName = TABLE_MAP[level];
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<ServiceRow, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [componentIds, setComponentIds] = useState<string[]>([]);
  const [optionalL3Ids, setOptionalL3Ids] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from(tableName as any)
      .select("id, service_name, service_slug, category, subcategory, description_public, price_usd, internal_credit_cost, deliverable_name, deliverable_type, estimated_delivery_seconds, status, visibility")
      .order("created_at", { ascending: false })
      .limit(100);

    if (search.trim()) {
      query = query.or(`service_name.ilike.%${search}%,service_slug.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data } = await query;
    setRows((data as unknown as ServiceRow[]) || []);
    setLoading(false);
  }, [tableName, search]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "inactive" : "active";
    const { error } = await supabase.from(tableName as any).update({ status: next } as any).eq("id", id as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`Service ${next}`);
    load();
  };

  const openEdit = async (s: ServiceRow) => {
    setEditing(s);
    setForm({ ...s });
    setCreating(false);
    // Load composition data for L2/L1
    if (level === "L2") {
      const { data } = await (supabase.from("services_level_2") as any).select("component_l3_ids").eq("id", s.id).single();
      setComponentIds(data?.component_l3_ids || []);
      setOptionalL3Ids([]);
    } else if (level === "L1") {
      const { data } = await (supabase.from("services_level_1") as any).select("component_l2_ids, component_l3_ids_optional").eq("id", s.id).single();
      setComponentIds(data?.component_l2_ids || []);
      setOptionalL3Ids(data?.component_l3_ids_optional || []);
    } else {
      setComponentIds([]);
      setOptionalL3Ids([]);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setCreating(true);
  };

  const saveForm = async () => {
    if (!form.service_name || !form.service_slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);

    if (creating) {
      const { error } = await supabase.from(tableName as any).insert(form as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Service created");
    } else if (editing) {
      const { error } = await supabase.from(tableName as any).update(form as any).eq("id", editing.id as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Service updated");
    }

    setSaving(false);
    setEditing(null);
    setCreating(false);
    load();
  };

  const dialogOpen = !!editing || creating;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="h-7 text-xs pl-8" />
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={openCreate}>
            <Plus className="h-3 w-3" /> Add {level}
          </Button>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Slug</TableHead>
                <TableHead className="text-micro">Name</TableHead>
                <TableHead className="text-micro">Category</TableHead>
                <TableHead className="text-micro text-right">$USD</TableHead>
                <TableHead className="text-micro text-right">Neurons</TableHead>
                <TableHead className="text-micro">Status</TableHead>
                <TableHead className="text-micro w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-micro font-mono max-w-[130px] truncate">{s.service_slug}</TableCell>
                  <TableCell className="text-xs font-medium max-w-[200px] truncate">{s.service_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-nano">{s.category}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">${s.price_usd}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{s.internal_credit_cost}N</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-nano">
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus(s.id, s.status)}>
                      {s.status === "active" ? <EyeOff className="h-3.5 w-3.5 text-destructive" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                    No {level} services found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">{creating ? `Create ${level} Service` : `Edit ${level} Service`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Name *</Label>
                <Input value={form.service_name} onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Slug *</Label>
                <Input
                  value={form.service_slug}
                  onChange={e => setForm(f => ({ ...f, service_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description_public} onChange={e => setForm(f => ({ ...f, description_public: e.target.value }))} className="text-xs min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["marketing", "writing", "strategy", "communication", "psychology", "research", "professional"].map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Subcategory</Label>
                <Input value={form.subcategory || ""} onChange={e => setForm(f => ({ ...f, subcategory: e.target.value || null }))} className="h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Price (USD)</Label>
                <Input type="number" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: Number(e.target.value) }))} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Cost (Neurons)</Label>
                <Input type="number" value={form.internal_credit_cost} onChange={e => setForm(f => ({ ...f, internal_credit_cost: Number(e.target.value) }))} className="h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Deliverable Name</Label>
                <Input value={form.deliverable_name} onChange={e => setForm(f => ({ ...f, deliverable_name: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Deliverable Type</Label>
                <Select value={form.deliverable_type} onValueChange={v => setForm(f => ({ ...f, deliverable_type: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["document", "report", "analysis", "framework", "strategy", "bundle"].map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Delivery (sec)</Label>
                <Input type="number" value={form.estimated_delivery_seconds} onChange={e => setForm(f => ({ ...f, estimated_delivery_seconds: Number(e.target.value) }))} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">Active</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                    <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Visibility</Label>
                <Select value={form.visibility} onValueChange={v => setForm(f => ({ ...f, visibility: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public" className="text-xs">Public</SelectItem>
                    <SelectItem value="private" className="text-xs">Private</SelectItem>
                    <SelectItem value="unlisted" className="text-xs">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveForm} disabled={saving} className="w-full gap-1.5 h-8 text-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {creating ? "Create Service" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
