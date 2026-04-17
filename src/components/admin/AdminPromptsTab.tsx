/**
 * AdminPromptsTab — CRUD for execution_prompts and formation_frameworks.
 * Allows admins to manage the secret prompts that power service execution.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  RefreshCw, Loader2, Plus, Pencil, Save, Search, FileKey, Blocks, Sparkles,
} from "lucide-react";
import { PromptYamlGenerator } from "./PromptYamlGenerator";

interface PromptRow {
  id: string;
  internal_name: string;
  prompt_text: string;
  prompt_version: number;
  linked_service_id: string | null;
  linked_service_level: string | null;
  execution_type: string | null;
  quality_rules: Record<string, unknown> | null;
  created_at: string;
}

interface FrameworkRow {
  id: string;
  internal_name: string;
  framework_logic: string;
  linked_service_id: string | null;
  linked_service_level: string | null;
  assembly_rules: Record<string, unknown> | null;
  created_at: string;
}

export function AdminPromptsTab() {
  const [tab, setTab] = useState("prompts");

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-8">
          <TabsTrigger value="prompts" className="text-xs gap-1.5 h-7">
            <FileKey className="h-3.5 w-3.5 text-primary" /> Execution Prompts
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="text-xs gap-1.5 h-7">
            <Blocks className="h-3.5 w-3.5 text-primary" /> Formation Frameworks
          </TabsTrigger>
          <TabsTrigger value="yaml-gen" className="text-xs gap-1.5 h-7">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> YAML Generator
          </TabsTrigger>
        </TabsList>
        <TabsContent value="prompts"><PromptsTable /></TabsContent>
        <TabsContent value="frameworks"><FrameworksTable /></TabsContent>
        <TabsContent value="yaml-gen"><PromptYamlGenerator /></TabsContent>
      </Tabs>
    </div>
  );
}

function PromptsTable() {
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PromptRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ internal_name: "", prompt_text: "", execution_type: "generate", linked_service_level: "L3" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("execution_prompts").select("*").order("created_at", { ascending: false }).limit(100);
    if (search.trim()) q = q.ilike("internal_name", `%${search}%`);
    const { data } = await q;
    setRows((data as unknown as PromptRow[]) || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.internal_name || !form.prompt_text) { toast.error("Name and prompt required"); return; }
    setSaving(true);
    if (creating) {
      const { error } = await supabase.from("execution_prompts").insert({
        internal_name: form.internal_name,
        prompt_text: form.prompt_text,
        execution_type: form.execution_type,
        linked_service_level: form.linked_service_level,
      } as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Prompt created");
    } else if (editing) {
      const { error } = await supabase.from("execution_prompts").update({
        internal_name: form.internal_name,
        prompt_text: form.prompt_text,
        execution_type: form.execution_type,
        linked_service_level: form.linked_service_level,
      } as any).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Prompt updated");
    }
    setSaving(false); setEditing(null); setCreating(false); load();
  };

  const dialogOpen = !!editing || creating;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts..." className="h-7 text-xs pl-8" />
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { setCreating(true); setEditing(null); setForm({ internal_name: "", prompt_text: "", execution_type: "generate", linked_service_level: "L3" }); }}>
            <Plus className="h-3 w-3" /> Add Prompt
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
                <TableHead className="text-micro">Name</TableHead>
                <TableHead className="text-micro">Level</TableHead>
                <TableHead className="text-micro">Type</TableHead>
                <TableHead className="text-micro">Version</TableHead>
                <TableHead className="text-micro">Preview</TableHead>
                <TableHead className="text-micro w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{r.internal_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-nano">{r.linked_service_level || "—"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.execution_type || "—"}</TableCell>
                  <TableCell className="text-xs font-mono">v{r.prompt_version}</TableCell>
                  <TableCell className="text-micro text-muted-foreground max-w-[200px] truncate">{r.prompt_text?.substring(0, 80)}...</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                      setEditing(r); setCreating(false);
                      setForm({ internal_name: r.internal_name, prompt_text: r.prompt_text, execution_type: r.execution_type || "generate", linked_service_level: r.linked_service_level || "L3" });
                    }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No execution prompts found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) { setEditing(null); setCreating(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-sm">{creating ? "Create Execution Prompt" : "Edit Execution Prompt"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Internal Name *</Label>
              <Input value={form.internal_name} onChange={e => setForm(f => ({ ...f, internal_name: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Service Level</Label>
                <Select value={form.linked_service_level} onValueChange={v => setForm(f => ({ ...f, linked_service_level: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["L3", "L2", "L1"].map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Execution Type</Label>
                <Select value={form.execution_type} onValueChange={v => setForm(f => ({ ...f, execution_type: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["generate", "analyze", "extract", "structure", "evaluate"].map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Prompt Text *</Label>
              <Textarea value={form.prompt_text} onChange={e => setForm(f => ({ ...f, prompt_text: e.target.value }))} className="text-xs min-h-[200px] font-mono" placeholder="System prompt for AI execution..." />
            </div>
            <Button onClick={save} disabled={saving} className="w-full gap-1.5 h-8 text-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {creating ? "Create Prompt" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FrameworksTable() {
  const [rows, setRows] = useState<FrameworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FrameworkRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ internal_name: "", framework_logic: "", linked_service_level: "L2" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("formation_frameworks").select("*").order("created_at", { ascending: false }).limit(100);
    if (search.trim()) q = q.ilike("internal_name", `%${search}%`);
    const { data } = await q;
    setRows((data as unknown as FrameworkRow[]) || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.internal_name || !form.framework_logic) { toast.error("Name and logic required"); return; }
    setSaving(true);
    const payload = { internal_name: form.internal_name, framework_logic: form.framework_logic, linked_service_level: form.linked_service_level } as any;
    if (creating) {
      const { error } = await supabase.from("formation_frameworks").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Framework created");
    } else if (editing) {
      const { error } = await supabase.from("formation_frameworks").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Framework updated");
    }
    setSaving(false); setEditing(null); setCreating(false); load();
  };

  const dialogOpen = !!editing || creating;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search frameworks..." className="h-7 text-xs pl-8" />
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { setCreating(true); setEditing(null); setForm({ internal_name: "", framework_logic: "", linked_service_level: "L2" }); }}>
            <Plus className="h-3 w-3" /> Add Framework
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
                <TableHead className="text-micro">Name</TableHead>
                <TableHead className="text-micro">Level</TableHead>
                <TableHead className="text-micro">Preview</TableHead>
                <TableHead className="text-micro w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{r.internal_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-nano">{r.linked_service_level || "—"}</Badge></TableCell>
                  <TableCell className="text-micro text-muted-foreground max-w-[250px] truncate">{r.framework_logic?.substring(0, 100)}...</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                      setEditing(r); setCreating(false);
                      setForm({ internal_name: r.internal_name, framework_logic: r.framework_logic, linked_service_level: r.linked_service_level || "L2" });
                    }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No formation frameworks found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) { setEditing(null); setCreating(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-sm">{creating ? "Create Framework" : "Edit Framework"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Internal Name *</Label>
              <Input value={form.internal_name} onChange={e => setForm(f => ({ ...f, internal_name: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Service Level</Label>
              <Select value={form.linked_service_level} onValueChange={v => setForm(f => ({ ...f, linked_service_level: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["L3", "L2", "L1"].map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Framework Logic *</Label>
              <Textarea value={form.framework_logic} onChange={e => setForm(f => ({ ...f, framework_logic: e.target.value }))} className="text-xs min-h-[200px] font-mono" placeholder="Assembly logic, rules, and framework definition..." />
            </div>
            <Button onClick={save} disabled={saving} className="w-full gap-1.5 h-8 text-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {creating ? "Create Framework" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
