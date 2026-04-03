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

export function PostAuthRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only act on SIGNED_IN and only once per mount cycle
      if (event !== "SIGNED_IN" || handled.current) return;
      
      // Don't interfere if user is already on /auth (Auth.tsx handles it)
      if (location.pathname === "/auth") return;
      
      const pending = consumeRedirect();
      if (pending && pending !== location.pathname) {
        handled.current = true;
        // Small delay to let auth state propagate
        setTimeout(() => navigate(pending, { replace: true }), 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
}
