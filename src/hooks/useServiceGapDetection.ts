/**
 * useServiceGapDetection — Detects which services the user hasn't tried yet,
 * and suggests upsells from L3 → L2 → L1 based on purchase history.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ServiceLevel } from "@/types/services";

export interface ServiceGap {
  service_id: string;
  service_name: string;
  service_slug: string;
  service_level: ServiceLevel;
  category: string;
  price_usd: number;
  internal_credit_cost: number;
  deliverable_type: string;
  reason: "not_tried" | "upgrade_available" | "complementary";
  related_purchase_slug?: string;
}

export interface UpsellSuggestion {
  from_level: ServiceLevel;
  to_level: ServiceLevel;
  from_slug: string;
  from_name: string;
  to_slug: string;
  to_name: string;
  to_price_usd: number;
  to_credit_cost: number;
  savings_pct: number;
}

interface GapDetectionResult {
  gaps: ServiceGap[];
  upsells: UpsellSuggestion[];
  completedCategories: string[];
  totalServicesAvailable: number;
  totalServicesUsed: number;
  explorationPct: number;
}

export function useServiceGapDetection() {
  const { user } = useAuth();

  return useQuery<GapDetectionResult>({
    queryKey: ["service-gap-detection", user?.id],
    queryFn: async () => {
      if (!user) return emptyResult();

      // Fetch user's purchase history
      const { data: purchases } = await supabase
        .from("service_purchases")
        .select("service_id, service_level, service_name")
        .eq("user_id", user.id)
        .eq("payment_status", "completed");

      const purchasedIds = new Set((purchases || []).map(p => p.service_id));
      const purchasedByLevel = new Map<string, Set<string>>();
      for (const p of purchases || []) {
        if (!purchasedByLevel.has(p.service_level)) purchasedByLevel.set(p.service_level, new Set());
        purchasedByLevel.get(p.service_level)!.add(p.service_id);
      }

      // Fetch all active services across levels
      const [l3Res, l2Res, l1Res] = await Promise.all([
        supabase.from("services_level_3_public" as any).select("id, service_name, service_slug, category, price_usd, deliverable_type").eq("status", "active").eq("visibility", "public"),
        supabase.from("services_level_2_public" as any).select("id, service_name, service_slug, category, price_usd, deliverable_type").eq("status", "active").eq("visibility", "public"),
        supabase.from("services_level_1_public" as any).select("id, service_name, service_slug, category, price_usd, deliverable_type").eq("status", "active").eq("visibility", "public"),
      ]);

      const l3Services = (l3Res.data || []) as any[];
      const l2Services = (l2Res.data || []) as any[];
      const l1Services = (l1Res.data || []) as any[];

      const totalAvailable = l3Services.length + l2Services.length + l1Services.length;

      // Find gaps (services not tried)
      const gaps: ServiceGap[] = [];
      const completedCategories = new Set<string>();

      for (const svc of l3Services) {
        if (purchasedIds.has(svc.id)) {
          completedCategories.add(svc.category);
        } else {
          gaps.push({
            service_id: svc.id,
            service_name: svc.service_name,
            service_slug: svc.service_slug,
            service_level: "L3",
            category: svc.category,
            price_usd: svc.price_usd,
            internal_credit_cost: svc.internal_credit_cost,
            deliverable_type: svc.deliverable_type,
            reason: "not_tried",
          });
        }
      }

      // Detect L3→L2 upsell opportunities
      const upsells: UpsellSuggestion[] = [];

      for (const l2 of l2Services) {
        const componentIds: string[] = l2.component_l3_ids || [];
        const usedComponents = componentIds.filter(id => purchasedIds.has(id));
        if (usedComponents.length >= 2 && !purchasedIds.has(l2.id)) {
          // User bought 2+ L3 components → suggest L2 pack
          const individualCost = l3Services
            .filter(s => componentIds.includes(s.id))
            .reduce((sum, s) => sum + s.internal_credit_cost, 0);
          const savings = individualCost > 0 ? Math.round((1 - l2.internal_credit_cost / individualCost) * 100) : 0;

          upsells.push({
            from_level: "L3",
            to_level: "L2",
            from_slug: "",
            from_name: `${usedComponents.length} services`,
            to_slug: l2.service_slug,
            to_name: l2.service_name,
            to_price_usd: l2.price_usd,
            to_credit_cost: l2.internal_credit_cost,
            savings_pct: Math.max(0, savings),
          });
        }
      }

      // Detect L2→L1 upsell opportunities
      for (const l1 of l1Services) {
        const componentIds: string[] = l1.component_l2_ids || [];
        const usedComponents = componentIds.filter(id => purchasedIds.has(id));
        if (usedComponents.length >= 1 && !purchasedIds.has(l1.id)) {
          const individualCost = l2Services
            .filter(s => componentIds.includes(s.id))
            .reduce((sum, s) => sum + s.internal_credit_cost, 0);
          const savings = individualCost > 0 ? Math.round((1 - l1.internal_credit_cost / individualCost) * 100) : 0;

          upsells.push({
            from_level: "L2",
            to_level: "L1",
            from_slug: "",
            from_name: `${usedComponents.length} packs`,
            to_slug: l1.service_slug,
            to_name: l1.service_name,
            to_price_usd: l1.price_usd,
            to_credit_cost: l1.internal_credit_cost,
            savings_pct: Math.max(0, savings),
          });
        }
      }

      // Add complementary suggestions (same category, different services)
      for (const svc of [...l3Services, ...l2Services]) {
        if (!purchasedIds.has(svc.id) && completedCategories.has(svc.category)) {
          const existing = gaps.find(g => g.service_id === svc.id);
          if (existing) existing.reason = "complementary";
        }
      }

      return {
        gaps: gaps.slice(0, 10), // Top 10 gaps
        upsells: upsells.sort((a, b) => b.savings_pct - a.savings_pct).slice(0, 5),
        completedCategories: Array.from(completedCategories),
        totalServicesAvailable: totalAvailable,
        totalServicesUsed: purchasedIds.size,
        explorationPct: totalAvailable > 0 ? Math.round((purchasedIds.size / totalAvailable) * 100) : 0,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}

function emptyResult(): GapDetectionResult {
  return { gaps: [], upsells: [], completedCategories: [], totalServicesAvailable: 0, totalServicesUsed: 0, explorationPct: 0 };
}
