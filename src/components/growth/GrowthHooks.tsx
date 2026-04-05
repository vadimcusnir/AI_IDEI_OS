/**
 * GrowthHooks — Invisible component that activates all growth & conversion hooks.
 * Placed inside BrowserRouter + AuthProvider for access to routing and auth context.
 */

import { useReferralCapture, useReferralAttribution } from "@/hooks/useReferralTracking";
import { useStreakRecovery } from "@/hooks/useStreakRecovery";
import { useRecordActivity } from "@/hooks/useRecordActivity";
import { useAuth } from "@/contexts/AuthContext";

function GrowthHooksInner() {
  useReferralCapture();
  useReferralAttribution();
  useStreakRecovery();
  useRecordActivity();
  return null;
}

export function GrowthHooks() {
  // Only mount hooks after auth context is stable
  const { loading } = useAuth();
  if (loading) return null;
  return <GrowthHooksInner />;
}
