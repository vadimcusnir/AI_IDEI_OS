/**
 * PipelineWizardStepper — Visual 3-step progress indicator
 * Upload → Process → Results
 */
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Upload, Brain, Sparkles, Check } from "lucide-react";

export type WizardStep = "upload" | "process" | "results";

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "process", label: "Analyze", icon: Brain },
  { key: "results", label: "Results", icon: Sparkles },
];

const STEP_INDEX: Record<WizardStep, number> = { upload: 0, process: 1, results: 2 };

interface Props {
  current: WizardStep;
  completedSteps?: WizardStep[];
}

export function PipelineWizardStepper({ current, completedSteps = [] }: Props) {
  const currentIdx = STEP_INDEX[current];

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto">
      {STEPS.map((step, i) => {
        const isActive = step.key === current;
        const isCompleted = completedSteps.includes(step.key) || i < currentIdx;
        const Icon = isCompleted && !isActive ? Check : step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  boxShadow: isActive
                    ? "0 0 0 4px hsl(var(--primary) / 0.15)"
                    : "0 0 0 0px transparent",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground/40"
                )}
              >
                <Icon className="h-4 w-4" />
              </motion.div>
              <span
                className={cn(
                  "text-micro font-semibold uppercase tracking-wider transition-colors",
                  isActive
                    ? "text-primary"
                    : isCompleted
                      ? "text-primary/60"
                      : "text-muted-foreground/40"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-2 h-0.5 rounded-full relative overflow-hidden bg-border min-w-[40px]">
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
