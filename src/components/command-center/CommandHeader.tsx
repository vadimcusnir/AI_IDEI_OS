import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, RotateCcw, History, Coins, Command,
  PanelRightOpen, PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KernelBadge } from "./EconomicGate";
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
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Command className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold tracking-tight">Command Center</p>
            <KernelBadge />
          </div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="hidden sm:inline">{totalNeurons} neurons</span>
            <span>·</span>
            <span>{totalEpisodes} episodes</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 text-primary font-medium">
              <Coins className="h-2.5 w-2.5" />
              {balance.toLocaleString()} N
            </span>
            {phase !== "idle" && (
              <>
                <span>·</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] h-4",
                    phase === "executing" && "border-primary text-primary",
                    phase === "completed" && "border-green-500 text-green-500",
                    phase === "failed" && "border-destructive text-destructive",
                  )}
                >
                  {phase === "executing" && <Loader2 className="h-2 w-2 mr-0.5 animate-spin" />}
                  {phase.toUpperCase()}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onToggleMemory} title="Memory & History">
          <History className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClearChat} title="New session">
          <RotateCcw className="h-3 w-3" />
        </Button>
        {phase !== "idle" && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onToggleTaskTree} title="Task Tree">
            {showTaskTree ? <PanelRightClose className="h-3 w-3" /> : <PanelRightOpen className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}
