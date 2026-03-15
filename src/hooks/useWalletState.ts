import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface WalletState {
  available: number;
  staked: number;
  locked: number;
  snapshotTs: string;
  snapshotAgeSec: number;
  chainMetadata: Record<string, unknown>;
}

export interface AccessWindow {
  windowStatus: "open" | "restricted" | "locked" | "suspended";
  entitlementLock: boolean;
  policyVersion: string;
  tier: "free" | "starter" | "pro" | "business" | "vip";
  lastVerifiedAt: string;
}

export interface WalletData {
  wallet: WalletState | null;
  access: AccessWindow | null;
  loading: boolean;
  error: string | null;
  isFresh: boolean;
  refresh: () => Promise<void>;
}

export function useWalletState(): WalletData {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [access, setAccess] = useState<AccessWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const [walletRes, accessRes] = await Promise.all([
      supabase.from("wallet_state").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("access_window_state").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    if (walletRes.error) {
      setError(walletRes.error.message);
    } else if (walletRes.data) {
      const w = walletRes.data as any;
      setWallet({
        available: Number(w.available),
        staked: Number(w.staked),
        locked: Number(w.locked),
        snapshotTs: w.snapshot_ts,
        snapshotAgeSec: (Date.now() - new Date(w.snapshot_ts).getTime()) / 1000,
        chainMetadata: w.chain_metadata || {},
      });
    }

    if (accessRes.data) {
      const a = accessRes.data as any;
      setAccess({
        windowStatus: a.window_status,
        entitlementLock: a.entitlement_lock,
        policyVersion: a.policy_version,
        tier: a.tier,
        lastVerifiedAt: a.last_verified_at,
      });
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const isFresh = wallet ? wallet.snapshotAgeSec < 60 : false;

  return { wallet, access, loading, error, isFresh, refresh: load };
}
