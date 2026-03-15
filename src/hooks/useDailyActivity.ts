import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Calls record_daily_activity once per session on login
 * to track streaks and award daily XP.
 */
export function useDailyActivity() {
  const { user } = useAuth();
  const recorded = useRef(false);

  useEffect(() => {
    if (!user || recorded.current) return;
    recorded.current = true;

    supabase.rpc("record_daily_activity", { _user_id: user.id }).then(({ error }) => {
      if (error) console.warn("Daily activity:", error.message);
    });
  }, [user]);
}
