import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["user-role-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      return !!data;
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 min — deduplicate across components
    gcTime: 10 * 60 * 1000,
  });

  return { isAdmin, loading: authLoading || isLoading, user };
}
