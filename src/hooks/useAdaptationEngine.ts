/**
 * useAdaptationEngine — detects behavioral changes and adapts system responses.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdaptationEntry {
  id: string;
  adaptation_type: string;
  old_value: any;
  new_value: any;
  confidence: number;
  applied: boolean;
  applied_at: string | null;
  created_at: string;
}

export function useAdaptationEngine() {
  const { user } = useAuth();
  const [adaptations, setAdaptations] = useState<AdaptationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("user_adaptation_log")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setAdaptations((data as unknown as AdaptationEntry[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /** Log a detected behavioral change */
  const logAdaptation = useCallback(async (entry: {
    adaptation_type: string;
    old_value: any;
    new_value: any;
    confidence?: number;
  }) => {
    if (!user) return;
    await supabase.from("user_adaptation_log").insert({
      user_id: user.id,
      adaptation_type: entry.adaptation_type,
      old_value: entry.old_value,
      new_value: entry.new_value,
      confidence: entry.confidence || 0.5,
    } as any);
  }, [user]);

  /** Apply an adaptation (mark as active) */
  const applyAdaptation = useCallback(async (id: string) => {
    if (!user) return;
    await supabase
      .from("user_adaptation_log")
      .update({ applied: true, applied_at: new Date().toISOString() } as any)
      .eq("id", id)
      .eq("user_id", user.id);
    await load();
  }, [user, load]);

  const pendingCount = adaptations.filter(a => !a.applied).length;

  return { adaptations, loading, logAdaptation, applyAdaptation, pendingCount, reload: load };
}
