/**
 * useEconomicGate — Extracted economic gate state management.
 * Handles quick-exec threshold, gate visibility, and tier-based thresholds.
 */
import { useState, useCallback, useMemo } from "react";
import { useUserTier } from "@/hooks/useUserTier";
import { useCreditBalance } from "@/hooks/useCreditBalance";

/** Quick-exec thresholds per tier — plans under this cost skip EconomicGate */
const QUICK_EXEC_THRESHOLDS: Record<string, number> = {
  free: 0,
  authenticated: 25,
  pro: 100,
  vip: 200,
};

/** Estimated execution time by service complexity */
export const EXECUTION_TIME_ESTIMATES: Record<string, { label: string; seconds: number }> = {
  quick: { label: "~5s", seconds: 5 },
  standard: { label: "~15s", seconds: 15 },
  deep: { label: "~30s", seconds: 30 },
  pipeline: { label: "~60s", seconds: 60 },
};

export function getTimeEstimate(credits: number): { label: string; seconds: number } {
  if (credits <= 50) return EXECUTION_TIME_ESTIMATES.quick;
  if (credits <= 200) return EXECUTION_TIME_ESTIMATES.standard;
  if (credits <= 500) return EXECUTION_TIME_ESTIMATES.deep;
  return EXECUTION_TIME_ESTIMATES.pipeline;
}

export function useEconomicGate() {
  const { tier } = useUserTier();
  const { balance } = useCreditBalance();
  const [showGate, setShowGate] = useState(false);

  const quickExecThreshold = useMemo(() => {
    return QUICK_EXEC_THRESHOLDS[tier] ?? 50;
  }, [tier]);

  const tierDiscount = useMemo(() => {
    if (tier === "pro") return 25;
    if (tier === "vip") return 40;
    if (tier === "authenticated") return 10;
    return 0;
  }, [tier]);

  const shouldSkipGate = useCallback((estimatedCredits: number) => {
    return estimatedCredits <= quickExecThreshold;
  }, [quickExecThreshold]);

  const canAfford = useCallback((estimatedCredits: number) => {
    const discounted = Math.round(estimatedCredits * (1 - tierDiscount / 100));
    return balance >= discounted;
  }, [balance, tierDiscount]);

  return {
    showGate,
    setShowGate,
    quickExecThreshold,
    tierDiscount,
    shouldSkipGate,
    canAfford,
    balance,
    tier,
  };
}
