import { useState } from "react";
import { Loader2 } from "lucide-react";

export interface AIToolItem {
  icon: React.ElementType;
  label: string;
  description: string;
  action: string;
}

export function AIToolButton({ item, onRun }: { item: AIToolItem; onRun: (action: string) => void }) {
  const [isRunning, setIsRunning] = useState(false);

  const handleClick = () => {
    setIsRunning(true);
    onRun(item.action);
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRunning}
      className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-xs transition-all text-left hover:bg-ai/80 group"
    >
      {isRunning ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 text-ai-accent animate-spin" />
      ) : (
        <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-ai-accent transition-colors" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{item.label}</div>
        <div className="text-[10px] text-muted-foreground truncate">{item.description}</div>
      </div>
    </button>
  );
}
