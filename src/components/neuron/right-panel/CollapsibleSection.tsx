import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIToolButton, AIToolItem } from "./AIToolButton";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  color: string;
  items: AIToolItem[];
  defaultOpen?: boolean;
  onAction?: (action: string) => void;
}

export function CollapsibleSection({ title, icon: Icon, color, items, defaultOpen = true, onAction }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="panel-section">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="panel-section-title flex items-center gap-1.5 w-full text-left"
      >
        <Icon className={cn("h-3 w-3", color)} />
        {title}
        {isOpen ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 mt-1">
          {items.map(item => (
            <AIToolButton key={item.label} item={item} onRun={(action) => onAction?.(action)} />
          ))}
        </div>
      )}
    </div>
  );
}
