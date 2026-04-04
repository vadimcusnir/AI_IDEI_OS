import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, Plus, Trash2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChainStep {
  id: string;
  instruction: string;
  result?: string;
}

interface PromptChainBuilderProps {
  steps: ChainStep[];
  onUpdateStep: (id: string, instruction: string) => void;
  onAddStep: () => void;
  onRemoveStep: (id: string) => void;
  activeStepIndex: number;
}

export function PromptChainBuilder({
  steps,
  onUpdateStep,
  onAddStep,
  onRemoveStep,
  activeStepIndex,
}: PromptChainBuilderProps) {
  const { t } = useTranslation("pages");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          {t("prompt_forge.chain_label", { defaultValue: "Prompt Chain" })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-micro gap-1"
          onClick={onAddStep}
          disabled={steps.length >= 5}
        >
          <Plus className="h-3 w-3" />
          {t("prompt_forge.chain_add", { defaultValue: "Pas" })}
        </Button>
      </div>

      <div className="space-y-1">
        {steps.map((step, idx) => (
          <div key={step.id}>
            {idx > 0 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg border p-2.5 transition-all",
                idx === activeStepIndex
                  ? "border-primary bg-primary/5"
                  : idx < activeStepIndex
                  ? "border-border bg-muted/30"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-micro font-bold text-muted-foreground">
                  {t("prompt_forge.chain_step", { defaultValue: "Pas" })} {idx + 1}
                  {idx === 0 && (
                    <span className="ml-1 text-nano font-normal text-muted-foreground/60">
                      (input original)
                    </span>
                  )}
                  {idx > 0 && (
                    <span className="ml-1 text-nano font-normal text-muted-foreground/60">
                      (primește output-ul anterior)
                    </span>
                  )}
                </span>
                {steps.length > 1 && (
                  <button
                    onClick={() => onRemoveStep(step.id)}
                    className="p-0.5 rounded hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
              <Textarea
                value={step.instruction}
                onChange={(e) => onUpdateStep(step.id, e.target.value)}
                placeholder={
                  idx === 0
                    ? t("prompt_forge.chain_first_placeholder", { defaultValue: "Instrucțiune inițială..." })
                    : t("prompt_forge.chain_next_placeholder", { defaultValue: "Transformare aplicată pe rezultatul anterior..." })
                }
                rows={2}
                className="text-xs resize-none"
              />
              {step.result && (
                <div className="mt-2 p-2 rounded bg-muted/50 text-micro text-muted-foreground max-h-20 overflow-y-auto">
                  {step.result.slice(0, 200)}...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
