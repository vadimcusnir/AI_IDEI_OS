import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationPrefs {
  push_enabled: boolean;
  push_jobs: boolean;
  push_credits: boolean;
  push_feedback: boolean;
  push_versions: boolean;
  email_digest: "realtime" | "daily" | "weekly" | "none";
  email_jobs: boolean;
  email_credits: boolean;
  email_feedback: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
}

const DEFAULT_PREFS: NotificationPrefs = {
  push_enabled: false,
  push_jobs: true,
  push_credits: true,
  push_feedback: true,
  push_versions: false,
  email_digest: "none",
  email_jobs: false,
  email_credits: false,
  email_feedback: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPrefs();
  }, [user]);

  const loadPrefs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setPrefs({
        push_enabled: (data as any).push_enabled,
        push_jobs: (data as any).push_jobs,
        push_credits: (data as any).push_credits,
        push_feedback: (data as any).push_feedback,
        push_versions: (data as any).push_versions,
        email_digest: (data as any).email_digest,
        email_jobs: (data as any).email_jobs,
        email_credits: (data as any).email_credits,
        email_feedback: (data as any).email_feedback,
        quiet_hours_start: (data as any).quiet_hours_start,
        quiet_hours_end: (data as any).quiet_hours_end,
      });
    } else {
      // Create default prefs
      await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id } as any);
    }
    setLoading(false);
  };

  const updatePrefs = useCallback(
    async (updates: Partial<NotificationPrefs>) => {
      if (!user) return;
      setSaving(true);
      const newPrefs = { ...prefs, ...updates };
      setPrefs(newPrefs);

      await supabase
        .from("notification_preferences")
        .update(updates as any)
        .eq("user_id", user.id);

      setSaving(false);
    },
    [user, prefs]
  );

  return { prefs, loading, saving, updatePrefs };
}
