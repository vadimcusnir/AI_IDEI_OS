/**
 * AdminPermissionsTab — RBAC Permissions Matrix UI.
 * Displays roles × permissions matrix, allows adding/removing roles from users.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Search, Shield, UserPlus, Loader2, RefreshCw, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ROLES, PERMISSIONS, type AppRole, type PermissionKey } from "@/hooks/useRoleGuard";

interface RbacRow {
  role: string;
  permission_key: string;
}

interface UserWithRoles {
  user_id: string;
  email: string;
  roles: string[];
}

const PERMISSION_LABELS: Record<string, string> = {
  manage_users: "Manage Users",
  manage_credits: "Manage Credits",
  manage_roles: "Manage Roles",
  manage_services: "Manage Services",
  manage_jobs: "Manage Jobs",
  view_logs: "View Logs",
  view_analytics: "View Analytics",
  view_users: "View Users",
  view_jobs: "View Jobs",
  view_incidents: "View Incidents",
  manage_incidents: "Manage Incidents",
  kill_switch: "Kill Switch",
};

const ASSIGNABLE_ROLES = ROLES.filter((r) => r !== "user");

export function AdminPermissionsTab() {
  const [matrix, setMatrix] = useState<RbacRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);

  const allPermissions = Object.keys(PERMISSION_LABELS);

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rbac_permissions")
      .select("role, permission_key");
    setMatrix((data as RbacRow[]) || []);
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.rpc("admin_user_overview" as any);
    setUsers(
      ((data as any[]) || []).map((u: any) => ({
        user_id: u.user_id,
        email: u.email || "",
        roles: u.roles || [],
      }))
    );
  }, []);

  useEffect(() => {
    loadMatrix();
    loadUsers();
  }, [loadMatrix, loadUsers]);

  const hasPermission = (role: string, perm: string) =>
    matrix.some((r) => r.role === role && r.permission_key === perm);

  const togglePermission = async (role: string, perm: string) => {
    const has = hasPermission(role, perm);
    if (has) {
      await supabase
        .from("rbac_permissions")
        .delete()
        .eq("role", role as any)
        .eq("permission_key", perm);
      setMatrix((prev) => prev.filter((r) => !(r.role === role && r.permission_key === perm)));
    } else {
      await supabase.from("rbac_permissions").insert({ role: role as any, permission_key: perm });
      setMatrix((prev) => [...prev, { role, permission_key: perm }]);
    }
    toast.success(`${has ? "Removed" : "Added"} ${perm} for ${role}`);
  };

  const openRoleSheet = (user: UserWithRoles) => {
    setSelectedUser(user);
    setSelectedRoles([...user.roles]);
    setRoleSheetOpen(true);
  };

  const saveUserRoles = async () => {
    if (!selectedUser) return;
    setSaving(true);

    // Remove all current roles
    await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);

    // Insert new roles
    if (selectedRoles.length > 0) {
      await supabase.from("user_roles").insert(
        selectedRoles.map((role) => ({
          user_id: selectedUser.user_id,
          role: role as any,
        }))
      );
    }

    // Audit
    const { data: { user: admin } } = await supabase.auth.getUser();
    await supabase.from("compliance_log" as any).insert({
      actor_id: admin?.id,
      action_type: "role_change",
      target_type: "user",
      target_id: selectedUser.user_id,
      description: `Roles set to: ${selectedRoles.join(", ") || "none"}`,
      severity: "medium",
    });

    toast.success("Roles updated");
    setSaving(false);
    setRoleSheetOpen(false);
    loadUsers();
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return u.email.toLowerCase().includes(s) || u.user_id.toLowerCase().includes(s);
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* ── Permission Matrix ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Permission Matrix</h3>
          <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto" onClick={loadMatrix}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro sticky left-0 bg-card z-10 min-w-[100px]">Permission</TableHead>
                {ASSIGNABLE_ROLES.map((role) => (
                  <TableHead key={role} className="text-micro text-center min-w-[80px]">
                    <Badge variant={role === "admin" ? "destructive" : "outline"} className="text-nano">
                      {role}
                    </Badge>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPermissions.map((perm) => (
                <TableRow key={perm}>
                  <TableCell className="text-xs font-medium sticky left-0 bg-card z-10">
                    {PERMISSION_LABELS[perm]}
                  </TableCell>
                  {ASSIGNABLE_ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      <Checkbox
                        checked={hasPermission(role, perm)}
                        onCheckedChange={() => togglePermission(role, perm)}
                        className="mx-auto"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── User Role Assignment ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">User Roles</h3>
        </div>
        <div className="relative max-w-xs mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by email or ID…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">User</TableHead>
                <TableHead className="text-micro">Current Roles</TableHead>
                <TableHead className="text-micro w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.slice(0, 50).map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell>
                    <p className="text-xs">{u.email || "—"}</p>
                    <p className="text-nano font-mono text-muted-foreground">{u.user_id.substring(0, 8)}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.length === 0 && (
                        <span className="text-nano bg-muted px-1.5 py-0.5 rounded text-muted-foreground">user</span>
                      )}
                      {u.roles.map((r) => (
                        <Badge
                          key={r}
                          variant={r === "admin" ? "destructive" : "outline"}
                          className="text-nano"
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => openRoleSheet(u)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Role Edit Sheet ── */}
      <Sheet open={roleSheetOpen} onOpenChange={setRoleSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="text-sm">Edit Roles</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-medium">{selectedUser.email}</p>
                  <p className="text-nano font-mono text-muted-foreground">{selectedUser.user_id}</p>
                </div>

                <div className="space-y-2">
                  {ASSIGNABLE_ROLES.map((role) => (
                    <label
                      key={role}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedRoles.includes(role) ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          setSelectedRoles((prev) =>
                            checked ? [...prev, role] : prev.filter((r) => r !== role)
                          );
                        }}
                      />
                      <div>
                        <p className="text-xs font-medium capitalize">{role}</p>
                        <p className="text-nano text-muted-foreground">
                          {role === "admin" && "Full access to all features"}
                          {role === "finops" && "Manage credits, analytics, logs"}
                          {role === "support" && "View users, manage jobs"}
                          {role === "security" && "View logs, manage incidents"}
                          {role === "reader" && "Read-only access to users, analytics, jobs"}
                          {role === "moderator" && "Content moderation"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <Button className="w-full gap-2" onClick={saveUserRoles} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Roles
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
