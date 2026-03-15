import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VIPSubscription {
  id: string;
  current_month: number;
  is_active: boolean;
  started_at: string;
  completed_at: string | null;
  paused_at: string | null;
}

interface VIPMilestone {
  id: string;
  month_number: number;
  title: string;
  description: string;
  unlock_type: string;
  unlock_key: string;
  icon: string;
  reward_neurons: number;
  unlocked: boolean;
  claimed: boolean;
}

interface VIPState {
  subscription: VIPSubscription | null;
  milestones: VIPMilestone[];
  loading: boolean;
  isVIP: boolean;
  currentMonth: number;
  progress: number; // 0-100
}

export function useVIPTier() {
  const { user } = useAuth();
  const [state, setState] = useState<VIPState>({
    subscription: null,
    milestones: [],
    loading: true,
    isVIP: false,
    currentMonth: 0,
    progress: 0,
  });

  const load = useCallback(async () => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const [subRes, milestonesRes, progressRes] = await Promise.all([
      supabase.from("vip_subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("vip_milestones").select("*").order("position", { ascending: true }),
      supabase.from("vip_milestone_progress").select("milestone_id, claimed_reward").eq("user_id", user.id),
    ]);

    const sub = subRes.data as VIPSubscription | null;
    const allMilestones = (milestonesRes.data || []) as any[];
    const unlockedSet = new Map(
      (progressRes.data || []).map((p: any) => [p.milestone_id, p.claimed_reward])
    );

    const milestones: VIPMilestone[] = allMilestones.map(m => ({
      id: m.id,
      month_number: m.month_number,
      title: m.title,
      description: m.description,
      unlock_type: m.unlock_type,
      unlock_key: m.unlock_key,
      icon: m.icon,
      reward_neurons: m.reward_neurons,
      unlocked: unlockedSet.has(m.id),
      claimed: unlockedSet.get(m.id) ?? false,
    }));

    const currentMonth = sub?.current_month ?? 0;

    setState({
      subscription: sub,
      milestones,
      loading: false,
      isVIP: !!sub?.is_active,
      currentMonth,
      progress: Math.round((currentMonth / 11) * 100),
    });
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const checkAccess = useCallback(async (unlockKey: string): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase.rpc("check_vip_access", {
      _user_id: user.id,
      _unlock_key: unlockKey,
    });
    return !!data;
  }, [user]);

  return { ...state, reload: load, checkAccess };
}
