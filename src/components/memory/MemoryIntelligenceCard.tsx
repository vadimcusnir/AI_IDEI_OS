/**
 * Memory Intelligence Dashboard Widget
 * Shows compounding level, lock-in score, top topics, smart suggestions.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserMemory, COMPOUND_LEVELS } from "@/hooks/useUserMemory";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Brain, TrendingUp, Target, Sparkles,
  ArrowRight, Lock, Layers,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function MemoryIntelligenceCard({ className }: { className?: string }) {
  const { user } = useAuth();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { profile, loading, recomputeProfile, getSuggestions, compoundInfo } = useUserMemory();

  // Recompute on mount (background, non-blocking)
  useEffect(() => {
    if (user) recomputeProfile();
  }, [user]);

  if (!user || loading) return null;

  const suggestions = getSuggestions();
  const lockinPct = Math.min(100, profile.lockin_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-xl border border-border bg-card", className)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold">
            {t("memory.title", { defaultValue: "Memoria ta AI" })}
          </p>
          <p className="text-micro text-muted-foreground">
            {t("memory.compound_level", {
              defaultValue: "Nivel {{level}} — {{label}}",
              level: profile.compounding_level,
              label: compoundInfo.label,
            })}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-sm font-bold text-foreground">{profile.total_neurons}</p>
          <p className="text-nano text-muted-foreground">Neuroni</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-sm font-bold text-foreground">{profile.total_outputs}</p>
          <p className="text-nano text-muted-foreground">Outputs</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-sm font-bold text-foreground">{profile.total_shares}</p>
          <p className="text-nano text-muted-foreground">Shares</p>
        </div>
      </div>

      {/* Lock-in Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-micro text-muted-foreground flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" />
            {t("memory.lockin_score", { defaultValue: "Lock-in Score" })}
          </span>
          <span className="text-micro font-mono font-bold text-primary">
            {lockinPct.toFixed(0)}%
          </span>
        </div>
        <Progress value={lockinPct} className="h-1.5" />
        <p className="text-nano text-muted-foreground mt-0.5">
          {lockinPct < 30
            ? t("memory.lockin_low", { defaultValue: "Continuă să creezi pentru a crește valoarea contului" })
            : lockinPct < 70
            ? t("memory.lockin_medium", { defaultValue: "Biblioteca ta devine valoroasă — continuă!" })
            : t("memory.lockin_high", { defaultValue: "Cont cu valoare ridicată — cunoștințele tale sunt unice" })}
        </p>
      </div>

      {/* Compounding Progress */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <Layers className="h-3 w-3 text-primary/60" />
          <span className="text-micro font-medium">
            {t("memory.compounding", { defaultValue: "Compounding" })}
          </span>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(level => (
            <div
              key={level}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                level <= profile.compounding_level ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-nano text-muted-foreground mt-0.5">{compoundInfo.description}</p>
      </div>

      {/* Top Topics */}
      {profile.top_topics.length > 0 && (
        <div className="mb-3">
          <p className="text-micro text-muted-foreground mb-1">
            {t("memory.top_topics", { defaultValue: "Topicuri principale" })}
          </p>
          <div className="flex flex-wrap gap-1">
            {profile.top_topics.slice(0, 5).map(topic => (
              <span key={topic} className="text-nano px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-micro font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-primary" />
            {t("memory.suggestions", { defaultValue: "Sugestii inteligente" })}
          </p>
          <div className="space-y-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => navigate(s.route)}
                className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left hover:bg-muted/50 transition-colors group"
              >
                <Target className="h-3 w-3 text-primary/60 shrink-0" />
                <span className="text-micro text-foreground group-hover:text-primary transition-colors flex-1">
                  {s.label}
                </span>
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
