/**
 * AdminCMSTab — Content Management for editable site sections.
 * Allows admins to edit landing, pricing, docs content without changing code.
 * Phase 8.5
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  RefreshCw, Loader2, Plus, Pencil, Save, Search, FileText,
  Eye, EyeOff, Globe,
} from "lucide-react";

interface ContentRow {
  id: string;
  content_key: string;
  section: string;
  locale: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const SECTIONS = ["landing", "pricing", "docs", "legal", "onboarding", "notifications", "seo", "emails"];
const LOCALES = ["ro", "en", "ru"];

const EMPTY_FORM = {
  content_key: "",
  section: "landing",
  locale: "ro",
  title: "",
  body: "",
  seo_title: "",
  seo_description: "",
  is_published: false,
};

export function AdminCMSTab() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [editing, setEditing] = useState<ContentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("site_content").select("*").order("section").order("content_key").limit(200);
    if (sectionFilter !== "all") q = q.eq("section", sectionFilter);
    if (search.trim()) q = q.or(`content_key.ilike.%${search}%,title.ilike.%${search}%`);
    const { data } = await q;
    setRows((data as unknown as ContentRow[]) || []);
    setLoading(false);
  }, [search, sectionFilter]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (r: ContentRow) => {
    setEditing(r); setCreating(false);
    setForm({
      content_key: r.content_key,
      section: r.section,
      locale: r.locale,
      title: r.title,
      body: r.body,
      seo_title: (r.metadata as any)?.seo_title || "",
      seo_description: (r.metadata as any)?.seo_description || "",
      is_published: r.is_published,
    });
  };

  const openCreate = () => {
    setEditing(null); setCreating(true);
    setForm({ ...EMPTY_FORM });
  };

  const save = async () => {
    if (!form.content_key || !form.title) { toast.error("Key and title required"); return; }
    setSaving(true);

    const payload = {
      content_key: form.content_key,
      section: form.section,
      locale: form.locale,
      title: form.title,
      body: form.body,
      metadata: { seo_title: form.seo_title, seo_description: form.seo_description },
      is_published: form.is_published,
    };

    if (creating) {
      const { error } = await supabase.from("site_content").insert(payload as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Content created");
    } else if (editing) {
      const { error } = await supabase.from("site_content").update(payload as any).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Content updated");
    }
    setSaving(false); setEditing(null); setCreating(false); load();
  };

  const togglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.from("site_content").update({ is_published: !current } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(current ? "Unpublished" : "Published");
    load();
  };

  const dialogOpen = !!editing || creating;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Content Management</h2>
            <p className="text-micro text-muted-foreground">Edit site content, SEO fields, and notification templates</p>
          </div>
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={openCreate}>
          <Plus className="h-3 w-3" /> Add Content
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search content..." className="h-7 text-xs pl-8" />
        </div>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Section" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Sections</SelectItem>
            {SECTIONS.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Key</TableHead>
                <TableHead className="text-micro">Section</TableHead>
                <TableHead className="text-micro">Locale</TableHead>
                <TableHead className="text-micro">Title</TableHead>
                <TableHead className="text-micro">Status</TableHead>
                <TableHead className="text-micro w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-micro font-mono max-w-[130px] truncate">{r.content_key}</TableCell>
                  <TableCell><Badge variant="outline" className="text-nano capitalize">{r.section}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-nano">{r.locale.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{r.title}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_published ? "default" : "secondary"} className="text-nano">
                      {r.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePublish(r.id, r.is_published)}>
                      {r.is_published ? <EyeOff className="h-3.5 w-3.5 text-destructive" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No content found. Add your first content block.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) { setEditing(null); setCreating(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-sm">{creating ? "Create Content" : "Edit Content"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Content Key *</Label>
                <Input value={form.content_key} onChange={e => setForm(f => ({ ...f, content_key: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "_") }))} className="h-8 text-xs font-mono" placeholder="landing.hero_title" disabled={!!editing} />
              </div>
              <div>
                <Label className="text-xs">Section</Label>
                <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Locale</Label>
                <Select value={form.locale} onValueChange={v => setForm(f => ({ ...f, locale: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCALES.map(l => <SelectItem key={l} value={l} className="text-xs">{l.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                <Label className="text-xs">{form.is_published ? "Published" : "Draft"}</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Body Content</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="text-xs min-h-[120px]" placeholder="Content body (supports markdown)" />
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-micro font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Globe className="h-3 w-3" /> SEO Fields</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">SEO Title</Label>
                  <Input value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} className="h-8 text-xs" placeholder="Page title for search engines" />
                </div>
                <div>
                  <Label className="text-xs">SEO Description</Label>
                  <Textarea value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} className="text-xs min-h-[50px]" placeholder="Meta description (max 160 chars)" />
                </div>
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full gap-1.5 h-8 text-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {creating ? "Create Content" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
