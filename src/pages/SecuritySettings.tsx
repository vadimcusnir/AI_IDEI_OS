import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Shield, Key, Lock, Eye, EyeOff,
  CheckCircle2, XCircle, Loader2, Download, Trash2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MFAEnrollment } from "@/components/security/MFAEnrollment";

export default function SecuritySettings() {
  const { t } = useTranslation("pages");
  const { user, session } = useAuth();
  const navigate = useNavigate();

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const PASSWORD_CHECKS = [
    { label: "8+ characters", test: (pw: string) => pw.length >= 8 },
    { label: "Uppercase", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "Number", test: (pw: string) => /\d/.test(pw) },
    { label: "Special char", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ];

  const pwStrength = PASSWORD_CHECKS.filter(c => c.test(newPw)).length;

  const handlePasswordChange = async () => {
    if (newPw !== confirmPw) {
      toast.error("Passwords don't match");
      return;
    }
    if (pwStrength < 3) {
      toast.error("Password too weak");
      return;
    }

    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
    setChangingPw(false);
  };

  const sections = [
    {
      id: "password",
      icon: Key,
      title: "Change Password",
      desc: "Update your account password. Use a strong, unique password.",
    },
    {
      id: "privacy",
      icon: Shield,
      title: "Data & Privacy",
      desc: "Export your data or delete your account under GDPR.",
      action: () => navigate("/data-privacy"),
    },
  ];

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <SEOHead title="Security Settings — AI-IDEI" description="Manage your account security, password, and privacy settings." />

        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Security Settings</h1>
        </div>

        <div className="space-y-4">
          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Account Information</h2>
                <p className="text-micro text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-muted-foreground/60 text-micro block mb-0.5">Account created</span>
                <span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-muted-foreground/60 text-micro block mb-0.5">Email verified</span>
                <span className="font-medium flex items-center gap-1">
                  {user?.email_confirmed_at ? (
                    <><CheckCircle2 className="h-3 w-3 text-success" /> Yes</>
                  ) : (
                    <><XCircle className="h-3 w-3 text-warning" /> Pending</>
                  )}
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-muted-foreground/60 text-micro block mb-0.5">Last sign in</span>
                <span className="font-medium">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-muted-foreground/60 text-micro block mb-0.5">Auth provider</span>
                <span className="font-medium capitalize">{user?.app_metadata?.provider || "email"}</span>
              </div>
            </div>
          </motion.div>

          {/* Password Change */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Change Password</h2>
                <p className="text-micro text-muted-foreground">Use a strong, unique password with 8+ characters.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-micro font-medium text-muted-foreground mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9 px-3 pr-9 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                    {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {/* Strength meter */}
                {newPw.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i <= pwStrength
                             ? pwStrength <= 1 ? "bg-destructive" : pwStrength === 2 ? "bg-warning" : pwStrength === 3 ? "bg-primary" : "bg-success"
                             : "bg-muted"
                         )} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {PASSWORD_CHECKS.map(c => (
                        <div key={c.label} className="flex items-center gap-1">
                           {c.test(newPw) ? <CheckCircle2 className="h-2.5 w-2.5 text-success" /> : <XCircle className="h-2.5 w-2.5 text-muted-foreground/30" />}
                           <span className={cn("text-nano", c.test(newPw) ? "text-foreground" : "text-muted-foreground/50")}>{c.label}</span>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-micro font-medium text-muted-foreground mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                {confirmPw && newPw !== confirmPw && (
                  <p className="text-micro text-destructive mt-1">Passwords don't match</p>
                )}
              </div>

              <Button
                size="sm"
                disabled={changingPw || pwStrength < 3 || newPw !== confirmPw || !newPw}
                onClick={handlePasswordChange}
                className="gap-1.5 text-xs"
              >
                {changingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                Update Password
              </Button>
            </div>
          </motion.div>

          {/* MFA / 2FA */}
          <MFAEnrollment />

          {/* Data & Privacy Link */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Data & Privacy</h2>
                  <p className="text-micro text-muted-foreground">Export your data, manage consent, or delete your account (GDPR).</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/data-privacy")} className="gap-1.5 text-xs">
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>

          {/* Security Tips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-muted/30 border border-border/50 rounded-xl p-5"
          >
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Security Tips
            </h3>
            <ul className="space-y-2 text-micro text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                Use a unique password not shared with other services
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                Enable browser notifications for security alerts
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                Review your active sessions regularly
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                Keep your email address up to date for account recovery
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
