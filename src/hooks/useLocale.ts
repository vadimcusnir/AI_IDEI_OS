/**
 * Enhanced useLocale hook — persists language preference for authenticated users.
 * Priority: explicit choice > saved profile > localStorage > browser detect > EN default.
 */
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { SupportedLanguage } from "@/i18n/config";

const STORAGE_KEY = "i18nextLng";
const MANUAL_CHOICE_KEY = "i18n_manual_choice";

export function useLocale() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const loadedRef = useRef(false);

  const currentLanguage = (i18n.language?.split("-")[0] || "en") as SupportedLanguage;

  // On login — load saved preference from profile
  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;

    const loadPreference = async () => {
      const { data } = await (supabase
        .from("profiles" as any)
        .select("preferred_language")
        .eq("user_id", user.id)
        .maybeSingle() as any);

      if (data?.preferred_language) {
        const saved = data.preferred_language as SupportedLanguage;
        if (["en", "ro", "ru"].includes(saved) && saved !== currentLanguage) {
          i18n.changeLanguage(saved);
          localStorage.setItem(STORAGE_KEY, saved);
          localStorage.setItem(MANUAL_CHOICE_KEY, "true");
        }
      }
    };

    loadPreference();
  }, [user]);

  // Reset ref on logout
  useEffect(() => {
    if (!user) loadedRef.current = false;
  }, [user]);

  const changeLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      // Apply immediately
      i18n.changeLanguage(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      localStorage.setItem(MANUAL_CHOICE_KEY, "true");

      // Persist to profile if authenticated
      if (user) {
        await (supabase
          .from("profiles" as any)
          .update({ preferred_language: lang } as any)
          .eq("user_id", user.id) as any);
      }
    },
    [i18n, user]
  );

  return { currentLanguage, changeLanguage };
}
