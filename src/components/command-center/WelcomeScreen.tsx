/**
 * WelcomeScreen — Clean empty state for Command Center.
 * Compact: greeting + Magic Pipeline + up to 4 proactive suggestions + stats.
 */

import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MagicPipelineFlow } from "@/components/pipeline/MagicPipelineFlow";

interface Suggestion {
  id: string;
  icon: string;
  label: string;
  description: string;
  prompt: string;
}

interface WelcomeScreenProps {
  onCommand: (prompt: string) => void;
  onPipelineMessage?: (role: "user" | "assistant", content: string, meta?: Record<string, any>) => void;
  suggestions: Suggestion[];
  neuronCount: number;
  episodeCount: number;
  balance: number;
}

export function WelcomeScreen({ onCommand, onPipelineMessage, suggestions, neuronCount, episodeCount, balance }: WelcomeScreenProps) {
  const { t } = useTranslation(["pages", "common"]);

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-6">
      {/* Logo + greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto border border-primary/10 shadow-lg shadow-primary/[0.05]">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {t("pages:home.welcome_title", { defaultValue: "How can I help?" })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pages:home.welcome_subtitle", { defaultValue: "Describe what you need, upload a file, or pick a suggestion below." })}
          </p>
        </div>
      </motion.div>

      {/* Magic Pipeline — one-click full extraction */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <MagicPipelineFlow onPipelineMessage={onPipelineMessage} />
      </motion.div>

      {/* Proactive suggestions — max 4 */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-lg space-y-3"
        >
          <p className="text-dense font-semibold uppercase tracking-wider text-muted-foreground/60 text-center">
            {t("pages:home.suggested_for_you", { defaultValue: "Suggested for you" })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => onCommand(s.prompt)}
                className="group flex items-start gap-3 p-3 rounded-xl border border-primary/15 bg-primary/[0.03] hover:bg-primary/[0.06] hover:border-primary/30 transition-all text-left"
              >
                <span className="text-lg shrink-0 mt-0.5">{s.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-6 text-xs text-muted-foreground/40"
      >
        <span className="tabular-nums">{neuronCount} {t("common:neurons", { defaultValue: "neurons" })}</span>
        <span>·</span>
        <span className="tabular-nums">{episodeCount} {t("common:episodes", { defaultValue: "episodes" })}</span>
        <span>·</span>
        <span className="flex items-center gap-1 text-primary/50 font-medium tabular-nums">
          <Zap className="h-3 w-3" />
          {balance.toLocaleString()} N
        </span>
      </motion.div>
    </div>
  );
}
