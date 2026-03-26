/**
 * GrowthHooks — Invisible component that activates all growth & conversion hooks.
 * Placed inside BrowserRouter + AuthProvider for access to routing and auth context.
 */

import { useReferralCapture, useReferralAttribution } from "@/hooks/useReferralTracking";
import { useStreakRecovery } from "@/hooks/useStreakRecovery";

export function GrowthHooks() {
  useReferralCapture();
  useReferralAttribution();
  useStreakRecovery();
  return null;
}
