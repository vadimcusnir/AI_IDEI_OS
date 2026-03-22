/**
 * useCusnirOS — Checks eligibility and manages Cusnir_OS access.
 * Requirements: 11 months VIP + holds NOTA2 tokens.
 * If tokens drop below threshold: access removed, must wait 11 months or pay 2x.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CusnirOSState {
  eligible: boolean;
  reason: string | null;
  currentMonth: number;
  tokenBalance: number;
  loading: boolean;
  checking: boolean;
}

export function useCusnirOS() {
  const { user } = useAuth();
  const [state, setState] = useState<CusnirOSState>({
    eligible: false,
    reason: null,
    currentMonth: 0,
    tokenBalance: 0,
    loading: true,
    checking: false,
  });

  const checkEligibility = useCallback(async () => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    setState(s => ({ ...s, checking: true }));

    try {
      // First advance VIP month if needed
      await supabase.rpc("vip_advance_month", { _user_id: user.id });

      // Then check Cusnir_OS eligibility
      const { data, error } = await supabase.rpc("check_cusnir_os_eligibility", {
        _user_id: user.id,
      });

      if (error) throw error;

      const result = data as any;
      setState({
        eligible: result?.eligible ?? false,
        reason: result?.reason ?? null,
        currentMonth: result?.current_month ?? 0,
        tokenBalance: result?.token_balance ?? 0,
        loading: false,
        checking: false,
      });
    } catch {
      setState(s => ({ ...s, loading: false, checking: false }));
    }
  }, [user]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  return { ...state, recheck: checkEligibility };
}
