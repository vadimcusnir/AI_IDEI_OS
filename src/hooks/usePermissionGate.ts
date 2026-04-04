/**
 * usePermissionGate — Extracted permission checking logic.
 */
import { useState, useCallback } from "react";
import { useUserTier, type UserTier } from "@/hooks/useUserTier";
import type { RouteResult } from "@/components/command-center/CommandRouter";

const TIER_ORDER: Record<UserTier, number> = {
  free: 0,
  authenticated: 1,
  pro: 2,
  vip: 3,
};

export function usePermissionGate() {
  const { tier } = useUserTier();
  const [permissionBlock, setPermissionBlock] = useState<RouteResult | null>(null);

  const checkPermission = useCallback((route: RouteResult): boolean => {
    const userLevel = TIER_ORDER[tier] ?? 0;
    const requiredLevel = TIER_ORDER[route.intent.requiredTier] ?? 0;
    
    if (userLevel < requiredLevel) {
      setPermissionBlock(route);
      return false;
    }
    return true;
  }, [tier]);

  const dismissPermission = useCallback(() => {
    setPermissionBlock(null);
  }, []);

  return {
    tier,
    permissionBlock,
    setPermissionBlock,
    checkPermission,
    dismissPermission,
  };
}
