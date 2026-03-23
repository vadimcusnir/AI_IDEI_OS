/**
 * Memory Intelligence Engine — captures, structures, and reuses user knowledge.
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface IntelligenceProfile {
  interests: string[];
  preferred_services: string[];
  content_style: string;
  spending_pattern: string;
  behavior_tags: string[];
  top_topics: string[];
  total_outputs: number;
  total_neurons: number;
  total_shares: number;
  lockin_score: number;
  compounding_level: number;
}

const DEFAULT_PROFILE: IntelligenceProfile = {
  interests: [],
  preferred_services: [],
  content_style: "neutral",
  spending_pattern: "conservative",
  behavior_tags: [],
  top_topics: [],
  total_outputs: 0,
  total_neurons: 0,
  total_shares: 0,
  lockin_score: 0,
  compounding_level: 1,
};

// ─── Compounding Level Labels ───
export const COMPOUND_LEVELS: Record<number, { label: string; description: string }> = {
  1: { label: "Seed", description: "Începi să construiești" },
  2: { label: "Sprout", description: "Primii neuroni creați" },
  3: { label: "Growth", description: "10+ neuroni — formezi un sistem" },
  4: { label: "Bloom", description: "50+ neuroni — gata pentru produse" },
  5: { label: "Compound", description: "100+ neuroni — asset-uri complete" },
};

export function useUserMemory() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<IntelligenceProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Load profile
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      const { data } = await (supabase
        .from("user_intelligence_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() as any);

      if (data) {
        setProfile({
          interests: data.interests || [],
          preferred_services: data.preferred_services || [],
          content_style: data.content_style || "neutral",
          spending_pattern: data.spending_pattern || "conservative",
          behavior_tags: data.behavior_tags || [],
          top_topics: data.top_topics || [],
          total_outputs: data.total_outputs || 0,
          total_neurons: data.total_neurons || 0,
          total_shares: data.total_shares || 0,
          lockin_score: data.lockin_score || 0,
          compounding_level: data.compounding_level || 1,
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // Capture a memory entry
  const captureMemory = useCallback(async (entry: {
    memory_type: string;
    category: string;
    title: string;
    content: string;
    source_type?: string;
    source_id?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!user) return;

    await (supabase.from("user_memory" as any).insert({
      user_id: user.id,
      ...entry,
    } as any) as any);
  }, [user]);

  // Recompute profile (calls the DB function)
  const recomputeProfile = useCallback(async () => {
    if (!user) return null;

    const { data, error } = await supabase.rpc("compute_user_intelligence" as any, {
      _user_id: user.id,
    });

    if (!error && data) {
      // Reload profile after computation
      const { data: updated } = await (supabase
        .from("user_intelligence_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() as any);

      if (updated) {
        setProfile({
          interests: updated.interests || [],
          preferred_services: updated.preferred_services || [],
          content_style: updated.content_style || "neutral",
          spending_pattern: updated.spending_pattern || "conservative",
          behavior_tags: updated.behavior_tags || [],
          top_topics: updated.top_topics || [],
          total_outputs: updated.total_outputs || 0,
          total_neurons: updated.total_neurons || 0,
          total_shares: updated.total_shares || 0,
          lockin_score: updated.lockin_score || 0,
          compounding_level: updated.compounding_level || 1,
        });
      }
    }

    return data;
  }, [user]);

  // Get smart suggestions based on profile
  const getSuggestions = useCallback(() => {
    const suggestions: Array<{ type: string; label: string; route: string; priority: number }> = [];

    // Based on compounding level
    if (profile.compounding_level >= 3 && profile.total_outputs >= 5) {
      suggestions.push({
        type: "marketplace",
        label: "Publică pe Marketplace",
        route: "/marketplace",
        priority: 90,
      });
    }

    // Based on preferred services — suggest complementary
    if (profile.preferred_services.includes("content-plan") && !profile.preferred_services.includes("social-media-posts")) {
      suggestions.push({
        type: "service",
        label: "Generează posturi social media",
        route: "/run/social-media-posts",
        priority: 85,
      });
    }

    // Based on neuron count — suggest extraction
    if (profile.total_neurons < 5) {
      suggestions.push({
        type: "action",
        label: "Extrage primii neuroni",
        route: "/extractor",
        priority: 95,
      });
    }

    // Based on spending pattern
    if (profile.spending_pattern === "heavy" && profile.lockin_score > 50) {
      suggestions.push({
        type: "upgrade",
        label: "Activează plan Pro",
        route: "/credits",
        priority: 80,
      });
    }

    // Sort by priority descending
    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }, [profile]);

  return {
    profile,
    loading,
    captureMemory,
    recomputeProfile,
    getSuggestions,
    compoundInfo: COMPOUND_LEVELS[profile.compounding_level] || COMPOUND_LEVELS[1],
  };
}
