/**
 * ContextActions — Smart quick-action chips that adapt to user context.
 * Shows relevant actions based on current state (neurons count, recent runs, etc.)
 */

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Globe, Sparkles, Network, Zap, Workflow,
  FileText, Target, TrendingUp, BookOpen, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ContextAction {
  id: string;
  icon: typeof Brain;
  label: string;
  prompt: string;
  color: string;
  condition?: boolean;
}

interface ContextActionsProps {
  neuronCount: number;
  episodeCount: number;
  lastIntent?: string;
  phase: string;
  onAction: (prompt: string) => void;
  onOpenPipeline?: () => void;
}

export function ContextActions({
  neuronCount, episodeCount, lastIntent, phase, onAction, onOpenPipeline,
}: ContextActionsProps) {
  const actions = useMemo<ContextAction[]>(() => {
    const all: ContextAction[] = [];

    // Always available
    all.push({
      id: "analyze",
      icon: Globe,
      label: "Analyze",
      prompt: "/analyze ",
      color: "text-semantic-blue border-semantic-blue/20 hover:bg-semantic-blue/5",
    });

    // If user has episodes but few neurons → suggest extraction
    if (episodeCount > 0 && neuronCount < episodeCount * 10) {
      all.push({
        id: "extract",
        icon: Brain,
        label: "Extract Neurons",
        prompt: "/extract neurons from my latest episode",
        color: "text-semantic-purple border-semantic-purple/20 hover:bg-semantic-purple/5",
      });
    }

    // If user has neurons → suggest generation
    if (neuronCount > 5) {
      all.push({
        id: "generate",
        icon: Sparkles,
        label: "Generate",
        prompt: "/generate ",
        color: "text-semantic-rose border-semantic-rose/20 hover:bg-semantic-rose/5",
      });
    }

    // If user has neurons → suggest search
    if (neuronCount > 0) {
      all.push({
        id: "search",
        icon: Network,
        label: "Search",
        prompt: "/search ",
        color: "text-semantic-emerald border-semantic-emerald/20 hover:bg-semantic-emerald/5",
      });
    }

    // Post-analysis → suggest extraction
    if (lastIntent === "analyze") {
      all.push({
        id: "post-extract",
        icon: Brain,
        label: "Extract from analysis",
        prompt: "/extract neurons from the analysis above",
        color: "text-semantic-purple border-semantic-purple/20 hover:bg-semantic-purple/5",
      });
    }

    // Post-extraction → suggest generation
    if (lastIntent === "extract") {
      all.push({
        id: "post-generate",
        icon: FileText,
        label: "Generate from neurons",
        prompt: "/generate content pack from extracted neurons",
        color: "text-semantic-rose border-semantic-rose/20 hover:bg-semantic-rose/5",
      });
    }

    // If many neurons → suggest comparison
    if (neuronCount > 20) {
      all.push({
        id: "compare",
        icon: Layers,
        label: "Compare",
        prompt: "/compare ",
        color: "text-semantic-amber border-semantic-amber/20 hover:bg-semantic-amber/5",
      });
    }

    // Pipeline builder — always available as last action
    if (onOpenPipeline) {
      all.push({
        id: "pipeline",
        icon: Workflow,
        label: "Pipeline",
        prompt: "__PIPELINE__",
        color: "text-primary border-primary/20 hover:bg-primary/5",
      });
    }

    return all.slice(0, 6);
  }, [neuronCount, episodeCount, lastIntent, onOpenPipeline]);

  if (phase !== "idle" && phase !== "completed") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 px-3 pb-1 overflow-x-auto scrollbar-none"
    >
      <span className="text-nano text-muted-foreground/60 shrink-0 uppercase tracking-wider font-medium">Quick:</span>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => action.prompt === "__PIPELINE__" ? onOpenPipeline?.() : onAction(action.prompt)}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full border text-nano font-medium transition-all shrink-0",
            action.color,
          )}
        >
          <action.icon className="h-2.5 w-2.5" />
          {action.label}
        </button>
      ))}
    </motion.div>
  );
}
