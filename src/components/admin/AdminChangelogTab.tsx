import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Check, X, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Entry {
  id: string;
  version: string;
  category: string;
  title: string;
  description: string;
  example: string;
  user_benefit: string;
  status: string;
  release_date: string;
  position: number;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("changelog_entries")
      .select("*")
      .order("release_date", { ascending: false })
      .order("position", { ascending: true });
    setEntries((data as Entry[]) || []);
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
      const { error } = await supabase.from("changelog_entries")
        .update({ ...form }).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Entrada actualizată");
    } else {
      const { error } = await supabase.from("changelog_entries")
        .insert({ ...form, created_by: user?.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Entrada creată");
    }
    resetForm();
    load();
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
    toast.success("Șters");
    load();
  };

  const F = (key: keyof typeof form, val: string | number) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Changelog Entries</h3>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" /> Adaugă
        </Button>
      </div>

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
            <Button size="sm" variant="ghost" onClick={resetForm} className="text-xs gap-1"><X className="h-3 w-3" /> Anulează</Button>
            <Button size="sm" onClick={save} className="text-xs gap-1"><Check className="h-3 w-3" /> {editingId ? "Salvează" : "Creează"}</Button>
          </div>
        </div>
      )}

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
