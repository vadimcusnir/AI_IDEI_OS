import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface PipelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface Props {
  steps: PipelineStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function PipelineProgressHeader({ steps, currentStep, onStepClick }: Props) {
  return (
    <div className="flex items-center gap-1 w-full py-3 px-2 overflow-x-auto">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isComplete = i < currentStep;
        const isActive = i === currentStep;
        const isClickable = onStepClick && i <= currentStep;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(i)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all text-left min-w-0",
                isActive && "bg-primary/10 border border-primary/20",
                isComplete && "opacity-80 hover:opacity-100",
                !isActive && !isComplete && "opacity-40",
                isClickable && "cursor-pointer",
              )}
            >
              <div className={cn(
                "h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
                isComplete && "bg-primary text-primary-foreground",
                isActive && "bg-primary/20 text-primary",
                !isActive && !isComplete && "bg-muted text-muted-foreground",
              )}>
                {isComplete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className={cn(
                  "text-micro font-medium truncate",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}>
                  {step.label}
                </p>
              </div>
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-px mx-1 min-w-[12px]",
                isComplete ? "bg-primary/40" : "bg-border",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
