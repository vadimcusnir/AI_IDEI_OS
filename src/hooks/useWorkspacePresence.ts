import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PresenceUser {
  userId: string;
  email?: string;
  lastSeen: string;
  page?: string;
}

/**
 * P3-006: Real-time Presence
 * Tracks online users in a workspace using Supabase Realtime Presence.
 */
export function useWorkspacePresence(workspaceId?: string) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  const updatePresence = useCallback(() => {
    if (!user || !workspaceId) return;

    const channel = supabase.channel(`presence:${workspaceId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        for (const [, presences] of Object.entries(state)) {
          for (const p of presences as any[]) {
            users.push({
              userId: p.userId || p.user_id || "",
              email: p.email,
              lastSeen: p.online_at || new Date().toISOString(),
              page: p.page,
            });
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: user.id,
            email: user.email,
            online_at: new Date().toISOString(),
            page: window.location.pathname,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, workspaceId]);

  useEffect(() => {
    const cleanup = updatePresence();
    return () => cleanup?.();
  }, [updatePresence]);

  return { onlineUsers, count: onlineUsers.length };
}
