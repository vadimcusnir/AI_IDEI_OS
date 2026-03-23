/**
 * WelcomeScreen — Empty state for Command Center.
 * Shows quick actions, command packs, and proactive suggestions.
 */

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Brain, Sparkles, Network, Zap,
  Command, Layers, TrendingUp, BookOpen,
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
  { label: "Analyze source", icon: Globe, example: "Analyze this YouTube video: https://...", color: "text-blue-500" },
  { label: "Extract neurons", icon: Brain, example: "Extract neurons from my latest episode", color: "text-purple-500" },
  { label: "Generate asset", icon: Sparkles, example: "Generate an article from neurons about leadership", color: "text-pink-500" },
  { label: "Search knowledge", icon: Network, example: "Show all neurons about persuasion techniques", color: "text-green-500" },
];

export function WelcomeScreen({ onCommand, suggestions, neuronCount, episodeCount, balance }: WelcomeScreenProps) {
  const [activePack, setActivePack] = useState<CommandPack | null>(null);

  return (
    <div className="space-y-6 py-4">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Command className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-sm font-bold">Command Center</h2>
        <p className="text-[11px] text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
          Introduce your command, upload a file, or paste a URL. The system generates an execution plan before running.
        </p>

        {/* Stats strip */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            {neuronCount} neurons
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {episodeCount} episodes
          </span>
          <span className="flex items-center gap-1 text-primary font-medium">
            <Zap className="h-3 w-3" />
            {balance.toLocaleString()} N
          </span>
        </div>
      </motion.div>

      {/* Proactive suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Suggested next actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => onCommand(s.prompt)}
                className="group flex items-start gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm">{s.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-medium">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{s.description}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Command Packs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Command Packs
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMMAND_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setActivePack(activePack?.id === pack.id ? null : pack)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
                activePack?.id === pack.id
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-card hover:border-primary/30 text-muted-foreground"
              )}
            >
              <span>{pack.emoji}</span>
              <span>{pack.label}</span>
            </button>
          ))}
        </div>

        {activePack ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activePack.quickPrompts.map((qp) => (
              <button
                key={qp.label}
                onClick={() => onCommand(qp.prompt)}
                className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <span className="text-sm">{activePack.emoji}</span>
                </div>
                <div>
                  <p className="text-xs font-medium">{qp.label}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{qp.prompt}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_COMMANDS.map((hint) => (
              <button
                key={hint.label}
                onClick={() => onCommand(hint.example)}
                className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <hint.icon className={cn("h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors")} />
                </div>
                <div>
                  <p className="text-xs font-medium">{hint.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{hint.example}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
