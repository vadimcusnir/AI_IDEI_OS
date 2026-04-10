/**
 * useLockinScore — Computes and tracks the Inevitability/Lock-in Score.
 * Measures user's dependency on the platform across 6 vectors.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LockinVector {
  neurons_burned: number;
  asset_count: number;
  months_active: number;
  total_executions: number;
  active_agents: number;
  services_used: number;
}

interface LockinResult {
  score: number;
  level: "minimal" | "low" | "medium" | "high" | "critical";
  vectors: LockinVector;
}

export function useLockinScore() {
  const { user } = useAuth();
  const [result, setResult] = useState<LockinResult | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("compute_lockin_score", { _user_id: user.id });
      if (error) throw error;
      setResult(data as unknown as LockinResult);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { result, loading, compute };
}
