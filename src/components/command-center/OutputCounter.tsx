/**
 * OutputCounter — Animated counter showing output multiplication.
 * 1 input → 5 → 12 → 27 → 50 outputs
 * Triggers dopamine + perceived value + conversion.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface OutputCounterProps {
  targetCount: number;
  isActive: boolean;
  className?: string;
}

export function OutputCounter({ targetCount, isActive, className }: OutputCounterProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const [phase, setPhase] = useState<"idle" | "counting" | "done">("idle");

  useEffect(() => {
    if (!isActive || targetCount <= 0) {
      setDisplayCount(0);
      setPhase("idle");
      return;
    }

    setPhase("counting");
    let current = 0;
    const steps = generateSteps(targetCount);
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex >= steps.length) {
        clearInterval(interval);
        setDisplayCount(targetCount);
        setPhase("done");
        return;
      }
      current = steps[stepIndex];
      setDisplayCount(current);
      stepIndex++;
    }, 120);

    return () => clearInterval(interval);
  }, [isActive, targetCount]);

  if (!isActive && displayCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-primary/5 border border-primary/15",
        className,
      )}
    >
      <div className="relative">
        <Sparkles className={cn(
          "h-4 w-4 transition-colors duration-300",
          phase === "counting" ? "text-primary animate-pulse" : "text-primary/60",
        )} />
        {phase === "counting" && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-micro text-muted-foreground">1 input →</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={displayCount}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={cn(
              "text-sm font-mono font-bold tabular-nums",
              phase === "done" ? "text-primary" : "text-foreground",
            )}
          >
            {displayCount}
          </motion.span>
        </AnimatePresence>
        <span className="text-micro text-muted-foreground">outputs</span>
      </div>

      {phase === "done" && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1"
        >
          <Zap className="h-3 w-3 text-primary" />
          <span className="text-nano font-bold text-primary uppercase tracking-wider">
            {targetCount}x
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

function generateSteps(target: number): number[] {
  const steps: number[] = [];
  // Logarithmic curve for dramatic effect
  const numSteps = Math.min(12, Math.max(5, Math.ceil(Math.log2(target))));
  for (let i = 1; i <= numSteps; i++) {
    const progress = i / numSteps;
    // Ease-out cubic for dramatic acceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    steps.push(Math.max(1, Math.round(eased * target)));
  }
  // Deduplicate
  return [...new Set(steps)];
}
