import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRight, Search, FileText, Share2, BarChart3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { PageTransition } from "@/components/motion/PageTransition";
import { cn } from "@/lib/utils";

const QUICK_INTENTS = [
  { label: "Scrie un Landing Page", icon: FileText, intent: "Scrie un landing page complet" },
  { label: "Plan Social Media", icon: Share2, intent: "Creează un plan complet de social media" },
  { label: "Market Research", icon: BarChart3, intent: "Fă un research complet de piață" },
  { label: "Generează un Curs", icon: Sparkles, intent: "Generează structura completă a unui curs" },
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  const [intent, setIntent] = useState("");

  useOnboardingRedirect();

  if (authLoading) return <HomeSkeleton />;

  const handleSubmit = (text?: string) => {
    const q = (text || intent).trim();
    if (!q) return;
    navigate(`/services?intent=${encodeURIComponent(q)}`);
  };

  return (
    <PageTransition>
      <WelcomeModal />
      <SEOHead title={`${t("home.cockpit")} — AI-IDEI`} description={t("home.cockpit_desc")} />

      <div className="flex-1 overflow-auto">
        {/* NEURON balance widget — top right */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 flex justify-end">
          <motion.button
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate("/credits")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-colors"
          >
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tabular-nums">{balance?.toLocaleString() ?? "—"}</span>
            <span className="text-xs text-muted-foreground">NEURONS</span>
          </motion.button>
        </div>

        {/* Hero — intent-first search */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[55vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full text-center space-y-8"
          >
            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Ce vrei să{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                  construim
                </span>{" "}
                astăzi?
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Descrie ce ai nevoie. AI-ul transformă ideea în livrabile profesionale.
              </p>
            </div>

            {/* Giant search bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="relative w-full"
            >
              <div className="relative flex items-center rounded-2xl border-2 border-border/60 bg-card shadow-lg shadow-primary/5 focus-within:border-primary/60 focus-within:shadow-primary/10 transition-all duration-300">
                <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Scrie un articol despre..., Creează o strategie de..., Analizează piața pentru..."
                  className="w-full bg-transparent py-5 sm:py-6 pl-14 pr-36 text-base sm:text-lg placeholder:text-muted-foreground/50 focus:outline-none"
                />
                <Button
                  onClick={() => handleSubmit()}
                  disabled={!intent.trim()}
                  size="lg"
                  className="absolute right-3 gap-2 rounded-xl px-5 sm:px-6"
                >
                  <span className="hidden sm:inline">Generează</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* Quick intents */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-wrap justify-center gap-2.5"
            >
              {QUICK_INTENTS.map((qi) => (
                <button
                  key={qi.label}
                  onClick={() => handleSubmit(qi.intent)}
                  className={cn(
                    "group flex items-center gap-2 px-4 py-2.5 rounded-xl",
                    "border border-border/50 bg-card/60 backdrop-blur-sm",
                    "text-sm text-muted-foreground",
                    "hover:border-primary/40 hover:text-foreground hover:bg-primary/5",
                    "transition-all duration-200"
                  )}
                >
                  <qi.icon className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                  {qi.label}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
