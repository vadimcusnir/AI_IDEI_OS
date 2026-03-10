import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useCreditBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      setBalance(data?.balance ?? 0);
      setLoading(false);
    };

    fetch();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("credit-balance")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new?.balance !== undefined) {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { balance, loading };
}
