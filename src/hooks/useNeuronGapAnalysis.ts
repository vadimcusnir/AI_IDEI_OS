/**
 * useNeuronGapAnalysis — Analyzes user's neurons to detect knowledge gaps.
 * Compares extracted neuron coverage against expected dimensions,
 * then suggests completion services.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

/** Expected knowledge dimensions for a complete profile */
const EXPECTED_DIMENSIONS = [
  { key: "prompts", label: "Prompts", expectedMin: 10 },
  { key: "instructions", label: "Instructions", expectedMin: 15 },
  { key: "frameworks", label: "Frameworks", expectedMin: 5 },
  { key: "templates", label: "Templates", expectedMin: 5 },
  { key: "strategies", label: "Strategies", expectedMin: 3 },
  { key: "processes", label: "Processes", expectedMin: 3 },
  { key: "formulas", label: "Formulas", expectedMin: 2 },
  { key: "scripts", label: "Scripts", expectedMin: 2 },
] as const;

export interface KnowledgeGap {
  dimension: string;
  label: string;
  current: number;
  expected: number;
  completionPct: number;
  severity: "critical" | "moderate" | "low";
}

export interface CompletionOffer {
  id: string;
  title: string;
  description: string;
  level: 1 | 2 | 3 | 4 | 5;
  levelLabel: string;
  estimatedCost: number;
  anchoredGap: string;
}

export interface NeuronGapResult {
  gaps: KnowledgeGap[];
  overallCompletionPct: number;
  totalNeurons: number;
  offers: CompletionOffer[];
  loading: boolean;
}

const COMPLETION_LEVELS: Omit<CompletionOffer, "id" | "anchoredGap">[] = [
  { title: "Fragment Completion", description: "Complete missing knowledge fragments", level: 1, levelLabel: "L1 — Fragment", estimatedCost: 500 },
  { title: "Structured System Delivery", description: "Organize extracted knowledge into coherent systems", level: 2, levelLabel: "L2 — System", estimatedCost: 2000 },
  { title: "Automation Conversion", description: "Convert knowledge systems into automated workflows", level: 3, levelLabel: "L3 — Automation", estimatedCost: 5000 },
  { title: "Expert Agent Conversion", description: "Build an AI agent from your knowledge base", level: 4, levelLabel: "L4 — Agent", estimatedCost: 10000 },
  { title: "Monitoring & Operationalization", description: "Full operational deployment with monitoring", level: 5, levelLabel: "L5 — Operations", estimatedCost: 20000 },
];

export function useNeuronGapAnalysis(): NeuronGapResult {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: ["neuron-gap-analysis", user?.id, currentWorkspace?.id],
    queryFn: async () => {
      if (!user || !currentWorkspace) return null;

      // Get neuron count by content_category
      const { data: neurons } = await supabase
        .from("neurons")
        .select("id, content_category")
        .eq("workspace_id", currentWorkspace.id);

      if (!neurons) return null;

      // Count by category
      const categoryCounts = new Map<string, number>();
      for (const n of neurons) {
        const cat = (n.content_category || "uncategorized").toLowerCase();
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
      }

      // Detect gaps
      const gaps: KnowledgeGap[] = [];
      let totalExpected = 0;
      let totalCurrent = 0;

      for (const dim of EXPECTED_DIMENSIONS) {
        const current = categoryCounts.get(dim.key) || 0;
        const pct = Math.min(Math.round((current / dim.expectedMin) * 100), 100);
        totalExpected += dim.expectedMin;
        totalCurrent += Math.min(current, dim.expectedMin);

        if (pct < 100) {
          gaps.push({
            dimension: dim.key,
            label: dim.label,
            current,
            expected: dim.expectedMin,
            completionPct: pct,
            severity: pct < 30 ? "critical" : pct < 70 ? "moderate" : "low",
          });
        }
      }

      gaps.sort((a, b) => a.completionPct - b.completionPct);

      // Generate offers anchored in real gaps
      const offers: CompletionOffer[] = [];
      const criticalGaps = gaps.filter(g => g.severity === "critical");
      const topGap = gaps[0];

      if (topGap) {
        // Always offer the first level based on the worst gap
        for (const level of COMPLETION_LEVELS) {
          if (level.level <= (criticalGaps.length >= 3 ? 3 : criticalGaps.length >= 1 ? 2 : 1)) {
            offers.push({
              ...level,
              id: `offer-${level.level}`,
              anchoredGap: topGap.label,
            });
          }
        }
      }

      return {
        gaps,
        overallCompletionPct: totalExpected > 0 ? Math.round((totalCurrent / totalExpected) * 100) : 0,
        totalNeurons: neurons.length,
        offers,
      };
    },
    enabled: !!user && !!currentWorkspace,
    staleTime: 10 * 60_000,
  });

  return {
    gaps: data?.gaps || [],
    overallCompletionPct: data?.overallCompletionPct || 0,
    totalNeurons: data?.totalNeurons || 0,
    offers: data?.offers || [],
    loading: isLoading,
  };
}
