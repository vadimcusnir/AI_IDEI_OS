import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface KBItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  reading_time: number;
  view_count: number;
  status: string;
  is_public: boolean;
  created_by: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseKnowledgeBaseOptions {
  category?: string;
  status?: string;
}

export function useKnowledgeBase(opts: UseKnowledgeBaseOptions = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from("knowledge_items")
        .select("*")
        .order("updated_at", { ascending: false });

      if (opts.category) query = query.eq("category", opts.category);
      if (opts.status) query = query.eq("status", opts.status);

      const { data } = await query;
      setItems((data as unknown as KBItem[]) || []);
      setLoading(false);
    };

    load();
  }, [opts.category, opts.status]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.excerpt?.toLowerCase().includes(q) ||
        (i.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }, [items, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const trackView = async (articleId: string) => {
    if (!user) return;
    await supabase.rpc("kb_track_view", { _article_id: articleId, _user_id: user.id });
  };

  return { items: filtered, allItems: items, loading, search, setSearch, categoryCounts, trackView };
}
