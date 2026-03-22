import { useState, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type AuthMode = "login" | "signup" | "forgot";

/* ─── Password strength & error helpers use t() now ─── */

export default function Auth() {
  const { t } = useTranslation(["pages", "common"]);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const PASSWORD_CHECKS = useMemo(() => [
    { label: t("auth.pw_8_chars"), test: (pw: string) => pw.length >= 8 },
    { label: t("auth.pw_uppercase"), test: (pw: string) => /[A-Z]/.test(pw) },
    { label: t("auth.pw_number"), test: (pw: string) => /\d/.test(pw) },
    { label: t("auth.pw_special"), test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ], [t]);

  function getStrength(pw: string): { score: number; label: string; color: string } {
    const passed = PASSWORD_CHECKS.filter((c) => c.test(pw)).length;
    if (passed <= 1) return { score: 1, label: t("auth.pw_weak"), color: "bg-destructive" };
    if (passed === 2) return { score: 2, label: t("auth.pw_fair"), color: "bg-amber-500" };
    if (passed === 3) return { score: 3, label: t("auth.pw_good"), color: "bg-primary" };
    return { score: 4, label: t("auth.pw_strong"), color: "bg-emerald-500" };
  }

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

  if (user) { navigate("/home", { replace: true }); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error(t("auth.invalid_email"));
      return;
    }
    if (mode !== "forgot") {
      if (password.length < 6) {
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
      if (error) toast.error(friendlyError(error.message));
      else toast.success(t("auth.reset_sent"));
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await signUp(trimmedEmail, password);
      if (error) toast.error(friendlyError(error.message));
      else toast.success(t("auth.confirm_email"));
    } else {
      const { error } = await signIn(trimmedEmail, password);
      if (error) toast.error(friendlyError(error.message));
      else {
        const { count } = await supabase.from("neurons").select("id", { count: "exact", head: true });
        navigate(count && count > 0 ? "/home" : "/onboarding");
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
    <div className="min-h-screen bg-background gradient-bg-animated noise-overlay relative flex items-center justify-center px-4">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/[0.05] rounded-full blur-[150px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-500/[0.04] rounded-full blur-[120px] animate-float" style={{ animationDelay: "3s" }} />

      <SEOHead title="Sign In — AI-IDEI" description="Sign in or create your AI-IDEI account to start extracting knowledge." />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-sm z-10"
      >
        <button onClick={() => navigate("/")} className="flex items-center justify-center gap-2.5 mb-8 mx-auto group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img src={logo} alt="AI-IDEI" className="relative h-10 w-10 rounded-full shadow-lg shadow-primary/10" />
          </div>
          <span className="text-2xl font-normal">AI-IDEI</span>
        </button>

        <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border shadow-xl shadow-primary/[0.03] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-lg font-semibold mb-1">{titles[mode].heading}</h2>
              <p className="text-sm text-muted-foreground mb-6">{titles[mode].sub}</p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("auth.email_label")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-input bg-background/80 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("auth.password_label")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-input bg-background/80 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength indicator — signup only */}
                {mode === "signup" && password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {/* Strength bar */}
                    <div className="flex items-center gap-2">
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
                      <span className={cn("text-[10px] font-medium", strength.score >= 3 ? "text-emerald-600" : "text-muted-foreground")}>
                        {strength.label}
                      </span>
                    </div>

                    {/* Requirements checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {checks.map((check) => (
                        <div key={check.label} className="flex items-center gap-1.5">
                          {check.passed ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                          )}
                          <span className={cn("text-[10px]", check.passed ? "text-foreground" : "text-muted-foreground/60")}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            <Button type="submit" disabled={loading} className="btn-glow w-full h-11 gap-2 rounded-xl text-sm font-medium">
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

          {mode !== "forgot" && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full section-divider" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-card/80 px-3 text-[10px] text-muted-foreground uppercase tracking-wider">{t("auth.or")}</span>
                </div>
              </div>
              <button type="button" onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                if (error) toast.error(t("common:google_signin_error", { message: error.message }));
              }} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-input bg-background/80 hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 text-sm font-medium">
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

          <div className="mt-5 space-y-2 text-center">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-primary transition-colors block mx-auto">{t("auth.forgot_password")}</button>
                <button onClick={() => setMode("signup")} className="text-xs text-muted-foreground hover:text-primary transition-colors block mx-auto">{t("auth.no_account")} <span className="text-primary font-medium">{t("auth.create_one")}</span></button>
              </>
            )}
            {mode === "signup" && <button onClick={() => setMode("login")} className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("auth.have_account")} <span className="text-primary font-medium">{t("auth.sign_in_link")}</span></button>}
            {mode === "forgot" && <button onClick={() => setMode("login")} className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("auth.back_to_sign_in")}</button>}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-4">
          {t("auth.footer")}
        </p>
      </motion.div>
    </div>
  );
}
