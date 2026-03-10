import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") setIsRecovery(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { setSuccess(true); toast.success("Password has been reset successfully!"); setTimeout(() => navigate("/home"), 2000); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate("/")} className="flex items-center justify-center gap-2 mb-8 mx-auto">
          <img src={logo} alt="AI-IDEI" className="h-10 w-10 rounded-full" />
          <span className="text-2xl font-serif font-normal">AI-IDEI</span>
        </button>
        <div className="bg-card rounded-xl border border-border p-6">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-10 w-10 text-status-validated mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">Password Reset!</h2>
              <p className="text-sm text-muted-foreground">You will be redirected automatically...</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-1">Set New Password</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose a new password for your account.</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="••••••••"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-10 gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Reset Password</span><ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => navigate("/auth")} className="text-xs text-muted-foreground hover:text-primary transition-colors">← Back to sign in</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
