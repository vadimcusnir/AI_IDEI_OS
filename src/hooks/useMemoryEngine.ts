/**
 * useMemoryEngine — captures, recalls, and manages user memory entries.
 * Provides context prefill and auto-recall for reducing friction.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MemoryEntry {
  id: string;
  memory_type: string;
  category: string;
  title: string;
  content: string;
  relevance_score: number;
  access_count: number;
  last_accessed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useMemoryEngine() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("user_memory_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("relevance_score", { ascending: false })
      .limit(100);

    setMemories((data as unknown as MemoryEntry[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /** Save a new memory entry */
  const capture = useCallback(async (entry: {
    memory_type: string;
    category: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!user) return;
    await supabase.from("user_memory_entries").insert({
      user_id: user.id,
      ...entry,
    } as any);
    await load();
  }, [user, load]);

  /** Recall memories by type/category for context prefill */
  const recall = useCallback(async (opts: {
    memory_type?: string;
    category?: string;
    limit?: number;
  }) => {
    if (!user) return [];

    let query = supabase
      .from("user_memory_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("relevance_score", { ascending: false })
      .limit(opts.limit || 10);

    if (opts.memory_type) query = query.eq("memory_type", opts.memory_type);
    if (opts.category) query = query.eq("category", opts.category);

    const { data } = await query;
    return (data as unknown as MemoryEntry[]) || [];
  }, [user]);

  /** Delete a memory */
  const forget = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("user_memory_entries").delete().eq("id", id).eq("user_id", user.id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, [user]);

  /** Get context string for AI prefill */
  const getContextPrefill = useCallback(async (category?: string) => {
    const relevant = await recall({ memory_type: "context", category, limit: 5 });
    if (relevant.length === 0) return "";
    return relevant.map(m => `[${m.category}] ${m.title}: ${m.content}`).join("\n");
  }, [recall]);

  const stats = {
    total: memories.length,
    byType: memories.reduce((acc, m) => {
      acc[m.memory_type] = (acc[m.memory_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return { memories, loading, capture, recall, forget, getContextPrefill, stats, reload: load };
}
