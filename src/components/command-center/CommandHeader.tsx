import { Button } from "@/components/ui/button";
import {
  RotateCcw, History, Coins, Sparkles,
  PanelRightOpen, PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandPhase } from "@/hooks/useCommandState";

interface CommandHeaderProps {
  totalNeurons: number;
  totalEpisodes: number;
  balance: number;
  phase: CommandPhase;
  showTaskTree: boolean;
  onToggleMemory: () => void;
  onClearChat: () => void;
  onToggleTaskTree: () => void;
}

export function CommandHeader({
  totalNeurons, totalEpisodes, balance, phase,
  showTaskTree, onToggleMemory, onClearChat, onToggleTaskTree,
}: CommandHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background/60 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground text-xs tracking-tight">Command Center</span>
          <span className="hidden sm:inline opacity-40">·</span>
          <span className="hidden sm:inline tabular-nums">{totalNeurons} neurons</span>
          <span className="hidden sm:inline opacity-40">·</span>
          <span className="hidden sm:inline tabular-nums">{totalEpisodes} episodes</span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-1 text-primary font-semibold tabular-nums">
            <Coins className="h-2.5 w-2.5" />
            {balance.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={onToggleMemory}
          title="Memory & History"
        >
          <History className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={onClearChat}
          title="New session"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        {phase !== "idle" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
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
