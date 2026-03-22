/**
 * Agent Decision Engine — Proactive autonomous suggestions
 * Analyzes user context and suggests next best actions.
 */
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Suggestion {
  id: string;
  intent: string;
  label: string;
  description: string;
  priority: number;
  prompt: string;
  icon: string;
  category: "pipeline" | "knowledge" | "growth" | "maintenance";
}

interface UserContext {
  neuronCount: number;
  episodeCount: number;
  jobsCompleted: number;
  lastJobAt: string | null;
  creditBalance: number;
  entityCount: number;
  artifactCount: number;
  daysSinceLastActivity: number;
}

/**
 * Returns proactive, context-aware suggestions based on user's current state.
 */
export function useAgentDecisionEngine() {
  const { user } = useAuth();
  const [context, setContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadContext = async () => {
      setLoading(true);
      try {
        const [neurons, episodes, jobs, credits, entities, artifacts] = await Promise.all([
          supabase.from("neurons").select("id", { count: "exact", head: true }).eq("author_id", user.id),
          supabase.from("episodes").select("id", { count: "exact", head: true }).eq("author_id", user.id),
          supabase.from("neuron_jobs").select("id, created_at", { count: "exact" }).eq("author_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(1),
          supabase.from("user_credits").select("balance").eq("user_id", user.id).single(),
          supabase.from("entities").select("id", { count: "exact", head: true }),
          supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        ]);

        const lastJob = jobs.data?.[0]?.created_at;
        const daysSince = lastJob
          ? Math.floor((Date.now() - new Date(lastJob).getTime()) / 86400000)
          : 999;

        setContext({
          neuronCount: neurons.count || 0,
          episodeCount: episodes.count || 0,
          jobsCompleted: jobs.count || 0,
          lastJobAt: lastJob || null,
          creditBalance: credits.data?.balance || 0,
          entityCount: entities.count || 0,
          artifactCount: artifacts.count || 0,
          daysSinceLastActivity: daysSince,
        });
      } catch (e) {
        console.error("Decision engine context error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [user]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!context) return [];
    const s: Suggestion[] = [];

    // ─── Onboarding suggestions ───
    if (context.episodeCount === 0) {
      s.push({
        id: "first-upload",
        intent: "content_ingestion",
        label: "Upload your first content",
        description: "Paste a YouTube URL or upload audio to start extracting knowledge",
        priority: 100,
        prompt: "I want to upload and analyze my first podcast episode",
        icon: "🎙️",
        category: "pipeline",
      });
    }

    if (context.neuronCount === 0 && context.episodeCount > 0) {
      s.push({
        id: "first-extraction",
        intent: "knowledge_extraction",
        label: "Extract your first neurons",
        description: "Turn your transcripts into structured knowledge units",
        priority: 95,
        prompt: "Extract neurons from my latest transcript",
        icon: "🧠",
        category: "pipeline",
      });
    }

    // ─── Growth suggestions ───
    if (context.neuronCount > 5 && context.artifactCount === 0) {
      s.push({
        id: "first-artifact",
        intent: "content_generation",
        label: "Generate your first article",
        description: `You have ${context.neuronCount} neurons — create an article from them`,
        priority: 85,
        prompt: "Generate an article from my best neurons",
        icon: "✍️",
        category: "growth",
      });
    }

    if (context.neuronCount > 20 && context.entityCount < 10) {
      s.push({
        id: "build-graph",
        intent: "knowledge_graph",
        label: "Build your knowledge graph",
        description: "Connect your neurons into an intelligence network",
        priority: 80,
        prompt: "Map the knowledge graph from my neurons and show topic clusters",
        icon: "🕸️",
        category: "knowledge",
      });
    }

    if (context.neuronCount > 10) {
      s.push({
        id: "find-patterns",
        intent: "pattern_detection",
        label: "Discover hidden patterns",
        description: "AI will analyze your knowledge for recurring themes and frameworks",
        priority: 70,
        prompt: "Find patterns and recurring frameworks across all my neurons",
        icon: "🔍",
        category: "knowledge",
      });
    }

    // ─── Re-engagement ───
    if (context.daysSinceLastActivity > 7 && context.neuronCount > 0) {
      s.push({
        id: "re-engage",
        intent: "activity_prompt",
        label: "Continue where you left off",
        description: `It's been ${context.daysSinceLastActivity} days — your knowledge awaits`,
        priority: 90,
        prompt: "Show me a summary of my latest neurons and suggest what to do next",
        icon: "🚀",
        category: "maintenance",
      });
    }

    // ─── Maintenance suggestions ───
    if (context.creditBalance < 100 && context.creditBalance > 0) {
      s.push({
        id: "low-credits",
        intent: "credit_management",
        label: "Credits running low",
        description: `Only ${context.creditBalance} NEURONS left — top up to continue`,
        priority: 75,
        prompt: "Show my credit balance and recent spending",
        icon: "💰",
        category: "maintenance",
      });
    }

    if (context.neuronCount > 50) {
      s.push({
        id: "dedup-neurons",
        intent: "knowledge_maintenance",
        label: "Clean up duplicate neurons",
        description: "Find and merge similar neurons to improve quality",
        priority: 50,
        prompt: "Find duplicate or similar neurons and suggest merges",
        icon: "🧹",
        category: "maintenance",
      });
    }

    // ─── Advanced suggestions ───
    if (context.episodeCount > 3) {
      s.push({
        id: "cross-analysis",
        intent: "cross_reference",
        label: "Cross-reference your episodes",
        description: "Compare insights across multiple transcripts",
        priority: 60,
        prompt: "Compare and cross-reference ideas across my last 5 episodes",
        icon: "📊",
        category: "knowledge",
      });
    }

    if (context.neuronCount > 30) {
      s.push({
        id: "build-course",
        intent: "course_generation",
        label: "Create a mini-course",
        description: "Transform your expertise into a structured course",
        priority: 55,
        prompt: "Build a 5-module course from my knowledge on the most frequent topic",
        icon: "🎓",
        category: "growth",
      });
    }

    // Sort by priority descending
    return s.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [context]);

  return { suggestions, loading, context };
}
