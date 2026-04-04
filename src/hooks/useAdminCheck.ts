import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        setIsAdmin(!!data);
      } catch (err) {
        console.warn("[useAdminCheck] Failed to check role:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user, authLoading]);

  return { isAdmin, loading, user };
}
