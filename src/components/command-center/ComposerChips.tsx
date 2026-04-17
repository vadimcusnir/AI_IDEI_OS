/**
 * ComposerChips — 3 persistent intent chips above the composer.
 * Pre-fills input with intent template, focuses composer.
 * ChatGPT/Claude style: subtle, centered, discovery-friendly.
 */
import { Download, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComposerIntent = "extract" | "analyze" | "generate";

interface ComposerChipsProps {
  onSelect: (intent: ComposerIntent, template: string) => void;
  className?: string;
}

const CHIPS: Array<{
  key: ComposerIntent;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  template: string;
}> = [
  { key: "extract", label: "Extract", icon: Download, template: "Extrage cunoștințe din: " },
  { key: "analyze", label: "Analyze", icon: Search, template: "Analizează: " },
  { key: "generate", label: "Generate", icon: Sparkles, template: "Generează: " },
];

export function ComposerChips({ onSelect, className }: ComposerChipsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5 pb-1.5", className)}>
      {CHIPS.map(({ key, label, icon: Icon, template }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key, template)}
          className={cn(
            "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full",
            "text-xs font-medium text-muted-foreground/70",
            "border border-border/40 bg-card/40 backdrop-blur-sm",
            "hover:border-gold/30 hover:text-foreground hover:bg-card/80",
            "active:scale-[0.97] transition-all duration-150"
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
