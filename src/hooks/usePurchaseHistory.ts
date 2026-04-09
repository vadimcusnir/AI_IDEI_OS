/**
 * usePurchaseHistory — Fetches user's service purchases with spending analytics.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Purchase {
  id: string;
  service_id: string;
  service_level: string;
  service_name: string;
  price_usd_snapshot: number;
  neuroni_cost_snapshot: number;
  payment_method: string;
  payment_status: string;
  execution_status: string;
  execution_started_at: string | null;
  execution_completed_at: string | null;
  created_at: string;
}

export interface SpendingStats {
  totalSpent: number;
  totalPurchases: number;
  byLevel: Record<string, { count: number; spent: number }>;
  byMonth: { month: string; spent: number; count: number }[];
}

export function usePurchaseHistory(limit = 100) {
  const { user } = useAuth();

  return useQuery<{ purchases: Purchase[]; stats: SpendingStats }>({
    queryKey: ["purchase-history", user?.id, limit],
    queryFn: async () => {
      if (!user) return { purchases: [], stats: emptyStats() };

      const { data, error } = await supabase
        .from("service_purchases")
        .select("id, service_id, service_level, service_name, price_usd_snapshot, neuroni_cost_snapshot, payment_method, payment_status, execution_status, execution_started_at, execution_completed_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const purchases = (data as unknown as Purchase[]) || [];

      // Compute stats
      const byLevel: Record<string, { count: number; spent: number }> = {};
      const monthMap = new Map<string, { spent: number; count: number }>();
      let totalSpent = 0;

      for (const p of purchases) {
        if (p.payment_status !== "completed") continue;
        totalSpent += p.neuroni_cost_snapshot;

        // By level
        if (!byLevel[p.service_level]) byLevel[p.service_level] = { count: 0, spent: 0 };
        byLevel[p.service_level].count++;
        byLevel[p.service_level].spent += p.neuroni_cost_snapshot;

        // By month
        const month = p.created_at.slice(0, 7); // YYYY-MM
        const m = monthMap.get(month) || { spent: 0, count: 0 };
        m.spent += p.neuroni_cost_snapshot;
        m.count++;
        monthMap.set(month, m);
      }

      const byMonth = Array.from(monthMap.entries())
        .map(([month, v]) => ({ month, ...v }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      return {
        purchases,
        stats: {
          totalSpent,
          totalPurchases: purchases.filter(p => p.payment_status === "completed").length,
          byLevel,
          byMonth,
        },
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

function emptyStats(): SpendingStats {
  return { totalSpent: 0, totalPurchases: 0, byLevel: {}, byMonth: [] };
}
