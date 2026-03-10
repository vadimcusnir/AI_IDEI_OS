import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AuthMode = "login" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/home", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Link-ul de resetare a fost trimis pe email.");
      }
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verifică email-ul pentru a-ți confirma contul.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/home");
      }
    }
    setLoading(false);
  };

  const titles: Record<AuthMode, { heading: string; sub: string }> = {
    login: { heading: "Bine ai revenit", sub: "Conectează-te la Knowledge OS" },
    signup: { heading: "Creează cont", sub: "Începe să-ți capitalizezi expertiza" },
    forgot: { heading: "Resetare parolă", sub: "Trimitem un link de resetare pe email" },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center gap-2 mb-8 mx-auto"
        >
          <img src={logo} alt="AI-IDEI" className="h-10 w-10 rounded-full" />
          <span className="text-2xl font-serif font-normal">AI-IDEI</span>
        </button>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-1">{titles[mode].heading}</h2>
          <p className="text-sm text-muted-foreground mb-6">{titles[mode].sub}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@exemplu.com"
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Parolă</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-10 gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" && "Conectare"}
                  {mode === "signup" && "Creează cont"}
                  {mode === "forgot" && "Trimite link"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center">
            {mode === "login" && (
              <>
                <button
                  onClick={() => setMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors block mx-auto"
                >
                  Ai uitat parola?
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors block mx-auto"
                >
                  Nu ai cont? Creează unul
                </button>
              </>
            )}
            {mode === "signup" && (
              <button
                onClick={() => setMode("login")}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Ai deja cont? Conectează-te
              </button>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => setMode("login")}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                ← Înapoi la conectare
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
