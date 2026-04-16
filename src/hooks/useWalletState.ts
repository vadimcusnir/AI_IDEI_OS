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

    // Read from user_credits (canonical balance source) + wallet_state (staked/locked metadata) + access_window
    const [creditsRes, walletRes, accessRes] = await Promise.all([
      supabase.from("user_credits").select("balance, updated_at").eq("user_id", user.id).maybeSingle(),
      supabase.from("wallet_state").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("access_window_state").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    if (creditsRes.error && walletRes.error) {
      setError(creditsRes.error.message || walletRes.error?.message || "Failed to load wallet");
    } else {
      const credits = creditsRes.data as { balance?: number; updated_at?: string } | null;
      const w = walletRes.data as { available?: number; staked?: number; locked?: number; snapshot_ts?: string; chain_metadata?: Record<string, unknown> } | null;

      // Use user_credits.balance as the canonical "available" amount
      // Fall back to wallet_state.available if user_credits doesn't exist
      const available = credits?.balance ?? (w ? Number(w.available) : 0);
      const snapshotTs = credits?.updated_at || w?.snapshot_ts || new Date().toISOString();

      setWallet({
        available,
        staked: w ? Number(w.staked) : 0,
        locked: w ? Number(w.locked) : 0,
        snapshotTs,
        snapshotAgeSec: (Date.now() - new Date(snapshotTs).getTime()) / 1000,
        chainMetadata: w?.chain_metadata || {},
      });
    }

    if (accessRes.data) {
      const a = accessRes.data as { window_status: string; entitlement_lock: boolean; policy_version: string; tier: string; last_verified_at: string };
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

  // Subscribe to realtime changes on user_credits
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("wallet-credits-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}` },
        () => { load(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const isFresh = wallet ? wallet.snapshotAgeSec < 60 : false;

  return { wallet, access, loading, error, isFresh, refresh: load };
}