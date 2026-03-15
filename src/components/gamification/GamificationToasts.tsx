import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

function fireConfetti() {
  const end = Date.now() + 1500;
  const colors = ["#f59e0b", "#8b5cf6", "#10b981", "#3b82f6"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/**
 * Listens for level-up and achievement notifications in real-time
 * and shows celebration toasts with confetti.
 */
export function GamificationToasts() {
  const { user } = useAuth();
  const subscribed = useRef(false);

  useEffect(() => {
    if (!user || subscribed.current) return;
    subscribed.current = true;

    const channel = supabase
      .channel("gamification-toasts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          if (!n) return;

          if (n.type === "level_up") {
            fireConfetti();
            toast.success(n.title, {
              description: n.message,
              duration: 8000,
              icon: "🎉",
            });
          } else if (n.type === "achievement_unlocked") {
            toast.success(n.title, {
              description: n.message,
              duration: 6000,
              icon: "🏆",
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscribed.current = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
