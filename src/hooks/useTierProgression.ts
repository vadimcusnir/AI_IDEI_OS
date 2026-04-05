/**
 * useTierProgression — Shows current level, next level requirements, and progress.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { EntitlementLevel } from "./useEntitlements";

export interface TierProgressionData {
  currentLevel: EntitlementLevel;
  nextLevel: EntitlementLevel;
  canAdvance: boolean;
  requirements: Record<string, string | number>;
  met: Record<string, boolean>;
  loading: boolean;
}

export function useTierProgression(): TierProgressionData & { refresh: () => Promise<void> } {
  const { user } = useAuth();
  const [state, setState] = useState<TierProgressionData>({
    currentLevel: "L1",
    nextLevel: "L2",
    canAdvance: false,
    requirements: {},
    met: {},
    loading: true,
  });

  const load = useCallback(async () => {
    if (!user) { setState(s => ({ ...s, loading: false })); return; }
    try {
      const { data, error } = await supabase.rpc("evaluate_tier_progression" as any, { _user_id: user.id });
      if (error) throw error;
      const d = data as any;
      setState({
        currentLevel: d?.current_level || "L1",
        nextLevel: d?.next_level || "L2",
        canAdvance: d?.can_advance || false,
        requirements: d?.requirements || {},
        met: d?.met || {},
        loading: false,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}
