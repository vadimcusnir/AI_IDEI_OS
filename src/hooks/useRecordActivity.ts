/**
 * useRecordActivity — Records daily activity to maintain streaks.
 * Called once per session on meaningful actions (login, service run, neuron create).
 * Idempotent: the RPC returns early if already recorded today.
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useRecordActivity() {
  const { user } = useAuth();
  const recorded = useRef(false);

  useEffect(() => {
    if (!user || recorded.current) return;
    recorded.current = true;

    const record = async () => {
      try {
        await supabase.rpc("record_daily_activity" as any, { _user_id: user.id });
      } catch {
        // Silently fail — streak is non-critical
      }
    };

    // Delay to avoid blocking initial render
    const timer = setTimeout(record, 2000);
    return () => clearTimeout(timer);
  }, [user?.id]);
}
