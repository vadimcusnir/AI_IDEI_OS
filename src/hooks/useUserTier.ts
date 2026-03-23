import { useMemo } from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

export type UserTier = "free" | "authenticated" | "pro" | "vip";

/**
 * Derives the user's effective access tier from auth + subscription + admin role.
 * Admins always get "pro" access regardless of subscription status.
 */
export function useUserTier(): { tier: UserTier; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, tier: subTier, loading: subLoading } = useSubscription();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setAdminLoading(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setAdminLoading(false); });
  }, [user?.id]);

  const tier = useMemo<UserTier>(() => {
    if (!user) return "free";
    if (isAdmin) return "vip"; // Admins get full unrestricted access
    if (subscribed && subTier) return "pro";
    return "authenticated";
  }, [user, isAdmin, subscribed, subTier]);

  return { tier, loading: authLoading || subLoading || adminLoading };
}
