/**
 * ModeChipBar — 6 contextual mode chips above the composer.
 * Selecting a mode opens a contextual panel with quick actions.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Wand2, LayoutGrid, DollarSign, Library, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CommandMode = "extract" | "generate" | "structure" | "monetize" | "library" | "research" | null;

interface ModeChipBarProps {
  activeMode: CommandMode;
  onModeChange: (mode: CommandMode) => void;
}

const MODES = [
  { key: "extract" as const, label: "Extract", icon: Upload, color: "text-blue-400" },
  { key: "generate" as const, label: "Generate", icon: Wand2, color: "text-emerald-400" },
  { key: "structure" as const, label: "Structure", icon: LayoutGrid, color: "text-violet-400" },
  { key: "monetize" as const, label: "Monetize", icon: DollarSign, color: "text-amber-400" },
  { key: "library" as const, label: "Library", icon: Library, color: "text-cyan-400" },
  { key: "research" as const, label: "Research", icon: Search, color: "text-rose-400" },
] as const;

export function ModeChipBar({ activeMode, onModeChange }: ModeChipBarProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1">
      {MODES.map((mode) => {
        const isActive = activeMode === mode.key;
        return (
          <button
            key={mode.key}
            onClick={() => onModeChange(isActive ? null : mode.key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 border",
              isActive
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card/60 border-border/30 text-muted-foreground/60 hover:text-muted-foreground hover:border-border/50 hover:bg-card"
            )}
          >
            <mode.icon className={cn("h-3 w-3", isActive ? "text-primary" : mode.color)} />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
