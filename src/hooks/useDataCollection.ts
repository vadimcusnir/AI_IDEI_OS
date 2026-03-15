import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CognitiveCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  depth: number;
  parent_id: string | null;
}

interface CognitiveUnit {
  id: string;
  category_id: string;
  title: string;
  content: string;
  unit_type: string;
  confidence: number;
  quality_score: number;
  tags: string[];
  is_validated: boolean;
  llm_ready: boolean;
  created_at: string;
}

interface PipelineStats {
  total_units: number;
  validated_units: number;
  llm_ready_units: number;
  total_runs: number;
  categories_used: number;
  avg_quality: number;
}

export function useDataCollection() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CognitiveCategory[]>([]);
  const [units, setUnits] = useState<CognitiveUnit[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [catRes, statsRes] = await Promise.all([
      supabase.from("cognitive_categories").select("*").order("position"),
      supabase.rpc("collection_pipeline_stats", { _user_id: user.id }),
    ]);

    if (catRes.data) setCategories(catRes.data as CognitiveCategory[]);
    if (statsRes.data) setStats(statsRes.data as unknown as PipelineStats);
    setLoading(false);
  }, [user]);

  const loadUnits = useCallback(async (categoryId?: string) => {
    if (!user) return;
    let query = supabase.from("cognitive_units")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data } = await query;
    if (data) setUnits(data as CognitiveUnit[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user) loadUnits(selectedCategory || undefined);
  }, [user, selectedCategory, loadUnits]);

  return {
    categories,
    units,
    stats,
    loading,
    selectedCategory,
    setSelectedCategory,
    reload: load,
    reloadUnits: loadUnits,
  };
}
