/**
 * useOnboardingState — Single source of truth for onboarding flags.
 * Reads/writes to onboarding_progress table (replaces localStorage).
 */
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingFlags {
  welcome_seen: boolean;
  checklist_dismissed: boolean;
  checklist_completed: boolean;
  tutorial_skipped: boolean;
  tutorial_completed: boolean;
}

const DEFAULTS: OnboardingFlags = {
  welcome_seen: false,
  checklist_dismissed: false,
  checklist_completed: false,
  tutorial_skipped: false,
  tutorial_completed: false,
};

export function useOnboardingState() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<OnboardingFlags>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFlags(DEFAULTS);
      setLoading(false);
      return;
    }

    // Reset loading to true when user changes (prevents stale DEFAULTS leaking)
    setLoading(true);

    let cancelled = false;
    // Watchdog: dacă DB nu răspunde în 5s, deblochează UI cu DEFAULTS
    const watchdog = setTimeout(() => {
      if (!cancelled) {
        console.warn("[onboarding] Watchdog triggered — using defaults after 5s");
        setLoading(false);
      }
    }, 5000);
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("onboarding_progress")
          .select("welcome_seen, checklist_dismissed, checklist_completed, tutorial_skipped, tutorial_completed")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.warn("[onboarding] Failed to load flags:", error.message);
        }
        if (data) {
          setFlags({
            welcome_seen: data.welcome_seen ?? false,
            checklist_dismissed: data.checklist_dismissed ?? false,
            checklist_completed: data.checklist_completed ?? false,
            tutorial_skipped: data.tutorial_skipped ?? false,
            tutorial_completed: data.tutorial_completed ?? false,
          });
        } else {
          // Self-heal: trigger-ul DB a eșuat → creează rândul lipsă
          await supabase
            .from("onboarding_progress")
            .upsert({ user_id: user.id } as any, { onConflict: "user_id" });
        }
      } catch (e) {
        if (!cancelled) console.warn("[onboarding] Unexpected error:", e);
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(watchdog);
      }
    };
    load();
    return () => { cancelled = true; clearTimeout(watchdog); };
  }, [user]);

  const updateFlag = useCallback(async (key: keyof OnboardingFlags, value: boolean) => {
    if (!user) return;
    setFlags(prev => ({ ...prev, [key]: value }));
    await supabase
      .from("onboarding_progress")
      .upsert({ user_id: user.id, [key]: value } as any, { onConflict: "user_id" });
  }, [user]);

  return { flags, loading, updateFlag };
}
