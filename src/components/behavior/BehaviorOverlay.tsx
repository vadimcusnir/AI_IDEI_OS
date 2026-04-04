/**
 * Behavior Overlay — renders contextual CTAs, banners, and triggers
 * based on real-time user behavior classification.
 */
import { lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserBehavior } from "@/hooks/useUserBehavior";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useGamification } from "@/hooks/useGamification";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Zap, TrendingUp, Coins, Flame, ArrowRight, Sparkles,
  Gift, Crown, AlertTriangle, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Psychological Elements ───
function SavingsDisplay({ neuronsSpent }: { neuronsSpent: number }) {
  const { t } = useTranslation("common");
  const freelancerEquiv = (neuronsSpent * 0.002 * 10).toFixed(0); // 10x markup = freelancer cost

  if (neuronsSpent < 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-micro"
    >
      <TrendingUp className="h-3 w-3 text-success" />
      <span className="text-success font-semibold">
        {t("behavior.savings", {
          defaultValue: "Ai economisit ~${{amount}} vs freelancer",
          amount: freelancerEquiv,
        })}
      </span>
    </motion.div>
  );
}

function StreakRecoveryBanner() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { streak } = useGamification();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs"
    >
      <Flame className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-amber-600 dark:text-amber-400 font-medium">
        {t("behavior.streak_lost", {
          defaultValue: "Streak-ul tău de {{days}} zile s-a pierdut!",
          days: streak.longest_streak,
        })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="text-micro h-6 ml-auto text-amber-600 hover:text-amber-700"
        onClick={() => navigate("/services")}
      >
        {t("behavior.streak_recover", { defaultValue: "Recuperează acum" })}
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </motion.div>
  );
}

function UpgradePromptBanner() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20 text-xs"
    >
      <Crown className="h-3.5 w-3.5 text-primary" />
      <span className="font-medium text-primary">
        {t("behavior.upgrade_hint", {
          defaultValue: "Deblochează servicii premium și discount-uri de până la 40%",
        })}
      </span>
      <Button
        variant="default"
        size="sm"
        className="text-micro h-6 ml-auto gap-1"
        onClick={() => navigate("/credits")}
      >
        <Sparkles className="h-3 w-3" />
        {t("behavior.see_plans", { defaultValue: "Vezi planuri" })}
      </Button>
    </motion.div>
  );
}

function ExplorerCTA() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20 text-xs"
    >
      <Gift className="h-3.5 w-3.5 text-primary" />
      <span className="font-medium text-foreground">
        {t("behavior.explorer_cta", {
          defaultValue: "Primești 500 NEURONS gratuit la înregistrare",
        })}
      </span>
      <Button
        variant="default"
        size="sm"
        className="text-micro h-6 ml-auto gap-1"
        onClick={() => navigate("/auth")}
      >
        {t("behavior.start_free", { defaultValue: "Începe gratuit" })}
        <ArrowRight className="h-3 w-3" />
      </Button>
    </motion.div>
  );
}

function NearCapWarning({ usedPct }: { usedPct: number }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs"
    >
      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-amber-600 dark:text-amber-400 font-medium">
        {t("behavior.near_cap", {
          defaultValue: "Ai consumat {{pct}}% din limita zilnică",
          pct: usedPct,
        })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="text-micro h-6 ml-auto text-amber-600"
        onClick={() => navigate("/credits")}
      >
        {t("behavior.upgrade_limit", { defaultValue: "Crește limita" })}
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </motion.div>
  );
}

/**
 * Main overlay — renders inside AppLayout, above content.
 * Shows max 1 banner at a time based on priority.
 */
export function BehaviorOverlay() {
  const { user } = useAuth();
  const behavior = useUserBehavior();
  const { balance } = useCreditBalance();

  // Determine highest-priority banner to show
  const banner = useMemo(() => {
    // Explorer (not logged in) — show signup CTA
    if (behavior.segment === "explorer" && !user) {
      return <ExplorerCTA />;
    }

    // Streak break — urgent recovery
    if (behavior.activeTriggers.includes("streak_break")) {
      return <StreakRecoveryBanner />;
    }

    // Near daily cap
    if (behavior.activeTriggers.includes("near_daily_cap")) {
      return <NearCapWarning usedPct={80} />;
    }

    // Upgrade opportunity for active consumers
    if (behavior.activeTriggers.includes("upgrade_opportunity")) {
      return <UpgradePromptBanner />;
    }

    return null;
  }, [behavior.segment, behavior.activeTriggers, user]);

  return (
    <AnimatePresence mode="wait">
      {banner && <div key={behavior.segment}>{banner}</div>}
    </AnimatePresence>
  );
}

/**
 * Post-execution psychological overlay — shows after service completion.
 */
export function PostExecutionPsychology({
  neuronsSpent,
  serviceKey,
}: {
  neuronsSpent: number;
  serviceKey: string;
}) {
  const { t } = useTranslation("common");
  const behavior = useUserBehavior();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-2 mt-3"
    >
      {/* Savings display — loss aversion */}
      <SavingsDisplay neuronsSpent={neuronsSpent} />

      {/* Social proof */}
      {behavior.segment === "consumer" && (
        <div className="flex items-center gap-2 text-micro text-muted-foreground">
          <Target className="h-3 w-3 text-primary/60" />
          <span>
            {t("behavior.social_proof", {
              defaultValue: "Top 10% utilizatori AI-IDEI folosesc 3+ servicii per sesiune",
            })}
          </span>
        </div>
      )}

      {/* Progress hint */}
      {behavior.revenueScore > 50 && (
        <div className="flex items-center gap-2 text-micro text-muted-foreground">
          <Zap className="h-3 w-3 text-primary/60" />
          <span>
            {t("behavior.momentum", {
              defaultValue: "Ești în flow — continuă pentru rezultate compound",
            })}
          </span>
        </div>
      )}
    </motion.div>
  );
}
