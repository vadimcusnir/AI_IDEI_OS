import { useState, useMemo, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { getRedirectTarget, storeRedirect } from "@/lib/authRedirect";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { isDisposableEmail } from "@/lib/disposableEmails";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type AuthMode = "login" | "signup" | "forgot";

/** Track client-side login attempts for immediate UX feedback */
const loginAttemptTracker = new Map<string, { count: number; firstAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CLIENT_ATTEMPTS = 5;

function isClientRateLimited(email: string): boolean {
  const key = email.toLowerCase();
  const tracker = loginAttemptTracker.get(key);
  if (!tracker) return false;
  if (Date.now() - tracker.firstAt > LOGIN_WINDOW_MS) {
    loginAttemptTracker.delete(key);
    return false;
  }
  return tracker.count >= MAX_CLIENT_ATTEMPTS;
}

function recordClientAttempt(email: string) {
  const key = email.toLowerCase();
  const tracker = loginAttemptTracker.get(key);
  if (!tracker || Date.now() - tracker.firstAt > LOGIN_WINDOW_MS) {
    loginAttemptTracker.set(key, { count: 1, firstAt: Date.now() });
  } else {
    tracker.count++;
  }
}

export default function Auth() {
  const { t } = useTranslation(["pages", "common"]);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Resolve redirect target from ?redirect=, router state, or sessionStorage
  const redirectTarget = useMemo(
    () => getRedirectTarget(searchParams, location.state),
    [searchParams, location.state]
  );

  // Store redirect for OAuth flows (Google login redirects away from page)
  useMemo(() => {
    if (redirectTarget) storeRedirect(redirectTarget);
  }, [redirectTarget]);

  // Read ?mode= param to set initial mode
  useMemo(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup") setMode("signup");
  }, []);

  // Minimum 8 chars (upgraded from 6)
  const PASSWORD_CHECKS = useMemo(() => [
    { label: t("auth.pw_8_chars"), test: (pw: string) => pw.length >= 8 },
    { label: t("auth.pw_uppercase"), test: (pw: string) => /[A-Z]/.test(pw) },
    { label: t("auth.pw_number"), test: (pw: string) => /\d/.test(pw) },
    { label: t("auth.pw_special"), test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ], [t]);

  function getStrength(pw: string): { score: number; label: string; color: string } {
    const passed = PASSWORD_CHECKS.filter((c) => c.test(pw)).length;
    if (passed <= 1) return { score: 1, label: t("auth.pw_weak"), color: "bg-destructive" };
    if (passed === 2) return { score: 2, label: t("auth.pw_fair"), color: "bg-warning" };
    if (passed === 3) return { score: 3, label: t("auth.pw_good"), color: "bg-primary" };
    return { score: 4, label: t("auth.pw_strong"), color: "bg-success" };
  }

  /** Generic error messages — never reveal account existence */
  function friendlyError(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes("invalid login credentials")) return t("auth.error_invalid_login");
    if (lower.includes("email not confirmed")) return t("auth.error_email_not_confirmed");
    if (lower.includes("user already registered")) return t("auth.error_user_exists");
    if (lower.includes("password") && lower.includes("leak")) return t("auth.error_password_leak");
    if (lower.includes("rate limit") || lower.includes("too many")) return t("auth.error_rate_limit");
    if (lower.includes("weak password")) return t("auth.error_weak_password");
    return msg;
  }

  const strength = useMemo(() => getStrength(password), [password]);
  const checks = useMemo(() => PASSWORD_CHECKS.map((c) => ({ ...c, passed: c.test(password) })), [password]);

  // Redirect post-auth — în useEffect pentru a evita race conditions cu PostAuthRedirector
  useEffect(() => {
    if (user) {
      navigate(redirectTarget || "/home", { replace: true });
    }
  }, [user, redirectTarget, navigate]);
  if (user) return null;

  const logSecurityEvent = async (eventType: string, metadata: Record<string, unknown> = {}) => {
    try {
      await supabase.from("security_events").insert({
        user_id: user ? (user as any).id : null,
        event_type: eventType,
        severity: eventType.includes("fail") ? "warning" : "info",
        metadata: { ...metadata, timestamp: new Date().toISOString() },
      });
    } catch {
      // Non-blocking — don't break auth flow for logging failures
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error(t("auth.invalid_email"));
      return;
    }
    if (mode === "signup" && isDisposableEmail(trimmedEmail)) {
      toast.error(t("common:auth.disposable_email"));
      return;
    }
    if (mode === "signup" && !tosAccepted) {
      toast.error(t("common:auth.tos_required"));
      return;
    }

    // Client-side brute-force protection
    if (mode === "login" && isClientRateLimited(trimmedEmail)) {
      toast.error(t("auth.error_rate_limit"));
      return;
    }

    if (mode !== "forgot") {
      if (password.length < 8) {
        toast.error(t("auth.password_min"));
        return;
      }
      if (mode === "signup" && strength.score < 2) {
        toast.error(t("auth.password_stronger"));
        return;
      }
    }

    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Always show success message to prevent email enumeration
      toast.success(t("auth.reset_sent"));
      if (error) console.warn("Reset error (hidden from user):", error.message);
      await logSecurityEvent("password_reset_requested", { email: trimmedEmail });
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await signUp(trimmedEmail, password);
      if (error) {
        toast.error(friendlyError(error.message));
        await logSecurityEvent("signup_failed", { email: trimmedEmail, reason: error.message });
      } else {
        toast.success(t("auth.confirm_email"));
        await logSecurityEvent("signup_success", { email: trimmedEmail });
      }
    } else {
      const { error } = await signIn(trimmedEmail, password);
      if (error) {
        recordClientAttempt(trimmedEmail);
        toast.error(friendlyError(error.message));
        await logSecurityEvent("login_failed", { email: trimmedEmail });
      } else {
        // Reset client tracker on success
        loginAttemptTracker.delete(trimmedEmail);
        await logSecurityEvent("login_success", { email: trimmedEmail });
        // Redirect to original destination or straight to /home
        navigate(redirectTarget || "/home", { replace: true });
      }
    }
    setLoading(false);
  };

  const titles: Record<AuthMode, { heading: string; sub: string }> = {
    login: { heading: t("auth.login_heading"), sub: t("auth.login_sub") },
    signup: { heading: t("auth.signup_heading"), sub: t("auth.signup_sub") },
    forgot: { heading: t("auth.forgot_heading"), sub: t("auth.forgot_sub") },
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 py-8 sm:py-12 overflow-hidden">
      {/* Layered ambient glows — asymmetric for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[60%] -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-[hsl(var(--gold-oxide)/0.04)] blur-[180px]" />
        <div className="absolute bottom-[15%] left-[25%] w-[350px] h-[300px] rounded-full bg-primary/[0.03] blur-[140px]" />
        <div className="absolute top-[60%] right-[10%] w-[200px] h-[200px] rounded-full bg-[hsl(var(--petrol)/0.03)] blur-[120px]" />
      </div>

      {/* Subtle noise texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

      <SEOHead title="Sign In — AI-IDEI" description="Sign in or create your AI-IDEI account to start extracting knowledge." />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-[400px] z-10"
      >
        {/* Brand mark */}
        <button onClick={() => navigate("/")} className="flex items-center justify-center gap-3 mb-10 mx-auto group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[hsl(var(--gold-oxide)/0.25)] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Logo size="h-10 w-10" className="relative shadow-lg shadow-[hsl(var(--gold-oxide)/0.08)]" loading="eager" />
          </div>
          <span className="text-h4 font-semibold tracking-tight text-foreground">AI-IDEI</span>
        </button>

        {/* Auth card */}
        <div className="bg-card/90 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-2xl shadow-[hsl(var(--gold-oxide)/0.04)] p-7 sm:p-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground mb-1.5">{titles[mode].heading}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-7">{titles[mode].sub}</p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-2 block">{t("auth.email_label")}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full h-12 min-h-[48px] pl-11 pr-4 rounded-xl border border-border/60 bg-background/60 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--gold-oxide)/0.25)] focus:border-[hsl(var(--gold-oxide)/0.5)] transition-all duration-200 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Password */}
            {mode !== "forgot" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-2 block">{t("auth.password_label")}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    className="w-full h-12 min-h-[48px] pl-11 pr-11 rounded-xl border border-border/60 bg-background/60 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--gold-oxide)/0.25)] focus:border-[hsl(var(--gold-oxide)/0.5)] transition-all duration-200 placeholder:text-muted-foreground/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength — signup only */}
                {mode === "signup" && password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3.5 space-y-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all duration-300",
                              i <= strength.score ? strength.color : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn("text-micro font-semibold tracking-wide", strength.score >= 3 ? "text-emerald-600" : "text-muted-foreground")}>
                        {strength.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {checks.map((check) => (
                        <div key={check.label} className="flex items-center gap-2">
                          {check.passed ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className={cn("text-dense", check.passed ? "text-foreground/80" : "text-muted-foreground/50")}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Terms of Service — signup only */}
            {mode === "signup" && (
              <label className="flex items-start gap-2.5 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-[hsl(var(--gold-oxide)/0.25)]"
                />
                <span className="text-dense text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                  {t("common:auth.accept_tos")}{" "}
                  <a href="/terms" target="_blank" className="text-[hsl(var(--gold-oxide))] hover:underline font-medium">ToS</a>
                  {" & "}
                  <a href="/privacy" target="_blank" className="text-[hsl(var(--gold-oxide))] hover:underline font-medium">Privacy</a>
                </span>
              </label>
            )}

            {/* Submit CTA */}
            <Button
              type="submit"
              disabled={loading || (mode === "signup" && !tosAccepted)}
              className="w-full h-12 gap-2.5 rounded-xl text-sm font-semibold bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] shadow-lg shadow-[hsl(var(--gold-oxide)/0.15)] transition-all duration-200"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  {mode === "login" && t("auth.sign_in")}
                  {mode === "signup" && t("auth.create_account")}
                  {mode === "forgot" && t("auth.send_link")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* OAuth divider + Google */}
          {mode !== "forgot" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-card/90 px-4 text-micro text-muted-foreground/60 uppercase tracking-[0.2em] font-medium">{t("auth.or")}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  // Persist redirect target before OAuth redirect (sessionStorage backup for callback)
                  if (redirectTarget) storeRedirect(redirectTarget);
                  const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                  if (error) toast.error(t("common:google_signin_error", { message: error.message }));
                }}
                className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-background/60 hover:bg-muted/40 hover:border-[hsl(var(--gold-oxide)/0.25)] transition-all duration-200 text-sm font-medium"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t("auth.continue_google")}
              </button>
            </>
          )}

          {/* Mode switches */}
          <div className="mt-6 space-y-2.5 text-center">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-xs text-muted-foreground/60 hover:text-[hsl(var(--gold-oxide))] transition-colors block mx-auto">{t("auth.forgot_password")}</button>
                <button onClick={() => setMode("signup")} className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors block mx-auto">
                  {t("auth.no_account")} <span className="text-[hsl(var(--gold-oxide))] font-semibold">{t("auth.create_one")}</span>
                </button>
              </>
            )}
            {mode === "signup" && (
              <button onClick={() => setMode("login")} className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">
                {t("auth.have_account")} <span className="text-[hsl(var(--gold-oxide))] font-semibold">{t("auth.sign_in_link")}</span>
              </button>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-xs text-muted-foreground/70 hover:text-[hsl(var(--gold-oxide))] transition-colors">{t("auth.back_to_sign_in")}</button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-micro text-muted-foreground/40 mt-6 tracking-wide">
          {t("auth.footer")}
        </p>
      </motion.div>
    </div>
  );
}
