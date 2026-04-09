/**
 * useDeliverables — Fetches user's service deliverables with filtering.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Deliverable {
  id: string;
  purchase_id: string;
  service_id: string;
  service_level: string;
  deliverable_name: string;
  deliverable_type: string;
  content: string | null;
  format: string;
  classification_tags: string[];
  status: string;
  quality_score: number | null;
  generated_at: string | null;
  created_at: string;
}

interface UseDeliverablesOptions {
  status?: string;
  service_level?: string;
  limit?: number;
}

export function useDeliverables(options: UseDeliverablesOptions = {}) {
  const { user } = useAuth();
  const { status, service_level, limit = 50 } = options;

  return useQuery<Deliverable[]>({
    queryKey: ["deliverables", user?.id, status, service_level, limit],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("service_deliverables")
        .select("id, purchase_id, service_id, service_level, deliverable_name, deliverable_type, content, format, classification_tags, status, quality_score, generated_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) query = query.eq("status", status);
      if (service_level) query = query.eq("service_level", service_level);

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Deliverable[]) || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useDeliverable(id: string | undefined) {
  const { user } = useAuth();

  return useQuery<Deliverable | null>({
    queryKey: ["deliverable", id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from("service_deliverables")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Deliverable | null;
    },
    enabled: !!user && !!id,
  });
}
