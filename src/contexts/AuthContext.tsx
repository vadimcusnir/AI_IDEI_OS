import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearRedirect } from "@/lib/authRedirect";
import { setSentryUser } from "@/lib/sentry";
import { trackAuthEvent, resetCorrelationId } from "@/lib/authTelemetry";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_FALLBACK: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: new Error("AuthProvider not mounted") }),
  signIn: async () => ({ error: new Error("AuthProvider not mounted") }),
  signOut: async () => {},
};

/** Session inactivity timeout: 30 minutes */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Set up listener BEFORE getSession to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setSentryUser(newSession?.user ? { id: newSession.user.id, email: newSession.user.email } : null);
      setLoading(false);
      setInitialized(true);
    });

    supabase.auth.getSession().then(async ({ data: { session: existingSession }, error }) => {
      if (!mounted) return;
      // Bad JWT auto-recovery — clear the corrupt token so the user can log in cleanly
      if (error && /jwt|sub claim|invalid/i.test(error.message)) {
        console.warn("[AuthProvider] Corrupt session detected — purging:", error.message);
        trackAuthEvent("bad_jwt_recovered", { error: error.message });
        try { await supabase.auth.signOut(); } catch {}
        setSession(null);
        setUser(null);
      } else {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        if (existingSession?.user) trackAuthEvent("session_created", { source: "restore", user_id: existingSession.user.id });
      }
      setLoading(false);
      setInitialized(true);
    }).catch((err) => {
      if (!mounted) return;
      console.error("[AuthProvider] getSession failed:", err);
      trackAuthEvent("session_restore_failed", { error: String(err?.message || err) });
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Idle timeout: sign out after 30min inactivity ──
  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        console.warn("[security] Session idle timeout — signing out");
        await supabase.auth.signOut();
      }, IDLE_TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    clearRedirect();
    trackAuthEvent("logout_completed");
    resetCorrelationId();
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn("[useAuth] Called outside AuthProvider — returning safe fallback");
    return AUTH_FALLBACK;
  }
  return context;
}
