/**
 * TypingIndicator — Animated dots + rotating status label.
 * Shows "Thinking → Analyzing → Generating" while AI processes.
 * i18n via pages:home.typing.*
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  /** Optional override label key; if absent, rotates through default phases. */
  labelKey?: string;
  /** Visual variant. */
  variant?: "default" | "compact";
  className?: string;
}

const ROTATING_KEYS = [
  "pages:home.typing.thinking",
  "pages:home.typing.analyzing",
  "pages:home.typing.generating",
];

const DEFAULT_LABELS: Record<string, string> = {
  "pages:home.typing.thinking": "Thinking…",
  "pages:home.typing.analyzing": "Analyzing…",
  "pages:home.typing.generating": "Generating…",
};

export function TypingIndicator({ labelKey, variant = "default", className }: TypingIndicatorProps) {
  const { t } = useTranslation(["pages"]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (labelKey) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % ROTATING_KEYS.length), 2200);
    return () => clearInterval(id);
  }, [labelKey]);

  const activeKey = labelKey ?? ROTATING_KEYS[idx];
  const label = t(activeKey, { defaultValue: DEFAULT_LABELS[activeKey] ?? "Thinking…" });

  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)} aria-live="polite">
        <span className="flex gap-1">
          <span className="w-1 h-1 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1 h-1 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1 h-1 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
        <span className="text-nano text-muted-foreground">{label}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-2.5", className)} aria-live="polite" role="status">
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span
          key={activeKey}
          className="text-xs text-muted-foreground ml-1 animate-in fade-in duration-300"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
