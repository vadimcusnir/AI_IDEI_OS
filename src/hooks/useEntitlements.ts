/**
 * useEntitlements — Unified access matrix hook.
 * Computes and returns real entitlements from backend via compute_entitlements RPC.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type EntitlementLevel = "L1" | "L2" | "L3" | "L4";

export interface EntitlementFlags {
  can_publish: boolean;
  can_automate: boolean;
  can_orchestrate: boolean;
  marketplace_access: boolean;
  priority_queue: boolean;
  multi_agent: boolean;
  [key: string]: unknown;
}

export interface Entitlements {
  level: EntitlementLevel;
  nota2: number;
  tenure: number;
  burned: number;
  cusnirOs: boolean;
  vipMonth: number;
  subscriptionTier: string;
  isAdmin: boolean;
  flags: EntitlementFlags;
  loading: boolean;
}

const DEFAULT_FLAGS: EntitlementFlags = {
  can_publish: false,
  can_automate: false,
  can_orchestrate: false,
  marketplace_access: false,
  priority_queue: false,
  multi_agent: false,
};

export function useEntitlements(): Entitlements & { recompute: () => Promise<void> } {
  const { user } = useAuth();
  const [state, setState] = useState<Entitlements>({
    level: "L1", nota2: 0, tenure: 0, burned: 0,
    cusnirOs: false, vipMonth: 0, subscriptionTier: "none",
    isAdmin: false, flags: DEFAULT_FLAGS, loading: true,
  });

  const compute = useCallback(async () => {
    if (!user) { setState(s => ({ ...s, loading: false })); return; }
    try {
      const { data, error } = await supabase.rpc("compute_entitlements" as any, { _user_id: user.id });
      if (error) throw error;
      const d = data as any;
      setState({
        level: d?.level || "L1",
        nota2: d?.nota2 || 0,
        tenure: d?.tenure || 0,
        burned: d?.burned || 0,
        cusnirOs: d?.cusnir_os || false,
        vipMonth: d?.vip_month || 0,
        subscriptionTier: d?.subscription_tier || "none",
        isAdmin: d?.is_admin || false,
        flags: { ...DEFAULT_FLAGS, ...(d?.flags || {}) },
        loading: false,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => { compute(); }, [compute]);

  return { ...state, recompute: compute };
}
