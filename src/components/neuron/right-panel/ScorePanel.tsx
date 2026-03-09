import { cn } from "@/lib/utils";

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
  return (
    <div className="px-3 py-3 border-b border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Neuron Score</span>
        <span className="text-lg font-bold text-primary">{neuronScore}</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${neuronScore}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: "Code", value: formatStats.code, color: "text-status-validated" },
          { label: "YAML", value: formatStats.yaml, color: "text-ai-accent" },
          { label: "Prompts", value: formatStats.prompts, color: "text-primary" },
          { label: "Data", value: formatStats.data, color: "text-graph-highlight" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={cn("text-sm font-bold", s.color)}>{s.value}</div>
            <div className="text-[8px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
