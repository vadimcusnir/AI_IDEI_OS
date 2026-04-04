import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ScorePanelProps {
  neuronScore: number;
  formatStats: {
    code: number;
    yaml: number;
    prompts: number;
    data: number;
  };
}

export function ScorePanel({ neuronScore, formatStats }: ScorePanelProps) {
  const { t } = useTranslation("common");
  return (
    <div className="px-3 py-3 border-b border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("neuron_editor.neuron_score")}</span>
        <span className="text-lg font-bold text-primary">{neuronScore}</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${neuronScore}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: t("neuron_editor.score_code"), value: formatStats.code, color: "text-status-validated" },
          { label: "YAML", value: formatStats.yaml, color: "text-ai-accent" },
          { label: t("neuron_editor.score_prompts"), value: formatStats.prompts, color: "text-primary" },
          { label: t("neuron_editor.score_data"), value: formatStats.data, color: "text-graph-highlight" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={cn("text-sm font-bold", s.color)}>{s.value}</div>
            <div className="text-nano text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
