/**
 * useRoleGuard — RBAC enforcement hook.
 * Supports both role-based checks (has_role) and permission-based checks (has_permission).
 *
 * Usage:
 *   const { allowed, loading } = useRoleGuard("admin");
 *   const { allowed } = usePermissionGuard("manage_credits");
 *   const { allowed } = usePermissionGuard(["manage_credits", "view_analytics"]);
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const ROLES = ["admin", "finops", "support", "security", "reader", "moderator", "user"] as const;
export type AppRole = (typeof ROLES)[number];

export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_CREDITS: "manage_credits",
  MANAGE_ROLES: "manage_roles",
  MANAGE_SERVICES: "manage_services",
  MANAGE_JOBS: "manage_jobs",
  VIEW_LOGS: "view_logs",
  VIEW_ANALYTICS: "view_analytics",
  VIEW_USERS: "view_users",
  VIEW_JOBS: "view_jobs",
  VIEW_INCIDENTS: "view_incidents",
  MANAGE_INCIDENTS: "manage_incidents",
  KILL_SWITCH: "kill_switch",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

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
      const hierarchy: AppRole[] = ["admin", "moderator", "user"];
      const requiredIndex = hierarchy.indexOf(requiredRole);

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
 * usePermissionGuard — Checks if user has specific permission(s).
 * Uses has_permission() DB function.
 */
export function usePermissionGuard(requiredPermissions: PermissionKey | PermissionKey[]) {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    try {
      const results = await Promise.all(
        perms.map((perm) =>
          supabase.rpc("has_permission", { _user_id: user.id, _permission: perm })
        )
      );
      setAllowed(results.some((r) => r.data === true));
    } catch {
      setAllowed(false);
    }
    setLoading(false);
  }, [user, requiredPermissions]);

  useEffect(() => {
    check();
  }, [check]);

  return { allowed, loading };
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
      const allRoles: AppRole[] = [...ROLES];

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
