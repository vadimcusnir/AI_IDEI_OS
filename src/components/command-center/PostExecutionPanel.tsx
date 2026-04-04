/**
 * PostExecutionPanel — Memory Capital Loop
 * After each completed execution, suggests contextual next steps
 * to drive reuse, asset creation, and workflow persistence.
 *
 * This is the conversion engine: run → asset → template → monetization
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Save, Workflow, RotateCcw, ArrowRight,
  Brain, FileText, Target, Layers, Download,
  TrendingUp, Zap, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntentCategory } from "./CommandRouter";

interface Recommendation {
  id: string;
  icon: typeof Brain;
  label: string;
  description: string;
  action: string; // prompt to inject
  tier: "all" | "pro" | "vip";
  credits: number;
}

const INTENT_RECOMMENDATIONS: Record<string, Recommendation[]> = {
  analyze: [
    { id: "extract_from_analysis", icon: Brain, label: "Extract Neurons", description: "Convert analysis insights into reusable neurons", action: "/extract neurons from the analysis above", tier: "all", credits: 350 },
    { id: "generate_from_analysis", icon: FileText, label: "Generate Content", description: "Create articles from the analysis results", action: "/generate article based on the analysis", tier: "all", credits: 150 },
    { id: "profile_from_analysis", icon: Target, label: "Build Profile", description: "Create an intelligence profile from patterns found", action: "/profile build psychological profile from patterns", tier: "pro", credits: 500 },
  ],
  extract: [
    { id: "generate_from_neurons", icon: FileText, label: "Generate from Neurons", description: "Transform extracted neurons into content assets", action: "/generate content pack from extracted neurons", tier: "all", credits: 200 },
    { id: "compare_patterns", icon: Layers, label: "Find Contradictions", description: "Compare extracted patterns for contradictions", action: "/compare find contradictions in extracted patterns", tier: "pro", credits: 400 },
    { id: "build_course", icon: BookOpen, label: "Build Course", description: "Structure neurons into a course outline", action: "/generate course outline from neurons", tier: "pro", credits: 600 },
  ],
  generate: [
    { id: "refine_output", icon: Sparkles, label: "Refine Output", description: "Improve and polish the generated content", action: "Refine and improve the generated content above", tier: "all", credits: 100 },
    { id: "generate_variants", icon: TrendingUp, label: "Generate Variants", description: "Create alternative versions for A/B testing", action: "/generate 3 variants of the content above", tier: "all", credits: 200 },
    { id: "extract_framework", icon: Brain, label: "Extract Framework", description: "Extract the underlying framework from content", action: "/extract framework from the generated content", tier: "all", credits: 200 },
  ],
  search: [
    { id: "analyze_results", icon: Target, label: "Deep Analysis", description: "Analyze the search results in depth", action: "/analyze the search results above", tier: "all", credits: 200 },
    { id: "generate_from_search", icon: FileText, label: "Generate from Results", description: "Create content from found knowledge", action: "/generate article using the knowledge found above", tier: "all", credits: 150 },
  ],
  compare: [
    { id: "resolve_contradictions", icon: Zap, label: "Resolve Conflicts", description: "AI-assisted contradiction resolution", action: "Propose resolution for the contradictions found", tier: "pro", credits: 300 },
  ],
  profile: [
    { id: "generate_profile_page", icon: FileText, label: "Generate Public Page", description: "Create a publishable intelligence profile", action: "/generate public profile page from analysis", tier: "pro", credits: 400 },
  ],
  pipeline: [
    { id: "run_again", icon: RotateCcw, label: "Run Again", description: "Re-execute pipeline with same parameters", action: "/pipeline re-run last workflow", tier: "all", credits: 0 },
  ],
};

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  { id: "new_analysis", icon: Target, label: "Start New Analysis", description: "Analyze a new source", action: "/analyze ", tier: "all", credits: 200 },
  { id: "view_library", icon: BookOpen, label: "Browse Knowledge", description: "Explore your neuron library", action: "/search show all my neurons", tier: "all", credits: 20 },
];

interface PostExecutionPanelProps {
  intent: IntentCategory;
  creditsSpent: number;
  outputCount: number;
  onAction: (prompt: string) => void;
  onSaveTemplate: () => void;
  onDismiss: () => void;
  userTier: string;
}

export function PostExecutionPanel({
  intent, creditsSpent, outputCount, onAction, onSaveTemplate, onDismiss, userTier,
}: PostExecutionPanelProps) {
  const recommendations = [
    ...(INTENT_RECOMMENDATIONS[intent] || []),
    ...DEFAULT_RECOMMENDATIONS,
  ].filter(r => {
    if (r.tier === "all") return true;
    if (r.tier === "pro" && (userTier === "pro" || userTier === "vip")) return true;
    if (r.tier === "vip" && userTier === "vip") return true;
    return false;
  }).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Execution Complete</span>
          <Badge variant="secondary" className="text-nano h-4">
            {creditsSpent} N spent · {outputCount} outputs
          </Badge>
        </div>
        <button onClick={onDismiss} className="text-nano text-muted-foreground hover:text-foreground">
          Dismiss
        </button>
      </div>

      {/* Save as template CTA */}
      <div className="px-4 py-2 border-b border-border bg-primary/[0.02]">
        <button
          onClick={onSaveTemplate}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-primary/5 transition-colors text-left group"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Workflow className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-dense font-medium">Save as Reusable Workflow</p>
            <p className="text-nano text-muted-foreground">Turn this execution into a template for instant replay</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Recommendations */}
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-nano font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Suggested Next Steps
        </p>
        <div className="grid grid-cols-2 gap-2">
          {recommendations.map(rec => (
            <button
              key={rec.id}
              onClick={() => onAction(rec.action)}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/[0.02] transition-all text-left group"
            >
              <rec.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0 transition-colors" />
              <div className="min-w-0">
                <p className="text-micro font-medium truncate">{rec.label}</p>
                <p className="text-nano text-muted-foreground line-clamp-2">{rec.description}</p>
                {rec.credits > 0 && (
                  <span className="text-nano text-muted-foreground/60 mt-0.5 inline-block">~{rec.credits} N</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
