import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SmartDefaults {
  preferredCategory: string | null;
  preferredServiceKeys: string[];
  preferredContentType: string | null;
  suggestedServices: string[];
}

/**
 * P2-008: Smart Defaults Engine
 * Analyzes user's past service runs to pre-select
 * services, categories, and options based on behavior patterns.
 */
export function useSmartDefaults(): SmartDefaults & { isLoading: boolean } {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["smart-defaults", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: runs } = await supabase
        .from("service_run_history")
        .select("service_key, status, created_at")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!runs || runs.length === 0) {
        return {
          preferredCategory: null,
          preferredServiceKeys: [],
          preferredContentType: null,
          suggestedServices: [],
        };
      }

      const freq: Record<string, number> = {};
      for (const r of runs) {
        freq[r.service_key] = (freq[r.service_key] || 0) + 1;
      }

      const sorted = Object.entries(freq).sort(([, a], [, b]) => b - a);
      const topKeys = sorted.slice(0, 5).map(([k]) => k);

      const categoryMap: Record<string, string> = {
        social: "attract", seo: "attract", blog: "attract",
        course: "educate", framework: "educate",
        copy: "sell", landing: "sell",
        analytics: "convert", strategy: "convert",
      };

      const categoryScore: Record<string, number> = {};
      for (const [key, count] of sorted) {
        for (const [pattern, cat] of Object.entries(categoryMap)) {
          if (key.toLowerCase().includes(pattern)) {
            categoryScore[cat] = (categoryScore[cat] || 0) + count;
          }
        }
      }

      const preferredCategory = Object.entries(categoryScore)
        .sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

      const contentTypePatterns: Record<string, string> = {
        transcript: "podcast", video: "video", text: "text", pdf: "document",
      };

      let contentType: string | null = null;
      for (const key of topKeys) {
        for (const [pattern, type] of Object.entries(contentTypePatterns)) {
          if (key.toLowerCase().includes(pattern)) {
            contentType = type;
            break;
          }
        }
        if (contentType) break;
      }

      const allUsed = new Set(sorted.map(([k]) => k));
      const complementary: Record<string, string[]> = {
        attract: ["seo_optimization", "social_media_pack", "newsletter_generator"],
        educate: ["course_builder", "framework_generator", "knowledge_summary"],
        sell: ["copywriting_pro", "landing_page", "sales_funnel"],
        convert: ["analytics_report", "strategy_generator", "ab_test_plan"],
      };

      const suggested = preferredCategory
        ? (complementary[preferredCategory] || []).filter(s => !allUsed.has(s))
        : [];

      return {
        preferredCategory,
        preferredServiceKeys: topKeys,
        preferredContentType: contentType,
        suggestedServices: suggested.slice(0, 3),
      };
    },
  });

  return {
    preferredCategory: data?.preferredCategory ?? null,
    preferredServiceKeys: data?.preferredServiceKeys ?? [],
    preferredContentType: data?.preferredContentType ?? null,
    suggestedServices: data?.suggestedServices ?? [],
    isLoading,
  };
}
