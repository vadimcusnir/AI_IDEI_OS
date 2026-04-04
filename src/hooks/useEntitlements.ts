/**
 * useEntitlements — Unified access matrix hook.
 * Computes and returns real entitlements from backend (not UI flags).
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Entitlements {
  level: "L1" | "L2" | "L3" | "L4";
  nota2: number;
  tenure: number;
  burned: number;
  cusnirOs: boolean;
  flags: Record<string, unknown>;
  loading: boolean;
}

export function useEntitlements(): Entitlements & { recompute: () => Promise<void> } {
  const { user } = useAuth();
  const [state, setState] = useState<Entitlements>({
    level: "L1", nota2: 0, tenure: 0, burned: 0,
    cusnirOs: false, flags: {}, loading: true,
  });

  const compute = useCallback(async () => {
    if (!user) { setState(s => ({ ...s, loading: false })); return; }
    try {
      const { data, error } = await supabase.rpc("compute_entitlements", { _user_id: user.id });
      if (error) throw error;
      const d = data as any;
      setState({
        level: d?.level || "L1",
        nota2: d?.nota2 || 0,
        tenure: d?.tenure || 0,
        burned: d?.burned || 0,
        cusnirOs: d?.cusnir_os || false,
        flags: d?.flags || {},
        loading: false,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => { compute(); }, [compute]);

  return { ...state, recompute: compute };
}
