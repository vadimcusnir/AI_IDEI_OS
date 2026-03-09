import { useState } from "react";
import {
  Sparkles, Brain, Lightbulb, MessageSquareQuote, Target,
  Expand, BookOpen, Swords, GraduationCap,
  FileText, Twitter, Video, Presentation,
  Network, Radar, Layers, TrendingUp,
  ChevronRight, ChevronDown, Loader2, Zap,
  Code, Bug, TestTube, Gauge,
  Play, Settings2, Calendar,
  FileCode, Braces, Table as TableIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Block, BLOCK_TYPE_CONFIG } from "./types";

interface AIToolItem {
  icon: React.ElementType;
  label: string;
  description: string;
}

interface AISection {
  title: string;
  icon: React.ElementType;
  color: string;
  items: AIToolItem[];
}

interface NeuronRightPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  neuronScore: number;
  blocks: Block[];
}

function AIToolButton({ item, onRun }: { item: AIToolItem; onRun: () => void }) {
  const [isRunning, setIsRunning] = useState(false);

  const handleClick = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
    onRun();
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

function CollapsibleSection({ title, icon: Icon, color, items, defaultOpen = true }: {
  title: string; icon: React.ElementType; color: string; items: AIToolItem[]; defaultOpen?: boolean;
}) {
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
            <AIToolButton key={item.label} item={item} onRun={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NeuronRightPanel({ isCollapsed, onToggle, neuronScore, blocks }: NeuronRightPanelProps) {
  const executableCount = blocks.filter(b => BLOCK_TYPE_CONFIG[b.type].executable).length;
  const formatStats = {
    code: blocks.filter(b => b.type === "code").length,
    yaml: blocks.filter(b => b.type === "yaml").length,
    prompts: blocks.filter(b => b.type === "prompt").length,
    data: blocks.filter(b => b.type === "dataset" || b.type === "json").length,
  };

  if (isCollapsed) {
    return (
      <div className="w-10 border-l border-border bg-card flex flex-col items-center py-3 gap-3 shrink-0">
        <button onClick={onToggle} className="text-ai-accent hover:text-foreground transition-colors">
          <Sparkles className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Code className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Play className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Network className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-border">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-ai-accent" />
          Intelligence
        </span>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Score + Format Stats */}
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

      {/* AI Sections */}
      <div className="flex-1 overflow-y-auto">
        <CollapsibleSection
          title="AI Extraction"
          icon={Sparkles}
          color="text-ai-accent"
          items={[
            { icon: Brain, label: "Extract Insights", description: "Key takeaways from content" },
            { icon: Layers, label: "Extract Frameworks", description: "Structured mental models" },
            { icon: MessageSquareQuote, label: "Extract Questions", description: "Questions this raises" },
            { icon: Target, label: "Extract Quotes", description: "Quotable statements" },
            { icon: Lightbulb, label: "Extract Prompts", description: "Auto-generate prompts" },
          ]}
        />

        <CollapsibleSection
          title="Code Tools"
          icon={Code}
          color="text-status-validated"
          items={[
            { icon: Bug, label: "Debug Code", description: "Find and fix errors" },
            { icon: Gauge, label: "Optimize Code", description: "Performance improvements" },
            { icon: TestTube, label: "Generate Tests", description: "Auto-create test cases" },
            { icon: FileCode, label: "Explain Code", description: "Line-by-line explanation" },
          ]}
          defaultOpen={false}
        />

        <CollapsibleSection
          title="Pipeline Execution"
          icon={Play}
          color="text-primary"
          items={[
            { icon: Play, label: "Run Pipeline", description: "Execute YAML pipeline" },
            { icon: Settings2, label: "Simulate", description: "Dry-run without side effects" },
            { icon: Calendar, label: "Schedule", description: "Set automated execution" },
            { icon: Braces, label: "Validate Schema", description: "Check data structures" },
          ]}
          defaultOpen={false}
        />

        <CollapsibleSection
          title="AI Transformation"
          icon={Zap}
          color="text-primary"
          items={[
            { icon: FileText, label: "→ Article", description: "Full article format" },
            { icon: Twitter, label: "→ Twitter Thread", description: "Thread of tweets" },
            { icon: Video, label: "→ Script", description: "Video/podcast script" },
            { icon: Presentation, label: "→ Course Slide", description: "Teaching material" },
          ]}
          defaultOpen={false}
        />

        <CollapsibleSection
          title="Graph Analysis"
          icon={Network}
          color="text-graph-highlight"
          items={[
            { icon: Network, label: "Related Neurons", description: "Similar content" },
            { icon: Radar, label: "Idea Clusters", description: "Thematic groupings" },
            { icon: TrendingUp, label: "Influence Score", description: "Impact measurement" },
          ]}
          defaultOpen={false}
        />
      </div>

      {/* Metadata footer */}
      <div className="px-3 py-2 border-t border-border bg-panel-header">
        <div className="grid grid-cols-2 gap-y-1 text-[10px]">
          <span className="text-muted-foreground">Total Blocks</span>
          <span className="text-right font-medium">{blocks.length}</span>
          <span className="text-muted-foreground">Executable</span>
          <span className="text-right font-medium text-primary">{executableCount}</span>
          <span className="text-muted-foreground">Links</span>
          <span className="text-right font-medium">5</span>
          <span className="text-muted-foreground">Format Types</span>
          <span className="text-right font-medium">{new Set(blocks.map(b => b.type)).size}</span>
        </div>
      </div>
    </div>
  );
}
