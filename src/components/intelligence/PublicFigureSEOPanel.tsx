/**
 * PublicFigureSEOPanel — Manages SEO metadata for public intelligence profiles.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Globe, Save } from "lucide-react";
import { toast } from "sonner";

interface SEOData {
  id?: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  keyword_clusters: string[];
}

export function PublicFigureSEOPanel({ profileId }: { profileId: string }) {
  const [seo, setSeo] = useState<SEOData>({
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    keyword_clusters: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("public_figure_seo") as any)
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (data) {
      setSeo({
        id: data.id,
        canonical_url: data.canonical_url || "",
        og_title: data.og_title || "",
        og_description: data.og_description || "",
        og_image_url: data.og_image_url || "",
        keyword_clusters: data.keyword_clusters || [],
      });
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        profile_id: profileId,
        canonical_url: seo.canonical_url || null,
        og_title: seo.og_title || null,
        og_description: seo.og_description || null,
        og_image_url: seo.og_image_url || null,
        keyword_clusters: seo.keyword_clusters,
        updated_at: new Date().toISOString(),
      };

      if (seo.id) {
        const { error } = await (supabase.from("public_figure_seo") as any)
          .update(payload)
          .eq("id", seo.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("public_figure_seo") as any)
          .insert(payload);
        if (error) throw error;
      }
      toast.success("SEO metadata saved");
      await load();
    } catch (e) {
      toast.error("Failed to save SEO data");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold">Public Figure SEO</p>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Canonical URL</label>
          <Input value={seo.canonical_url} onChange={e => setSeo(s => ({ ...s, canonical_url: e.target.value }))} placeholder="/profiles/name-slug" className="h-8 text-xs mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50">OG Title</label>
          <Input value={seo.og_title} onChange={e => setSeo(s => ({ ...s, og_title: e.target.value }))} placeholder="Profile title for social sharing" className="h-8 text-xs mt-1" />
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">{seo.og_title.length}/60 chars</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50">OG Description</label>
          <Input value={seo.og_description} onChange={e => setSeo(s => ({ ...s, og_description: e.target.value }))} placeholder="Brief description for search engines" className="h-8 text-xs mt-1" />
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">{seo.og_description.length}/155 chars</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50">OG Image URL</label>
          <Input value={seo.og_image_url} onChange={e => setSeo(s => ({ ...s, og_image_url: e.target.value }))} placeholder="https://..." className="h-8 text-xs mt-1" />
        </div>
      </div>

      <Button size="sm" onClick={save} disabled={saving} className="w-full text-xs gap-1.5">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        Save SEO
      </Button>
    </div>
  );
}
