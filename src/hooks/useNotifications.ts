import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  meta: Record<string, any> | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from DB
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data as unknown as AppNotification[]);
    }
    setLoading(false);
  }, [user]);

  // Show browser desktop notification
  const showBrowserNotification = useCallback((notif: AppNotification) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      const n = new Notification(notif.title, {
        body: notif.message,
        icon: "/favicon.png",
        tag: notif.id,
        silent: false,
      });
      n.onclick = () => {
        window.focus();
        if (notif.link) window.location.href = notif.link;
        n.close();
      };
      // Auto-close after 8 seconds
      setTimeout(() => n.close(), 8000);
    } catch {
      // Notification API not available in this context
    }
  }, []);

  // Show sonner toast for real-time notifications
  const showToast = useCallback((notif: AppNotification) => {
    const isError = notif.type === "job_failed" || notif.type === "credits_low";
    const isSuccess = notif.type === "job_completed" || notif.type === "artifact_created" || notif.type === "level_up";

    if (isError) {
      toast.error(notif.title, { description: notif.message, duration: 5000 });
    } else if (isSuccess) {
      toast.success(notif.title, { description: notif.message, duration: 4000 });
    } else {
      toast(notif.title, { description: notif.message, duration: 4000 });
    }
  }, []);

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    fetchNotifications();

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as unknown as AppNotification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
          // Show browser notification
          showBrowserNotification(newNotif);
          // Show in-app toast
          showToast(newNotif);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, showBrowserNotification]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase
      .from("notifications")
      .update({ read: true } as { read: boolean })
      .eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true } as { read: boolean })
      .eq("user_id", user.id)
      .eq("read", false);
  }, [user]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    setNotifications([]);
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);
  }, [user]);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied";
    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const permissionStatus = typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "denied";

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
    loading,
    refetch: fetchNotifications,
    requestPermission,
    permissionStatus,
  };
}
