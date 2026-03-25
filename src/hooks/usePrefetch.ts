import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Prefetch common queries on hover/focus to improve perceived performance.
 * Usage: const { prefetchServices, prefetchCredits } = usePrefetch();
 *        <Link onMouseEnter={prefetchServices} ...>
 */
export function usePrefetch() {
  const qc = useQueryClient();

  const prefetchServices = useCallback(() => {
    qc.prefetchQuery({
      queryKey: ["services-catalog"],
      queryFn: async () => {
        const { data } = await supabase
          .from("service_catalog")
          .select("*")
          .eq("is_active", true)
          .order("name");
        return data ?? [];
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [qc]);

  const prefetchCredits = useCallback(() => {
    qc.prefetchQuery({
      queryKey: ["user-credits"],
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data } = await supabase
          .from("user_credits")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        return data;
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [qc]);

  const prefetchLibrary = useCallback(() => {
    qc.prefetchQuery({
      queryKey: ["library-artifacts"],
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data } = await supabase
          .from("artifacts")
          .select("id, title, artifact_type, status, created_at, format")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        return data ?? [];
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [qc]);

  return { prefetchServices, prefetchCredits, prefetchLibrary };
}
