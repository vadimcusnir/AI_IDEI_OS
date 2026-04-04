/**
 * ModeChipBar — 4 core execution mode chips above the composer.
 * Extract | Generate | Analyze | Structure
 */
import { Upload, Wand2, BarChart3, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommandMode = "extract" | "generate" | "analyze" | "structure" | null;

interface ModeChipBarProps {
  activeMode: CommandMode;
  onModeChange: (mode: CommandMode) => void;
}

const MODES = [
  { key: "extract" as const, label: "Extract", icon: Upload, color: "text-info" },
  { key: "generate" as const, label: "Generate", icon: Wand2, color: "text-success" },
  { key: "analyze" as const, label: "Analyze", icon: BarChart3, color: "text-warning" },
  { key: "structure" as const, label: "Structure", icon: LayoutGrid, color: "text-semantic-purple" },
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
              "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-micro whitespace-nowrap transition-all duration-200 border",
              isActive
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-transparent border-transparent text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
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
