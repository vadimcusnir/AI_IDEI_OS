/**
 * useStreakRecovery — Detects broken daily streaks and shows win-back prompt.
 * Uses DB streak data (via useGamification) for accurate gap detection.
 * Triggers re-engagement toast when user returns after missing 1-7 days.
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/hooks/useGamification";

const RECOVERY_SHOWN_KEY = "streak_recovery_shown";

export function useStreakRecovery() {
  const { user } = useAuth();
  const { streak, loading } = useGamification();
  const shown = useRef(false);

  useEffect(() => {
    if (!user || loading || shown.current) return;

    const today = new Date().toISOString().slice(0, 10);
    const recoveryShown = localStorage.getItem(`${RECOVERY_SHOWN_KEY}_${user.id}`);

    // Already shown today
    if (recoveryShown === today) return;

    const lastActive = streak.last_active_date;
    if (!lastActive) return;

    const daysDiff = Math.floor(
      (new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Show recovery prompt for 2-7 day gaps
    if (daysDiff >= 2 && daysDiff <= 7) {
      shown.current = true;
      localStorage.setItem(`${RECOVERY_SHOWN_KEY}_${user.id}`, today);

      const hadStreak = streak.longest_streak > 3;
      const hasFreezeToken = streak.freeze_tokens > 0;

      setTimeout(() => {
        if (daysDiff === 2 && hasFreezeToken) {
          toast("❄️ Streak salvat cu Freeze Token!", {
            description: `Ai folosit 1 freeze token. Streak-ul tău de ${streak.current_streak} zile continuă!`,
            duration: 6000,
          });
        } else if (daysDiff === 2) {
          toast("🔥 Aproape ai pierdut streak-ul!", {
            description: "Ai ratat o zi — rulează ceva rapid ca să rămâi în ritm.",
            action: {
              label: "Acționează",
              onClick: () => window.location.assign("/services"),
            },
            duration: 8000,
          });
        } else if (hadStreak) {
          toast("💪 Revino în formă!", {
            description: `Ai fost absent ${daysDiff} zile. Cel mai bun streak: ${streak.longest_streak}d. Începe din nou!`,
            action: {
              label: "Recuperează",
              onClick: () => window.location.assign("/services"),
            },
            duration: 10000,
          });
        } else {
          toast("👋 Bine ai revenit!", {
            description: "Ai conținut neprocesat? Rulează o analiză rapidă.",
            action: {
              label: "Analizează",
              onClick: () => window.location.assign("/services"),
            },
            duration: 8000,
          });
        }
      }, 3000);
    }
  }, [user?.id, loading, streak]);
}
