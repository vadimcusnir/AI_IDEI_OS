import { Button } from "@/components/ui/button";
import {
  RotateCcw, History, Coins, Sparkles,
  PanelRightOpen, PanelRightClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandPhase } from "@/stores/executionStore";

interface CommandHeaderProps {
  totalNeurons: number;
  totalEpisodes: number;
  balance: number;
  phase: CommandPhase;
  showTaskTree: boolean;
  onToggleMemory: () => void;
  onClearChat: () => void;
  onToggleTaskTree: () => void;
  onToggleHistory: () => void;
}

export function CommandHeader({
  totalNeurons, totalEpisodes, balance, phase,
  showTaskTree, onToggleMemory, onClearChat, onToggleTaskTree, onToggleHistory,
}: CommandHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* History sidebar toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground/50 hover:text-foreground"
          onClick={onToggleHistory}
          title="Istoric conversații"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" />
        </Button>
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tracking-tight">Command Center</span>
          <div className="hidden sm:flex items-center gap-2.5 text-micro">
            <span className="opacity-30">·</span>
            <span className="tabular-nums">{totalNeurons} neurons</span>
            <span className="opacity-30">·</span>
            <span className="tabular-nums">{totalEpisodes} episodes</span>
          </div>
          <span className="opacity-30">·</span>
          <span className="flex items-center gap-1 text-primary font-semibold tabular-nums">
            <Coins className="h-3 w-3" />
            {balance.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground/50 hover:text-foreground"
          onClick={onToggleMemory}
          title="Memory & History"
        >
          <History className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground/50 hover:text-foreground"
          onClick={onClearChat}
          title="Sesiune nouă"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        {phase !== "idle" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-lg text-muted-foreground/50 hover:text-foreground"
            onClick={onToggleTaskTree}
            title="Task Tree"
          >
            {showTaskTree ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}
