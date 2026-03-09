import { useState, useMemo } from "react";
import {
  Sparkles, Brain, Lightbulb, MessageSquareQuote, Target,
  BookOpen,
  FileText, Twitter, Video, Presentation,
  Network, Radar, TrendingUp,
  ChevronRight, ChevronDown, Loader2, Zap,
  Code, Bug, TestTube, Gauge,
  Play, Settings2, Calendar,
  FileCode, Braces
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Block, BLOCK_TYPE_CONFIG } from "./types";
import { AIToolButton } from "./right-panel/AIToolButton";
import { CollapsibleSection } from "./right-panel/CollapsibleSection";
import { ScorePanel } from "./right-panel/ScorePanel";

interface NeuronRightPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  neuronScore: number;
  blocks: Block[];
  neuronId?: number;
  onAIAction?: (action: string, blockIds?: string[]) => void;
}

export function NeuronRightPanel({ isCollapsed, onToggle, neuronScore, blocks, neuronId, onAIAction }: NeuronRightPanelProps) {
  const executableCount = blocks.filter(b => BLOCK_TYPE_CONFIG[b.type].executable).length;
  const formatStats = useMemo(() => ({
    code: blocks.filter(b => b.type === "code").length,
    yaml: blocks.filter(b => b.type === "yaml").length,
    prompts: blocks.filter(b => b.type === "prompt").length,
    data: blocks.filter(b => b.type === "dataset" || b.type === "json").length,
  }), [blocks]);

  const handleAIAction = (action: string) => {
    onAIAction?.(action);
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
      <ScorePanel neuronScore={neuronScore} formatStats={formatStats} />

      {/* AI Sections */}
      <div className="flex-1 overflow-y-auto">
        <CollapsibleSection
          title="AI Extraction"
          icon={Sparkles}
          color="text-ai-accent"
          items={[
            { icon: Brain, label: "Extract Insights", description: "Key takeaways from content", action: "extract_insights" },
            { icon: BookOpen, label: "Extract Frameworks", description: "Structured mental models", action: "extract_frameworks" },
            { icon: MessageSquareQuote, label: "Extract Questions", description: "Questions this raises", action: "extract_questions" },
            { icon: Target, label: "Extract Quotes", description: "Quotable statements", action: "extract_quotes" },
            { icon: Lightbulb, label: "Extract Prompts", description: "Auto-generate prompts", action: "extract_prompts" },
          ]}
          onAction={handleAIAction}
        />

        <CollapsibleSection
          title="Code Tools"
          icon={Code}
          color="text-status-validated"
          items={[
            { icon: Bug, label: "Debug Code", description: "Find and fix errors", action: "debug_code" },
            { icon: Gauge, label: "Optimize Code", description: "Performance improvements", action: "optimize_code" },
            { icon: TestTube, label: "Generate Tests", description: "Auto-create test cases", action: "generate_tests" },
            { icon: FileCode, label: "Explain Code", description: "Line-by-line explanation", action: "explain_code" },
          ]}
          onAction={handleAIAction}
          defaultOpen={false}
        />

        <CollapsibleSection
          title="Pipeline Execution"
          icon={Play}
          color="text-primary"
          items={[
            { icon: Play, label: "Run Pipeline", description: "Execute YAML pipeline", action: "run_pipeline" },
            { icon: Settings2, label: "Simulate", description: "Dry-run without side effects", action: "simulate" },
            { icon: Calendar, label: "Schedule", description: "Set automated execution", action: "schedule" },
            { icon: Braces, label: "Validate Schema", description: "Check data structures", action: "validate_schema" },
          ]}
          onAction={handleAIAction}
          defaultOpen={false}
        />

        <CollapsibleSection
          title="AI Transformation"
          icon={Zap}
          color="text-primary"
          items={[
            { icon: FileText, label: "→ Article", description: "Full article format", action: "transform_article" },
            { icon: Twitter, label: "→ Twitter Thread", description: "Thread of tweets", action: "transform_twitter" },
            { icon: Video, label: "→ Script", description: "Video/podcast script", action: "transform_script" },
            { icon: Presentation, label: "→ Course Slide", description: "Teaching material", action: "transform_slide" },
          ]}
          onAction={handleAIAction}
          defaultOpen={false}
        />

        <CollapsibleSection
          title="Graph Analysis"
          icon={Network}
          color="text-graph-highlight"
          items={[
            { icon: Network, label: "Related Neurons", description: "Similar content", action: "find_related" },
            { icon: Radar, label: "Idea Clusters", description: "Thematic groupings", action: "idea_clusters" },
            { icon: TrendingUp, label: "Influence Score", description: "Impact measurement", action: "influence_score" },
          ]}
          onAction={handleAIAction}
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
          <span className="text-muted-foreground">Format Types</span>
          <span className="text-right font-medium">{new Set(blocks.map(b => b.type)).size}</span>
        </div>
      </div>
    </div>
  );
}
