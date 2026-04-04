import { Loader2 } from "lucide-react";

export interface AIToolItem {
  icon: React.ElementType;
  label: string;
  description: string;
  action: string;
}

export function AIToolButton({ item, onRun, isRunning }: { item: AIToolItem; onRun: (action: string) => void; isRunning?: boolean }) {
  const handleClick = () => {
    if (!isRunning) onRun(item.action);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRunning}
      className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-xs transition-all text-left hover:bg-ai/80 group disabled:opacity-50"
    >
      {isRunning ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 text-ai-accent animate-spin" />
      ) : (
        <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-ai-accent transition-colors" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{item.label}</div>
        <div className="text-micro text-muted-foreground truncate">{item.description}</div>
      </div>
    </button>
  );
}
