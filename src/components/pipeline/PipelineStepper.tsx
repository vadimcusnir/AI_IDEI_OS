/**
 * PipelineStepper — 5-step canonical progress header
 * Input → Extract → Structure → Generate → Library
 */
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Upload, Brain, Network, Sparkles, BookOpen, Check } from "lucide-react";

export type PipelineStage = "input" | "extract" | "structure" | "generate" | "library";

const STAGES: { key: PipelineStage; label: string; icon: React.ElementType }[] = [
  { key: "input", label: "Input", icon: Upload },
  { key: "extract", label: "Extract", icon: Brain },
  { key: "structure", label: "Structure", icon: Network },
  { key: "generate", label: "Generate", icon: Sparkles },
  { key: "library", label: "Library", icon: BookOpen },
];

const STAGE_INDEX: Record<PipelineStage, number> = {
  input: 0, extract: 1, structure: 2, generate: 3, library: 4,
};

interface Props {
  current: PipelineStage;
  completedStages?: PipelineStage[];
  onStageClick?: (stage: PipelineStage) => void;
}

export function PipelineStepper({ current, completedStages = [], onStageClick }: Props) {
  const currentIdx = STAGE_INDEX[current];

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-2xl mx-auto py-4">
      {STAGES.map((stage, i) => {
        const isActive = stage.key === current;
        const isCompleted = completedStages.includes(stage.key) || i < currentIdx;
        const isClickable = isCompleted && onStageClick;
        const Icon = isCompleted && !isActive ? Check : stage.icon;

        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-initial">
            <button
              type="button"
              onClick={() => isClickable && onStageClick?.(stage.key)}
              disabled={!isClickable}
              className={cn(
                "flex flex-col items-center gap-1.5 group",
                isClickable && "cursor-pointer"
              )}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  boxShadow: isActive
                    ? "0 0 0 4px hsl(var(--primary) / 0.15)"
                    : "0 0 0 0px transparent",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-colors duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-primary/20 text-primary group-hover:bg-primary/30"
                      : "bg-muted text-muted-foreground/40"
                )}
              >
                <Icon className="h-4 w-4" />
              </motion.div>
              <span
                className={cn(
                  "text-micro font-semibold uppercase tracking-wider transition-colors hidden sm:block",
                  isActive
                    ? "text-primary"
                    : isCompleted
                      ? "text-primary/60"
                      : "text-muted-foreground/40"
                )}
              >
                {stage.label}
              </span>
            </button>
            {i < STAGES.length - 1 && (
              <div className="flex-1 mx-1.5 sm:mx-2 h-0.5 rounded-full relative overflow-hidden bg-border min-w-[24px] sm:min-w-[40px]">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary/50 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted || i < currentIdx ? "100%" : isActive ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
