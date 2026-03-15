import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface XPState {
  total_xp: number;
  level: number;
  rank_name: string;
  daily_xp_earned: number;
}

interface StreakState {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  grace_period_used: boolean;
  freeze_tokens: number;
}

interface GamificationState {
  xp: XPState;
  streak: StreakState;
  loading: boolean;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  levelProgress: number;
}

const DEFAULT_XP: XPState = { total_xp: 0, level: 1, rank_name: "Novice", daily_xp_earned: 0 };
const DEFAULT_STREAK: StreakState = { current_streak: 0, longest_streak: 0, last_active_date: null, grace_period_used: false, freeze_tokens: 1 };

function xpRequiredForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function useGamification(): GamificationState {
  const { user } = useAuth();
  const [xp, setXP] = useState<XPState>(DEFAULT_XP);
  const [streak, setStreak] = useState<StreakState>(DEFAULT_STREAK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      const [xpRes, streakRes] = await Promise.all([
        supabase.from("user_xp").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_streaks").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (xpRes.data) setXP(xpRes.data as unknown as XPState);
      if (streakRes.data) setStreak(streakRes.data as unknown as StreakState);
      setLoading(false);
    };

    load();
  }, [user]);

  const xpForCurrentLevel = xpRequiredForLevel(xp.level);
  const xpForNextLevel = xpRequiredForLevel(xp.level + 1);
  const progressRange = xpForNextLevel - xpForCurrentLevel;
  const levelProgress = progressRange > 0
    ? Math.min(100, Math.round(((xp.total_xp - xpForCurrentLevel) / progressRange) * 100))
    : 0;

  return { xp, streak, loading, xpForCurrentLevel, xpForNextLevel, levelProgress };
}
