import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface TokenBalance {
  balance: number;
  staked: number;
  totalEarned: number;
  accessTier: string;
  tierExpiresAt: string | null;
}

export function useTokenBalance() {
  const { user } = useAuth();
  const [token, setToken] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("token_balances")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setToken({
        balance: data.balance,
        staked: data.staked,
        totalEarned: data.total_earned,
        accessTier: data.access_tier,
        tierExpiresAt: data.tier_expires_at,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { token, loading, refresh: load };
}
