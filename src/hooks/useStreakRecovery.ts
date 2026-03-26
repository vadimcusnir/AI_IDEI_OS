/**
 * useStreakRecovery — Detects broken daily streaks and shows win-back prompt.
 * Triggers re-engagement toast when user returns after missing 1-3 days.
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const LAST_VISIT_KEY = "last_active_date";
const RECOVERY_SHOWN_KEY = "streak_recovery_shown";

export function useStreakRecovery() {
  const { user } = useAuth();
  const shown = useRef(false);

  useEffect(() => {
    if (!user || shown.current) return;

    const today = new Date().toISOString().slice(0, 10);
    const lastVisit = localStorage.getItem(`${LAST_VISIT_KEY}_${user.id}`);
    const recoveryShown = localStorage.getItem(`${RECOVERY_SHOWN_KEY}_${user.id}`);

    if (lastVisit && recoveryShown !== today) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= 2 && daysDiff <= 7) {
        shown.current = true;
        localStorage.setItem(`${RECOVERY_SHOWN_KEY}_${user.id}`, today);

        setTimeout(() => {
          toast("🔥 Streak-ul tău s-a oprit!", {
            description: daysDiff === 2
              ? "Ai ratat o zi — rulează un serviciu rapid ca să-l recuperezi!"
              : `Ai fost absent ${daysDiff} zile. Revino în ritm cu o analiză rapidă!`,
            action: {
              label: "Recuperează",
              onClick: () => window.location.assign("/services"),
            },
            duration: 8000,
          });
        }, 3000);
      }
    }

    localStorage.setItem(`${LAST_VISIT_KEY}_${user.id}`, today);
  }, [user?.id]);
}
