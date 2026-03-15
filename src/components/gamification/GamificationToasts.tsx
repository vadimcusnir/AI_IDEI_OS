import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Listens for level-up and achievement notifications in real-time
 * and shows celebration toasts.
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
            toast.success(n.title, {
              description: n.message,
              duration: 6000,
              icon: "🎉",
            });
          } else if (n.type === "achievement_unlocked") {
            toast.success(n.title, {
              description: n.message,
              duration: 5000,
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
