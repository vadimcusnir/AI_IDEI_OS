import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { trackAuthEvent, resetCorrelationId } from "@/lib/authTelemetry";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("pages");

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashType = hashParams.get("type");
    const hasError = hashParams.get("error") || hashParams.get("error_code");
    if (hashType === "recovery") {
      setIsRecovery(true);
      trackAuthEvent("callback_received", { source: "reset_password_hash", type: "recovery" });
    }
    if (hasError) {
      trackAuthEvent("auth_error_normalized", {
        source: "reset_password_hash",
        error: hashParams.get("error_description") || hasError,
      });
      toast.error(hashParams.get("error_description") || "Recovery link invalid or expired");
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        trackAuthEvent("callback_received", { source: "auth_state_change", type: "PASSWORD_RECOVERY" });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error(t("reset_password.mismatch")); return; }
    // Enforce minimum 8 characters
    if (password.length < 8) { toast.error(t("reset_password.too_short")); return; }
    // Require at least one uppercase, one number, one special char
    if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      toast.error("Password must include uppercase, number, and special character");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      // Log password change security event
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc("log_password_change", { p_user_id: user.id });
        }
      } catch { /* non-blocking */ }

      setSuccess(true);
      toast.success(t("reset_password.success_toast"));
      trackAuthEvent("logout_completed", { source: "password_reset_global" });
      resetCorrelationId();

      // Sign out all sessions after password reset for security
      await supabase.auth.signOut({ scope: "global" });
      setTimeout(() => navigate("/auth"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SEOHead title="Reset Password — AI-IDEI" description="Set a new password for your AI-IDEI account." />
      <div className="w-full max-w-sm">
        <button onClick={() => navigate("/")} className="flex items-center justify-center gap-2 mb-8 mx-auto">
          <Logo size="h-10 w-10" loading="eager" />
          <span className="text-2xl font-normal">AI-IDEI</span>
        </button>
        <div className="bg-card rounded-xl border border-border p-6">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-10 w-10 text-status-validated mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">{t("reset_password.success_title")}</h2>
              <p className="text-sm text-muted-foreground">{t("reset_password.success_desc")}</p>
              <p className="text-xs text-muted-foreground mt-2">Redirecting to sign in...</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-1">{t("reset_password.title")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("reset_password.subtitle")}</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("reset_password.new_password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                      autoComplete="new-password" placeholder="••••••••"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
                  </div>
                  <p className="text-micro text-muted-foreground mt-1">Min 8 chars, uppercase, number, special character</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("reset_password.confirm_password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8}
                      autoComplete="new-password" placeholder="••••••••"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-10 gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>{t("reset_password.reset_button")}</span><ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => navigate("/auth")} className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("reset_password.back_to_sign_in")}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
