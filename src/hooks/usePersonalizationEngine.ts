/**
 * usePersonalizationEngine — manages user defaults, predicted needs, and smart presets.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PersonalizationPref {
  id: string;
  pref_key: string;
  pref_value: any;
  source: "manual" | "inferred" | "learned";
  confidence: number;
  updated_at: string;
}

const DEFAULT_PREFS: Record<string, any> = {
  preferred_language: "ro",
  default_output_format: "markdown",
  complexity_level: "standard",
  auto_extract_on_upload: true,
  show_cost_before_execute: true,
  preferred_ai_model: "balanced",
  dashboard_layout: "compact",
};

export function usePersonalizationEngine() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<PersonalizationPref[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("user_personalization")
      .select("*")
      .eq("user_id", user.id);

    setPrefs((data as unknown as PersonalizationPref[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /** Get a preference value with fallback to default */
  const getPref = useCallback(<T = any>(key: string, fallback?: T): T => {
    const found = prefs.find(p => p.pref_key === key);
    if (found) return found.pref_value as T;
    if (key in DEFAULT_PREFS) return DEFAULT_PREFS[key] as T;
    return fallback as T;
  }, [prefs]);

  /** Set a preference (upsert) */
  const setPref = useCallback(async (key: string, value: any, source: "manual" | "inferred" | "learned" = "manual") => {
    if (!user) return;
    await supabase.from("user_personalization").upsert({
      user_id: user.id,
      pref_key: key,
      pref_value: value,
      source,
      confidence: source === "manual" ? 1.0 : 0.7,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "user_id,pref_key" });
    await load();
  }, [user, load]);

  /** Remove a preference */
  const removePref = useCallback(async (key: string) => {
    if (!user) return;
    await supabase
      .from("user_personalization")
      .delete()
      .eq("user_id", user.id)
      .eq("pref_key", key);
    setPrefs(prev => prev.filter(p => p.pref_key !== key));
  }, [user]);

  /** Get all prefs as a flat object */
  const prefsMap = prefs.reduce((acc, p) => {
    acc[p.pref_key] = p.pref_value;
    return acc;
  }, { ...DEFAULT_PREFS } as Record<string, any>);

  return { prefs, prefsMap, loading, getPref, setPref, removePref, reload: load };
}
