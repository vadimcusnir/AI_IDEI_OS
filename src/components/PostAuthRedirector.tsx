/**
 * PostAuthRedirector — Catches OAuth/email-verification callbacks.
 * 
 * After Google OAuth, the user lands on "/" (window.location.origin).
 * Auth.tsx is NOT mounted, so its redirect logic doesn't fire.
 * This component watches for SIGNED_IN events and consumes
 * the stored redirect from sessionStorage.
 * 
 * Mount once in the app tree (e.g. inside Router but outside routes).
 */
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { consumeRedirect } from "@/lib/authRedirect";
import { trackAuthEvent } from "@/lib/authTelemetry";

export function PostAuthRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    // Detect OAuth implicit-flow callback debris (e.g. #access_token=... or #error=...)
    if (typeof window !== "undefined" && window.location.hash) {
      const h = new URLSearchParams(window.location.hash.substring(1));
      if (h.get("access_token") || h.get("error")) {
        trackAuthEvent("callback_received", {
          source: "hash_fragment",
          has_token: !!h.get("access_token"),
          error: h.get("error_description") || h.get("error") || null,
        });
        if (h.get("error")) {
          trackAuthEvent("code_exchange_failed", {
            source: "hash_fragment",
            error: h.get("error_description") || h.get("error"),
          });
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        trackAuthEvent("session_created", { source: "auth_state_change", user_id: session.user.id });
      }
      if (event === "TOKEN_REFRESHED" && !session) {
        trackAuthEvent("session_restore_failed", { source: "token_refresh", reason: "refresh_returned_null" });
      }
      // Only act on SIGNED_IN and only once per mount cycle
      if (event !== "SIGNED_IN" || handled.current) return;

      // Don't interfere if user is already on /auth (Auth.tsx handles it)
      if (location.pathname === "/auth") return;

      const pending = consumeRedirect();
      if (pending && pending !== location.pathname) {
        handled.current = true;
        trackAuthEvent("post_login_redirect_completed", { source: "PostAuthRedirector", target: pending });
        // Small delay to let auth state propagate
        setTimeout(() => navigate(pending, { replace: true }), 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
}
