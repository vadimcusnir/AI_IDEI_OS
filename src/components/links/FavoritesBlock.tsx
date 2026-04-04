import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Star, Plus, Trash2, ExternalLink, GripVertical, Loader2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface UserLink {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  position: number;
}

export function FavoritesBlock() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newHref, setNewHref] = useState("");

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_links")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    if (data) setLinks(data as UserLink[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleAdd = async () => {
    if (!user || !newTitle.trim() || !newHref.trim()) return;
    const { error } = await supabase.from("user_links").insert({
      user_id: user.id,
      title: newTitle.trim(),
      href: newHref.trim(),
      position: links.length,
    });
    if (error) {
      toast.error(t("link_add_failed"));
      return;
    }
    setNewTitle("");
    setNewHref("");
    setAdding(false);
    fetchLinks();
    toast.success(t("link_added"));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_links").delete().eq("id", id);
    setLinks(prev => prev.filter(l => l.id !== id));
    toast.success(t("link_deleted"));
  };

  if (!user) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          Linkurile tale favorite
        </h2>
        <Star className="h-3 w-3 text-muted-foreground/40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {links.length > 0 && (
            <div className="space-y-2 mb-3">
              {links.map(link => (
                <div
                  key={link.id}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card group"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{link.title}</span>
                    <span className="text-xs text-muted-foreground truncate block">{link.href}</span>
                  </div>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/40 hover:text-primary shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="text-muted-foreground/30 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {adding ? (
            <div className="px-4 py-3 rounded-xl border border-primary/20 bg-card space-y-2">
              <input
                type="text"
                placeholder={t("common:link_title_placeholder")}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full text-sm bg-transparent border-b border-border px-0 py-1 outline-none focus:border-primary placeholder:text-muted-foreground/40"
              />
              <input
                type="url"
                placeholder="https://..."
                value={newHref}
                onChange={e => setNewHref(e.target.value)}
                className="w-full text-sm bg-transparent border-b border-border px-0 py-1 outline-none focus:border-primary placeholder:text-muted-foreground/40"
              />
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>
                  {t("common:save")}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Adaugă link favorit
            </button>
          )}
        </>
      )}
    </div>
  );
}
