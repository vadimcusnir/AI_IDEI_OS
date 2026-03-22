import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCapacityDashboard() {
  return useQuery({
    queryKey: ["capacity-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("capacity_dashboard_stats" as any);
      if (error) throw error;
      return data as {
        monthly_capacity: number;
        consumed: number;
        utilization: number;
        multiplier: number;
        queue_depth: number;
        avg_latency_ms: number;
        premium_only: boolean;
        dedup_clusters: number;
        avg_mpi: number;
        top_mpi: Array<{
          title: string;
          mpi_score: number;
          applicability_score: number;
          clarity_score: number;
          rarity_score: number;
        }>;
      };
    },
    refetchInterval: 30000,
  });
}

export function useDynamicPrice(basePrice: number) {
  return useQuery({
    queryKey: ["dynamic-price", basePrice],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.rpc("compute_dynamic_price" as any, {
        _base_price: basePrice,
        _user_id: user.id,
      });
      if (error) throw error;
      return data as {
        base_price: number;
        multiplier: number;
        tier: string;
        tier_modifier: number;
        final_price: number;
        utilization: number;
        premium_only: boolean;
      };
    },
    enabled: basePrice > 0,
  });
}
