/**
 * Realtime Behavior Control Engine
 * Classifies users, detects intent, triggers actions.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useGamification } from "@/hooks/useGamification";
import { useUserTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";

// ─── User Segments ───
export type UserSegment =
  | "explorer"      // first session, no actions
  | "evaluator"     // browsing, no purchase
  | "consumer"      // active service user
  | "power_user"    // high consumption
  | "dormant"       // inactive 7+ days
  | "churn_risk";   // declining activity

// ─── Intent Types ───
export type IntentType =
  | "curiosity"
  | "evaluation"
  | "purchase_intent"
  | "friction"
  | "confusion";

// ─── Trigger Types ───
export type BehaviorTrigger =
  | "low_balance"
  | "high_engagement"
  | "service_completion"
  | "near_daily_cap"
  | "first_value"
  | "streak_break"
  | "upgrade_opportunity";

// ─── UI Action ───
export interface UIAction {
  type: "banner" | "modal" | "toast" | "inline" | "cta";
  component: string;
  priority: "critical" | "high" | "medium" | "low";
  data?: Record<string, unknown>;
}

// ─── Session State ───
interface SessionState {
  pageViews: number;
  actionsCount: number;
  timeOnSite: number; // seconds
  pagesVisited: string[];
  startedAt: number;
}

interface BehaviorState {
  segment: UserSegment;
  intent: IntentType;
  activeTriggers: BehaviorTrigger[];
  suggestedActions: UIAction[];
  sessionState: SessionState;
  revenueScore: number; // 0-100
}

const SESSION_KEY = "ai_idei_session_state";

function loadSessionState(): SessionState {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {
    pageViews: 0,
    actionsCount: 0,
    timeOnSite: 0,
    pagesVisited: [],
    startedAt: Date.now(),
  };
}

function saveSessionState(state: SessionState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function useUserBehavior(): BehaviorState {
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const { streak, xp } = useGamification();
  const { tier } = useUserTier();

  const [session, setSession] = useState<SessionState>(loadSessionState);
  const [usageToday, setUsageToday] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Track time on site
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSession(prev => {
        const updated = { ...prev, timeOnSite: Math.floor((Date.now() - prev.startedAt) / 1000) };
        saveSessionState(updated);
        return updated;
      });
    }, 10_000); // every 10s
    return () => clearInterval(timerRef.current);
  }, []);

  // Track page views
  useEffect(() => {
    const path = window.location.pathname;
    setSession(prev => {
      const updated = {
        ...prev,
        pageViews: prev.pageViews + 1,
        pagesVisited: [...new Set([...prev.pagesVisited, path])],
      };
      saveSessionState(updated);
      return updated;
    });
  }, []);

  // Load usage data
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);

    Promise.all([
      supabase
        .from("credit_transactions")
        .select("amount", { count: "exact" })
        .eq("user_id", user.id)
        .eq("type", "spend")
        .gte("created_at", `${today}T00:00:00Z`),
      supabase
        .from("neuron_jobs")
        .select("id", { count: "exact" })
        .eq("user_id", user.id),
      supabase
        .from("analytics_events")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]).then(([txRes, jobsRes, lastRes]) => {
      if (txRes.data) {
        setUsageToday(txRes.data.reduce((sum, t) => sum + Math.abs(Number((t as any).amount) || 0), 0));
      }
      setTotalServices(jobsRes.count ?? 0);
      if (lastRes.data?.[0]) {
        setLastActiveDate((lastRes.data[0] as any).created_at);
      }
    });
  }, [user]);

  // ─── LAYER 1: User Classification ───
  const segment = useMemo<UserSegment>(() => {
    if (!user) return "explorer";

    // Check dormancy
    if (lastActiveDate) {
      const daysSince = Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / 86400000);
      if (daysSince > 14) return "dormant";
      if (daysSince > 7 && totalServices > 0) return "churn_risk";
    }

    if (totalServices === 0 && session.pageViews <= 3) return "explorer";
    if (totalServices === 0) return "evaluator";
    if (usageToday > 3000 || totalServices > 20) return "power_user";
    return "consumer";
  }, [user, totalServices, usageToday, session.pageViews, lastActiveDate]);

  // ─── LAYER 2: Intent Detection ───
  const intent = useMemo<IntentType>(() => {
    const visitedPricing = session.pagesVisited.includes("/credits") || session.pagesVisited.includes("/pricing");
    const visitedServices = session.pagesVisited.some(p => p.startsWith("/run/") || p === "/services");

    if (visitedPricing) return "purchase_intent";
    if (session.timeOnSite > 120 && session.pageViews > 5) return "evaluation";
    if (session.actionsCount === 0 && session.timeOnSite > 60) return "confusion";
    if (session.pageViews <= 2) return "curiosity";
    return "evaluation";
  }, [session]);

  // ─── LAYER 3: Active Triggers ───
  const activeTriggers = useMemo<BehaviorTrigger[]>(() => {
    const triggers: BehaviorTrigger[] = [];

    if (balance < 200 && user) triggers.push("low_balance");
    if (session.timeOnSite > 45 && tier === "authenticated") triggers.push("high_engagement");
    if (usageToday > 4000) triggers.push("near_daily_cap");
    if (totalServices === 1) triggers.push("first_value");
    if (streak.current_streak === 0 && streak.longest_streak > 3) triggers.push("streak_break");
    if (segment === "consumer" && tier === "authenticated" && totalServices > 5) triggers.push("upgrade_opportunity");

    return triggers;
  }, [balance, user, session.timeOnSite, tier, usageToday, totalServices, streak, segment]);

  // ─── LAYER 4: Suggested UI Actions ───
  const suggestedActions = useMemo<UIAction[]>(() => {
    const actions: UIAction[] = [];

    // Segment-based actions
    if (segment === "explorer") {
      actions.push({ type: "inline", component: "InstantDemo", priority: "critical" });
      actions.push({ type: "cta", component: "SignupCTA", priority: "high" });
    }
    if (segment === "evaluator") {
      actions.push({ type: "banner", component: "BonusNeurons", priority: "high", data: { bonus: 500 } });
      actions.push({ type: "inline", component: "PartialPaywall", priority: "high" });
    }
    if (segment === "consumer") {
      actions.push({ type: "inline", component: "NextServiceRec", priority: "medium" });
      actions.push({ type: "cta", component: "BatchOffer", priority: "medium" });
    }
    if (segment === "power_user") {
      actions.push({ type: "modal", component: "UpgradeCTA", priority: "high" });
      actions.push({ type: "inline", component: "SpeedTier", priority: "medium" });
    }
    if (segment === "churn_risk" || segment === "dormant") {
      actions.push({ type: "banner", component: "StreakRecovery", priority: "critical" });
      actions.push({ type: "toast", component: "LimitedOffer", priority: "high" });
    }

    // Trigger-based actions
    if (activeTriggers.includes("low_balance")) {
      actions.push({ type: "banner", component: "PersistentTopup", priority: "critical" });
    }
    if (activeTriggers.includes("upgrade_opportunity")) {
      actions.push({ type: "modal", component: "UpgradeModal", priority: "high" });
    }

    return actions;
  }, [segment, activeTriggers]);

  // ─── LAYER 5: Revenue Opportunity Score ───
  const revenueScore = useMemo(() => {
    let score = 0;
    if (intent === "purchase_intent") score += 40;
    if (intent === "evaluation") score += 20;
    if (segment === "consumer") score += 20;
    if (segment === "power_user") score += 30;
    if (activeTriggers.includes("low_balance")) score += 15;
    if (activeTriggers.includes("upgrade_opportunity")) score += 25;
    if (session.timeOnSite > 120) score += 10;
    return Math.min(100, score);
  }, [intent, segment, activeTriggers, session.timeOnSite]);

  // Public method to record actions
  const recordAction = useCallback(() => {
    setSession(prev => {
      const updated = { ...prev, actionsCount: prev.actionsCount + 1 };
      saveSessionState(updated);
      return updated;
    });
  }, []);

  return {
    segment,
    intent,
    activeTriggers,
    suggestedActions,
    sessionState: session,
    revenueScore,
  };
}
