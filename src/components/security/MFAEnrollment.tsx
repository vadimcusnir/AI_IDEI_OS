import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Loader2, CheckCircle2, Smartphone, Copy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type MFAStatus = "idle" | "enrolling" | "verifying" | "enrolled" | "unenrolling";

function StatusBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full font-medium", className)}>{children}</span>;
}

export function MFAEnrollment() {
  const [status, setStatus] = useState<MFAStatus>("idle");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<{ id: string; friendly_name: string; status: string }[]>([]);

  const loadFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    if (data) {
      const totp = data.totp.map(f => ({ id: f.id, friendly_name: f.friendly_name || "Authenticator", status: f.status }));
      setFactors(totp);
      if (totp.some(f => f.status === "verified")) setStatus("enrolled");
    }
  };

  useEffect(() => { loadFactors(); }, []);

  const startEnroll = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "AI-IDEI Authenticator",
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setQrUri(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
    setStatus("enrolling");
    setLoading(false);
  };

  const verifyEnroll = async () => {
    if (code.length !== 6) { toast.error("Enter 6-digit code"); return; }
    setLoading(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr) { toast.error(cErr.message); setLoading(false); return; }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (vErr) { toast.error("Invalid code. Try again."); setLoading(false); return; }

    toast.success("MFA enabled successfully!");
    setStatus("enrolled");
    setCode("");
    setLoading(false);
    loadFactors();
  };

  const unenroll = async (fId: string) => {
    setLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: fId });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("MFA disabled");
    setStatus("idle");
    setFactors([]);
    setLoading(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Two-Factor Authentication</h2>
          <p className="text-micro text-muted-foreground">
            Add an extra layer of security with TOTP authenticator app.
          </p>
        </div>
        {status === "enrolled" && (
          <StatusBadge className="ml-auto bg-primary/10 text-primary text-nano">Enabled</StatusBadge>
        )}
      </div>

      {status === "idle" && (
        <div className="space-y-3">
          <div className="bg-muted/30 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-accent-foreground mt-0.5 shrink-0" />
            <p className="text-micro text-muted-foreground">
              MFA protects your account even if your password is compromised. 
              You'll need an authenticator app like Google Authenticator or Authy.
            </p>
          </div>
          <Button size="sm" onClick={startEnroll} disabled={loading} className="gap-1.5 text-xs">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
            Enable MFA
          </Button>
        </div>
      )}

      {status === "enrolling" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Scan this QR code with your authenticator app:</p>
          <div className="flex flex-col items-center gap-3">
            {qrUri && <img src={qrUri} alt="MFA QR Code" loading="lazy" className="w-48 h-48 rounded-lg border border-border" />}
            <div className="flex items-center gap-2">
              <code className="text-micro font-mono bg-muted px-2 py-1 rounded select-all">{secret}</code>
              <Button variant="ghost" size="sm" onClick={copySecret} className="h-6 w-6 p-0">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-micro font-medium text-muted-foreground mb-1 block">Enter 6-digit code</label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-32 h-9 text-center font-mono tracking-widest"
                maxLength={6}
              />
              <Button size="sm" onClick={verifyEnroll} disabled={loading || code.length !== 6}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {status === "enrolled" && (
        <div className="space-y-3">
          {factors.filter(f => f.status === "verified").map(f => (
            <div key={f.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs">{f.friendly_name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => unenroll(f.id)} disabled={loading}
                className="text-micro text-destructive hover:text-destructive h-7">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disable"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
