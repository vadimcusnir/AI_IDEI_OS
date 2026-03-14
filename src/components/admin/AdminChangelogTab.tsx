import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Check, X, Pencil, Trash2, Eye, EyeOff, Sparkles, Loader2, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Entry {
  id: string; version: string; category: string; title: string; description: string;
  example: string; user_benefit: string; status: string; release_date: string;
  position: number; created_at: string;
}

interface RawChange {
  id: string; source: string; component: string | null; diff_summary: string | null;
  impact_level: string; created_at: string;
}

const CATEGORIES = [
  { value: "new_feature", label: "New Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "bug_fix", label: "Bug Fix" },
  { value: "ui_ux", label: "UI/UX Update" },
  { value: "performance", label: "Performance" },
  { value: "integration", label: "Integration" },
  { value: "documentation", label: "Documentation" },
];

const EMPTY: Omit<Entry, "id" | "created_at"> = {
  version: "", category: "new_feature", title: "", description: "",
  example: "", user_benefit: "", status: "draft",
  release_date: new Date().toISOString().split("T")[0], position: 0,
};

export function AdminChangelogTab() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [rawChanges, setRawChanges] = useState<RawChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [generating, setGenerating] = useState(false);
  const [genVersion, setGenVersion] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [entriesRes, rawRes] = await Promise.all([
      supabase.from("changelog_entries").select("*")
        .order("release_date", { ascending: false }).order("position", { ascending: true }),
      supabase.from("changes_raw").select("id, source, component, diff_summary, impact_level, created_at")
        .order("created_at", { ascending: false }).limit(50),
    ]);
    setEntries((entriesRes.data as Entry[]) || []);
    setRawChanges((rawRes.data as RawChange[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm(EMPTY); setEditingId(null); setShowForm(false); };

  const startEdit = (e: Entry) => {
    setForm({
      version: e.version, category: e.category, title: e.title,
      description: e.description, example: e.example, user_benefit: e.user_benefit,
      status: e.status, release_date: e.release_date, position: e.position,
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Titlul este obligatoriu"); return; }
    if (editingId) {
      const { error } = await supabase.from("changelog_entries").update({ ...form }).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Intrare actualizată");
    } else {
      const { error } = await supabase.from("changelog_entries").insert({ ...form, created_by: user?.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Intrare creată");
    }
    resetForm(); load();
  };

  const togglePublish = async (entry: Entry) => {
    const newStatus = entry.status === "published" ? "draft" : "published";
    const updates: any = { status: newStatus };
    if (newStatus === "published") {
      updates.approved_by = user?.id;
      updates.approved_at = new Date().toISOString();
    }
    const { error } = await supabase.from("changelog_entries").update(updates).eq("id", entry.id);
    if (error) { toast.error(error.message); return; }
    toast.success(newStatus === "published" ? "Publicat" : "Retras din public");
    load();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("changelog_entries").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Șters"); load();
  };

  const generateDrafts = async () => {
    if (!genVersion.trim()) { toast.error("Specifică versiunea"); return; }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/changelog-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ version: genVersion, since: new Date(Date.now() - 7 * 86400000).toISOString() }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Generation failed");
      toast.success(`${result.drafts} drafturi generate`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const publishAllDrafts = async () => {
    const drafts = entries.filter(e => e.status === "draft");
    if (!drafts.length) { toast.info("Niciun draft de publicat"); return; }
    const ids = drafts.map(e => e.id);
    const { error } = await supabase.from("changelog_entries")
      .update({ status: "published", approved_by: user?.id, approved_at: new Date().toISOString() })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} intrări publicate`);
    load();
  };

  const F = (key: keyof typeof form, val: string | number) => setForm(p => ({ ...p, [key]: val }));
  const draftCount = entries.filter(e => e.status === "draft").length;

  return (
    <div className="space-y-4">
      {/* Header + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold">Changelog Intelligence</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowRaw(!showRaw)}>
            <Database className="h-3.5 w-3.5" /> Raw ({rawChanges.length})
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5" /> Manual
          </Button>
        </div>
      </div>

      {/* AI Generate Section */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">AI Narrative Generator</span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          Generează drafturi din schimbările brute detectate în ultimele 7 zile. AI-ul transformă evenimentele tehnice în narativ user-facing.
        </p>
        <div className="flex gap-2 items-center">
          <Input placeholder="Versiune (ex: v1.5)" value={genVersion} onChange={e => setGenVersion(e.target.value)} className="text-xs h-8 w-40" />
          <Button size="sm" className="gap-1.5 text-xs h-8" onClick={generateDrafts} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? "Generez..." : "Generează drafturi"}
          </Button>
          {draftCount > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={publishAllDrafts}>
              <Eye className="h-3.5 w-3.5" /> Publică toate ({draftCount})
            </Button>
          )}
        </div>
      </div>

      {/* Raw Changes Panel */}
      {showRaw && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 max-h-64 overflow-y-auto">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Raw Change Events</h4>
          {rawChanges.length === 0 ? (
            <p className="text-xs text-muted-foreground">Niciun eveniment brut. Folosește webhook-ul sau adaugă manual.</p>
          ) : (
            <div className="space-y-1">
              {rawChanges.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-[10px] py-1 border-b border-border/50 last:border-0">
                  <span className="font-mono bg-muted px-1 py-0.5 rounded uppercase">{r.source}</span>
                  <span className="text-muted-foreground">{r.component || "—"}</span>
                  <span className="flex-1 truncate">{r.diff_summary || "—"}</span>
                  <span className={cn("px-1 py-0.5 rounded", r.impact_level === "user" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{r.impact_level}</span>
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Versiune (ex: v1.4)" value={form.version} onChange={e => F("version", e.target.value)} className="text-xs" />
            <Input type="date" value={form.release_date} onChange={e => F("release_date", e.target.value)} className="text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.category} onValueChange={v => F("category", v)}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Poziție" value={form.position} onChange={e => F("position", parseInt(e.target.value) || 0)} className="text-xs" />
          </div>
          <Input placeholder="Titlu *" value={form.title} onChange={e => F("title", e.target.value)} className="text-xs" />
          <Textarea placeholder="Descriere" value={form.description} onChange={e => F("description", e.target.value)} className="text-xs min-h-[60px]" />
          <Textarea placeholder="Exemplu practic" value={form.example} onChange={e => F("example", e.target.value)} className="text-xs min-h-[40px]" />
          <Textarea placeholder="Beneficiu utilizator" value={form.user_benefit} onChange={e => F("user_benefit", e.target.value)} className="text-xs min-h-[40px]" />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={resetForm} className="text-xs gap-1"><X className="h-3 w-3" /> Cancel</Button>
            <Button size="sm" onClick={save} className="text-xs gap-1"><Check className="h-3 w-3" /> {editingId ? "Save" : "Create"}</Button>
          </div>
        </div>
      )}

      {/* Entries Table */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Nicio intrare în changelog.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Versiune</TableHead>
                <TableHead className="text-[10px]">Categorie</TableHead>
                <TableHead className="text-[10px]">Titlu</TableHead>
                <TableHead className="text-[10px]">Status</TableHead>
                <TableHead className="text-[10px]">Data</TableHead>
                <TableHead className="text-[10px] text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs font-mono">{e.version || "—"}</TableCell>
                  <TableCell>
                    <span className="text-[9px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded">
                      {CATEGORIES.find(c => c.value === e.category)?.label || e.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{e.title}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded",
                      e.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>{e.status}</span>
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{e.release_date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => togglePublish(e)} title={e.status === "published" ? "Retrage" : "Publică"}>
                        {e.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteEntry(e.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
