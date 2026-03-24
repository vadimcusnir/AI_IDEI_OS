import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Button } from "@/components/ui/button";
import {
  Coins, ArrowRight, Search, FileText, Share2, BarChart3, Sparkles,
  Zap, Brain, Target,
} from "lucide-react";
import { motion } from "framer-motion";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { PageTransition } from "@/components/motion/PageTransition";
import { cn } from "@/lib/utils";

const QUICK_INTENTS = [
  { label: "Landing Page", icon: FileText, search: "landing", intentCategory: "sell", color: "text-blue-500" },
  { label: "Social Media", icon: Share2, search: "social", intentCategory: "attract", color: "text-emerald-500" },
  { label: "Market Research", icon: BarChart3, search: "research", intentCategory: "convert", color: "text-amber-500" },
  { label: "Generează Curs", icon: Sparkles, search: "course", intentCategory: "educate", color: "text-purple-500" },
];

const STATS = [
  { label: "Servicii AI", value: "3000+", icon: Zap },
  { label: "Tipuri Output", value: "50+", icon: Brain },
  { label: "Timp Mediu", value: "<60s", icon: Target },
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  const [intent, setIntent] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useOnboardingRedirect();

  if (authLoading) return <HomeSkeleton />;

  const handleSubmit = (text?: string) => {
    const q = (text || intent).trim();
    if (!q) return;
    navigate(`/services?intent=${encodeURIComponent(q)}`);
  };

  const handleQuickIntent = (search: string, intentCategory: string) => {
    navigate(`/services?search=${encodeURIComponent(search)}&category=${encodeURIComponent(intentCategory)}`);
  };

  return (
    <PageTransition>
      <WelcomeModal />
      <SEOHead title={`${t("home.cockpit")} — AI-IDEI`} description={t("home.cockpit_desc")} />

      <div className="flex-1 overflow-auto relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.02] blur-[100px]" />
        </div>

        {/* NEURON balance widget — top right */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-5">
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            onClick={() => navigate("/credits")}
            className={cn(
              "ml-auto flex items-center gap-2.5 px-4 py-2 rounded-full",
              "border border-border/50 bg-card/70 backdrop-blur-md",
              "hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5",
              "transition-all duration-300 group"
            )}
          >
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Coins className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm font-bold tabular-nums text-foreground">{balance?.toLocaleString() ?? "—"}</span>
            <span className="text-[11px] font-medium text-muted-foreground tracking-wide">NEURONS</span>
          </motion.button>
        </div>

        {/* Hero — intent-first search */}
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[52vh] pt-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full text-center space-y-10"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/[0.08] border border-primary/10 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                <Zap className="h-3 w-3" />
                AI Execution Engine
              </span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold tracking-[-0.035em] leading-[1.1]">
                Ce vrei să{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-primary/85 to-primary/70 bg-clip-text text-transparent">
                    construim
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/60 to-primary/20 rounded-full origin-left"
                  />
                </span>{" "}
                astăzi?
              </h1>
              <p className="text-base sm:text-[17px] text-muted-foreground max-w-md mx-auto leading-relaxed font-normal">
                Descrie ce ai nevoie. AI-ul transformă ideea în livrabile profesionale.
              </p>
            </div>

            {/* Giant search bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative w-full"
            >
              <div
                className={cn(
                  "relative flex items-center rounded-2xl border bg-card transition-all duration-300",
                  isFocused
                    ? "border-primary/50 shadow-xl shadow-primary/[0.08] ring-1 ring-primary/20"
                    : "border-border/60 shadow-lg shadow-black/[0.03] hover:border-border hover:shadow-xl hover:shadow-black/[0.05]"
                )}
              >
                <Search className={cn(
                  "absolute left-5 h-5 w-5 transition-colors duration-300",
                  isFocused ? "text-primary" : "text-muted-foreground/50"
                )} />
                <input
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Scrie un articol despre..., Creează o strategie de..."
                  className="w-full bg-transparent py-5 sm:py-[1.4rem] pl-14 pr-36 text-base sm:text-[15px] placeholder:text-muted-foreground/40 focus:outline-none"
                />
                <Button
                  onClick={() => handleSubmit()}
                  disabled={!intent.trim()}
                  size="lg"
                  className={cn(
                    "absolute right-2.5 gap-2 rounded-xl px-5 sm:px-6 h-10 sm:h-11",
                    "shadow-sm transition-all duration-200",
                    intent.trim() && "shadow-md shadow-primary/20"
                  )}
                >
                  <span className="hidden sm:inline text-sm font-semibold">Generează</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* Quick intents */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {QUICK_INTENTS.map((qi, i) => (
                <motion.button
                  key={qi.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.35 }}
                  onClick={() => handleSubmit(qi.intent)}
                  className={cn(
                    "group flex items-center gap-2 px-3.5 py-2 rounded-xl",
                    "border border-border/40 bg-card/50 backdrop-blur-sm",
                    "text-[13px] font-medium text-muted-foreground",
                    "hover:border-primary/30 hover:text-foreground hover:bg-card hover:shadow-sm",
                    "transition-all duration-200"
                  )}
                >
                  <qi.icon className={cn("h-3.5 w-3.5 transition-colors", qi.color, "opacity-60 group-hover:opacity-100")} />
                  {qi.label}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="max-w-xl mx-auto px-4 sm:px-6 pb-12"
        >
          <div className="flex items-center justify-center gap-8 sm:gap-12 pt-8 border-t border-border/30">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5 text-center">
                <stat.icon className="h-4 w-4 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-bold tabular-nums text-foreground">{stat.value}</p>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
