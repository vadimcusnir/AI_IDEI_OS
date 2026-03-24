/**
 * WelcomeScreen — Premium empty state for Command Center.
 * Best practices: centered, large suggestions, minimal clutter.
 */

import { motion } from "framer-motion";
import {
  Globe, Brain, Sparkles, Network, Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { COMMAND_PACKS, type CommandPack } from "@/components/agent/CommandPacks";

interface Suggestion {
  id: string;
  icon: string;
  label: string;
  description: string;
  prompt: string;
}

interface WelcomeScreenProps {
  onCommand: (prompt: string) => void;
  suggestions: Suggestion[];
  neuronCount: number;
  episodeCount: number;
  balance: number;
}

const QUICK_COMMANDS = [
  { label: "Analyze a source", desc: "YouTube, podcast, article", icon: Globe, example: "Analyze this YouTube video: https://...", color: "from-blue-500/10 to-blue-500/5 border-blue-500/10" },
  { label: "Extract neurons", desc: "From your latest content", icon: Brain, example: "Extract neurons from my latest episode", color: "from-purple-500/10 to-purple-500/5 border-purple-500/10" },
  { label: "Generate assets", desc: "Articles, frameworks, courses", icon: Sparkles, example: "Generate an article from neurons about leadership", color: "from-amber-500/10 to-amber-500/5 border-amber-500/10" },
  { label: "Search knowledge", desc: "Find patterns and insights", icon: Network, example: "Show all neurons about persuasion techniques", color: "from-green-500/10 to-green-500/5 border-green-500/10" },
];

export function WelcomeScreen({ onCommand, suggestions, neuronCount, episodeCount, balance }: WelcomeScreenProps) {
  const [activePack, setActivePack] = useState<CommandPack | null>(null);

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-8">
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
          <h2 className="text-xl font-bold tracking-tight">How can I help?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Describe what you need, upload a file, or use a command.
          </p>
        </div>
      </motion.div>

      {/* Proactive suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-lg space-y-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-center">
            Suggested for you
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

      {/* Quick commands */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_COMMANDS.map((cmd, i) => (
            <motion.button
              key={cmd.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              onClick={() => onCommand(cmd.example)}
              className={cn(
                "group flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left",
                "bg-gradient-to-br hover:shadow-md hover:scale-[1.01]",
                cmd.color
              )}
            >
              <div className="h-9 w-9 rounded-lg bg-background/80 flex items-center justify-center shrink-0 shadow-sm">
                <cmd.icon className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                <p className="text-xs text-muted-foreground">{cmd.desc}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors shrink-0" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Command Packs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-lg space-y-3"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-center">
          Command Packs
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {COMMAND_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setActivePack(activePack?.id === pack.id ? null : pack)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all",
                activePack?.id === pack.id
                  ? "border-primary/40 bg-primary/10 text-primary font-medium shadow-sm"
                  : "border-border/40 bg-card hover:border-primary/20 text-muted-foreground"
              )}
            >
              <span>{pack.emoji}</span>
              <span>{pack.label}</span>
            </button>
          ))}
        </div>

        {activePack && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden"
          >
            {activePack.quickPrompts.map((qp) => (
              <button
                key={qp.label}
                onClick={() => onCommand(qp.prompt)}
                className="group flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-primary/20 hover:shadow-sm transition-all text-left"
              >
                <span className="text-base shrink-0">{activePack.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{qp.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{qp.prompt}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-6 text-xs text-muted-foreground/40"
      >
        <span className="tabular-nums">{neuronCount} neurons</span>
        <span>·</span>
        <span className="tabular-nums">{episodeCount} episodes</span>
        <span>·</span>
        <span className="flex items-center gap-1 text-primary/50 font-medium tabular-nums">
          <Zap className="h-3 w-3" />
          {balance.toLocaleString()} N
        </span>
      </motion.div>
    </div>
  );
}
