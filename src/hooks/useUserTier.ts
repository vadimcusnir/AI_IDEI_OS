import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

export type UserTier = "free" | "authenticated" | "pro" | "vip";

/**
 * Derives the user's effective access tier from auth + subscription state.
 * Hierarchy: free < authenticated < pro < vip
 */
export function useUserTier(): { tier: UserTier; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, tier: subTier, loading: subLoading } = useSubscription();

  const tier = useMemo<UserTier>(() => {
    if (!user) return "free";
    if (subscribed && subTier) return "pro"; // both pro_monthly and pro_yearly map to "pro"
    return "authenticated";
  }, [user, subscribed, subTier]);

  return { tier, loading: authLoading || subLoading };
}
