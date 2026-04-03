/**
 * useRoleGuard — RBAC enforcement hook.
 * Checks if the current user has a required role before rendering protected content.
 * Uses the existing `has_role` RPC (security definer).
 *
 * Usage:
 *   const { allowed, loading } = useRoleGuard("admin");
 *   if (loading) return <Skeleton />;
 *   if (!allowed) return <Navigate to="/home" />;
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "moderator" | "user";

interface RoleGuardResult {
  allowed: boolean;
  loading: boolean;
  role: AppRole | null;
}

export function useRoleGuard(requiredRole: AppRole): RoleGuardResult {
  const { user, loading: authLoading } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      // Role hierarchy: admin > moderator > user
      const hierarchy: AppRole[] = ["admin", "moderator", "user"];
      const requiredIndex = hierarchy.indexOf(requiredRole);

      // Check from highest privilege down
      for (let i = 0; i <= requiredIndex; i++) {
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: hierarchy[i],
        });
        if (data) {
          setRole(hierarchy[i]);
          setAllowed(true);
          setLoading(false);
          return;
        }
      }

      setAllowed(false);
      setLoading(false);
    };

    check();
  }, [user, authLoading, requiredRole]);

  return { allowed, loading, role };
}

/**
 * useUserRoles — Returns all roles for the current user.
 */
export function useUserRoles(): { roles: AppRole[]; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const check = async () => {
      const found: AppRole[] = [];
      const allRoles: AppRole[] = ["admin", "moderator", "user"];

      const results = await Promise.all(
        allRoles.map(r => supabase.rpc("has_role", { _user_id: user.id, _role: r }))
      );

      results.forEach((res, i) => {
        if (res.data) found.push(allRoles[i]);
      });

      setRoles(found);
      setLoading(false);
    };

    check();
  }, [user, authLoading]);

  return { roles, loading };
}
