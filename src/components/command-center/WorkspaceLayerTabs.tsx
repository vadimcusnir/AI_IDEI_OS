/**
 * WorkspaceLayerTabs — Contextual workspace layers for /home.
 * Replaces navigation with in-page context switching.
 * CHAT → EXECUTION → KNOWLEDGE → SYSTEM
 */
import { cn } from "@/lib/utils";
import {
  MessageCircle, Zap, BookOpen, Package,
  Rocket, Layers, Brain, Network, Store, Bot,
} from "lucide-react";

export type WorkspaceLayer = "chat" | "execution" | "knowledge" | "system";

interface WorkspaceLayerTabsProps {
  active: WorkspaceLayer;
  onChange: (layer: WorkspaceLayer) => void;
  executionActive?: boolean;
}

const LAYERS: Array<{
  id: WorkspaceLayer;
  label: string;
  icon: React.ElementType;
  badge?: boolean;
}> = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "execution", label: "Execuție", icon: Zap, badge: true },
  { id: "knowledge", label: "Cunoștințe", icon: BookOpen },
  { id: "system", label: "Sistem", icon: Package },
];

export function WorkspaceLayerTabs({ active, onChange, executionActive }: WorkspaceLayerTabsProps) {
  return (
    <div className="flex items-center gap-0.5 px-4 sm:px-6 h-10 border-b border-border/20 bg-background/80 backdrop-blur-sm">
      {LAYERS.map((layer) => (
        <button
          key={layer.id}
          onClick={() => onChange(layer.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
            active === layer.id
              ? "bg-[hsl(var(--gold-oxide)/0.08)] text-[hsl(var(--gold-oxide))]"
              : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30"
          )}
        >
          <layer.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{layer.label}</span>
          {layer.badge && executionActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide))] animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}

/** Sub-tabs for Execution layer */
export function ExecutionSubTabs({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  const tabs = [
    { id: "runs", label: "Runs", icon: Rocket },
    { id: "pipeline", label: "Pipeline", icon: Layers },
    { id: "jobs", label: "Jobs", icon: Zap },
  ];
  return (
    <div className="flex items-center gap-1 px-4 py-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-md text-dense transition-colors",
            active === tab.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground/50 hover:text-foreground"
          )}
        >
          <tab.icon className="h-3 w-3" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Sub-tabs for Knowledge layer */
export function KnowledgeSubTabs({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  const tabs = [
    { id: "neurons", label: "Neuroni", icon: Brain },
    { id: "insights", label: "Insights", icon: Network },
    { id: "library", label: "Library", icon: BookOpen },
  ];
  return (
    <div className="flex items-center gap-1 px-4 py-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-md text-dense transition-colors",
            active === tab.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground/50 hover:text-foreground"
          )}
        >
          <tab.icon className="h-3 w-3" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Sub-tabs for System layer */
export function SystemSubTabs({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  const tabs = [
    { id: "marketplace", label: "Marketplace", icon: Store },
    { id: "agents", label: "Agenți", icon: Bot },
    { id: "tools", label: "Tools", icon: Package },
  ];
  return (
    <div className="flex items-center gap-1 px-4 py-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-md text-dense transition-colors",
            active === tab.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground/50 hover:text-foreground"
          )}
        >
          <tab.icon className="h-3 w-3" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
