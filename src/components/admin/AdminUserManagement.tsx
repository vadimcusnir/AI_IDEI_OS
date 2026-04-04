import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, UserPlus, UserMinus, Coins, PlusCircle, Ban, ShieldCheck,
  Eye, Loader2, Clock, Brain, Briefcase, FileText, ChevronLeft, ChevronRight,
  Pause, Play, KeyRound, Trash2, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES, type AppRole } from "@/hooks/useRoleGuard";

interface UserRow {
  user_id: string;
  email: string;
  balance: number;
  total_spent: number;
  total_earned: number;
  neuron_count: number;
  roles: string[];
  created_at?: string;
}

interface UserActivity {
  recent_jobs: { id: string; worker_type: string; status: string; created_at: string }[];
  recent_transactions: { id: string; amount: number; description: string; type: string; created_at: string }[];
  neuron_count: number;
  artifact_count: number;
  episode_count: number;
}

export function AdminUserManagement() {
  const { t } = useTranslation("common");
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [suspendedMap, setSuspendedMap] = useState<Record<string, boolean>>({});

  // Credit adjustment
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  const PAGE_SIZE = 25;

  useEffect(() => { loadUsers(); }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("admin_user_overview" as any);
    setUsers((data as UserRow[]) || []);

    // Load suspension status
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, is_suspended");
    const map: Record<string, boolean> = {};
    (profiles || []).forEach((p: any) => { map[p.user_id] = p.is_suspended; });
    setSuspendedMap(map);

    setLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    if (search) {
      const s = search.toLowerCase();
      if (!u.user_id.toLowerCase().includes(s) && !u.email?.toLowerCase().includes(s)) return false;
    }
    if (roleFilter !== "all") {
      if (roleFilter === "suspended") return suspendedMap[u.user_id];
      if (roleFilter === "no_role") return u.roles.length === 0;
      return u.roles.includes(roleFilter);
    }
    return true;
  });

  const paginatedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  const loadUserActivity = async (userId: string) => {
    setActivityLoading(true);
    const [jobsRes, txRes, neuronsRes, artifactsRes, episodesRes] = await Promise.all([
      supabase.from("neuron_jobs").select("id, worker_type, status, created_at").eq("author_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("credit_transactions").select("id, amount, description, type, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(15),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("author_id", userId),
      supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("author_id", userId),
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("author_id", userId),
    ]);
    setUserActivity({
      recent_jobs: (jobsRes.data || []) as any,
      recent_transactions: (txRes.data || []) as any,
      neuron_count: neuronsRes.count || 0,
      artifact_count: artifactsRes.count || 0,
      episode_count: episodesRes.count || 0,
    });
    setActivityLoading(false);
  };

  const openUserDetail = (user: UserRow) => {
    setSelectedUser(user);
    loadUserActivity(user.user_id);
  };

  const toggleUserRole = async (userId: string, role: string, hasRole: boolean) => {
    if (hasRole) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
      toast.success(`Role "${role}" revoked`);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      toast.success(`Role "${role}" granted`);
    }
    await auditAction("role_change", userId, `${hasRole ? "Revoked" : "Granted"} role: ${role}`);
    loadUsers();
  };

  const suspendUser = async (userId: string, email: string) => {
    await supabase.from("profiles").update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspended_by: (await supabase.auth.getUser()).data.user?.id,
    } as any).eq("user_id", userId);

    await supabase.from("abuse_events").insert({
      user_id: userId,
      abuse_type: "admin_suspend",
      severity: "high",
      action_taken: "account_suspended",
      details: { email },
    });

    await auditAction("suspend_user", userId, `Suspended user ${email}`);
    toast.success("User suspended");
    loadUsers();
  };

  const reactivateUser = async (userId: string, email: string) => {
    await supabase.from("profiles").update({
      is_suspended: false,
      suspended_at: null,
      suspended_by: null,
    } as any).eq("user_id", userId);

    await auditAction("reactivate_user", userId, `Reactivated user ${email}`);
    toast.success("User reactivated");
    loadUsers();
  };

  const resetPassword = async (userId: string, email: string) => {
    if (!email) { toast.error("No email for this user"); return; }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      await auditAction("password_reset", userId, `Password reset sent to ${email}`);
      toast.success(`Password reset email sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send reset email");
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    // Record in decision ledger before deletion
    await supabase.from("decision_ledger" as any).insert({
      actor_id: (await supabase.auth.getUser()).data.user?.id,
      action_type: "delete_user",
      target_type: "user",
      target_id: userId,
      description: `Deleted user ${email}`,
      severity: "critical",
    });

    // Delete user data (cascade should handle related records)
    await supabase.from("profiles").delete().eq("user_id", userId);
    await supabase.from("user_roles").delete().eq("user_id", userId);

    toast.success(`User ${email} deleted`);
    setSelectedUser(null);
    loadUsers();
  };

  const adjustCredits = async (userId: string) => {
    const amount = parseInt(adjustAmount);
    if (!amount || !adjustDescription.trim()) return;
    setAdjustLoading(true);

    const { error } = await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount,
      type: amount > 0 ? "admin_grant" : "admin_deduct",
      description: adjustDescription.trim(),
    });

    if (error) {
      toast.error(error.message);
    } else {
      await auditAction("credit_adjustment", userId, `${amount > 0 ? "Granted" : "Deducted"} ${Math.abs(amount)} credits: ${adjustDescription.trim()}`);
      toast.success(`Credits adjusted: ${amount > 0 ? "+" : ""}${amount}`);
      setAdjustAmount("");
      setAdjustDescription("");
      loadUsers();
      if (selectedUser) loadUserActivity(userId);
    }
    setAdjustLoading(false);
  };

  const auditAction = async (actionType: string, targetId: string, description: string) => {
    const { data: { user: admin } } = await supabase.auth.getUser();
    await supabase.from("compliance_log" as any).insert({
      actor_id: admin?.id,
      action_type: actionType,
      target_type: "user",
      target_id: targetId,
      description,
      severity: actionType.includes("delete") ? "critical" : "medium",
    });
  };

  return (
    <div>
      {/* Search & filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by email or ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All users</SelectItem>
            <SelectItem value="no_role" className="text-xs">No role</SelectItem>
            <SelectItem value="suspended" className="text-xs">Suspended</SelectItem>
            {ROLES.filter(r => r !== "user").map(r => (
              <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-micro">{filteredUsers.length} users</Badge>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-micro">User</TableHead>
              <TableHead className="text-micro">Status</TableHead>
              <TableHead className="text-micro">Roles</TableHead>
              <TableHead className="text-micro text-right">Neurons</TableHead>
              <TableHead className="text-micro text-right">Balance</TableHead>
              <TableHead className="text-micro w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedUsers.map((u) => {
              const isSuspended = suspendedMap[u.user_id];
              return (
                <TableRow key={u.user_id} className={cn("cursor-pointer hover:bg-muted/50", isSuspended && "opacity-60")} onClick={() => openUserDetail(u)}>
                  <TableCell>
                    <p className="text-xs font-medium">{u.email || "—"}</p>
                    <p className="text-nano font-mono text-muted-foreground">{u.user_id.substring(0, 8)}…</p>
                  </TableCell>
                  <TableCell>
                    {isSuspended ? (
                      <Badge variant="destructive" className="text-nano">Suspended</Badge>
                    ) : (
                      <Badge variant="outline" className="text-nano text-status-validated">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.length === 0 && <span className="text-nano bg-muted px-1.5 py-0.5 rounded text-muted-foreground">user</span>}
                      {u.roles.map((r) => (
                        <span key={r} className={cn(
                          "text-nano px-1.5 py-0.5 rounded font-mono",
                          r === "admin" ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
                        )}>{r}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">{u.neuron_count}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{u.balance}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openUserDetail(u)} title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {/* Suspend / Reactivate */}
                      {isSuspended ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Reactivate"
                          onClick={() => reactivateUser(u.user_id, u.email)}>
                          <Play className="h-3.5 w-3.5 text-status-validated" />
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Suspend">
                              <Pause className="h-3.5 w-3.5 text-amber-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Suspend User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will suspend {u.email || u.user_id.substring(0, 8)}. They won't be able to use the platform until reactivated.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => suspendUser(u.user_id, u.email)}>
                                Suspend
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {/* Reset password */}
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Reset password"
                        onClick={() => resetPassword(u.user_id, u.email)}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />Back
          </Button>
          <span className="text-micro text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Next<ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="text-sm">User Detail</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                {/* User info */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                  <p className="text-micro text-muted-foreground font-mono">{selectedUser.user_id}</p>
                  {selectedUser.email && <p className="text-xs font-medium">{selectedUser.email}</p>}
                  <div className="flex gap-1 items-center">
                    {suspendedMap[selectedUser.user_id] && (
                      <Badge variant="destructive" className="text-nano">Suspended</Badge>
                    )}
                    {selectedUser.roles.length === 0 && <Badge variant="outline" className="text-nano">user</Badge>}
                    {selectedUser.roles.map((r) => (
                      <Badge key={r} variant={r === "admin" ? "destructive" : "default"} className="text-nano">{r}</Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                {activityLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}</div>
                ) : userActivity && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-card border text-center">
                        <Brain className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                        <p className="text-sm font-bold">{userActivity.neuron_count}</p>
                        <p className="text-nano text-muted-foreground">Neurons</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border text-center">
                        <FileText className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                        <p className="text-sm font-bold">{userActivity.artifact_count}</p>
                        <p className="text-nano text-muted-foreground">Artifacts</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border text-center">
                        <Briefcase className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                        <p className="text-sm font-bold">{userActivity.episode_count}</p>
                        <p className="text-nano text-muted-foreground">Episodes</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-primary/5">
                        <p className="text-sm font-bold text-primary">{selectedUser.balance}</p>
                        <p className="text-nano text-muted-foreground">Balance</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-sm font-bold">{selectedUser.total_spent}</p>
                        <p className="text-nano text-muted-foreground">Spent</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-sm font-bold">{selectedUser.total_earned}</p>
                        <p className="text-nano text-muted-foreground">Earned</p>
                      </div>
                    </div>

                    {/* Credit adjustment */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                      <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wider">Adjust Credits</p>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Amount" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="h-7 text-xs w-24" />
                        <Input placeholder="Reason" value={adjustDescription} onChange={(e) => setAdjustDescription(e.target.value)} className="h-7 text-xs flex-1" />
                        <Button size="sm" className="h-7 text-xs" disabled={adjustLoading || !adjustAmount || !adjustDescription.trim()} onClick={() => adjustCredits(selectedUser.user_id)}>
                          {adjustLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Actions grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Suspend/Reactivate */}
                      {suspendedMap[selectedUser.user_id] ? (
                        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => reactivateUser(selectedUser.user_id, selectedUser.email)}>
                          <Play className="h-3.5 w-3.5 text-status-validated" /> Reactivate
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => suspendUser(selectedUser.user_id, selectedUser.email)}>
                          <Pause className="h-3.5 w-3.5 text-amber-500" /> Suspend
                        </Button>
                      )}
                      {/* Reset password */}
                      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => resetPassword(selectedUser.user_id, selectedUser.email)}>
                        <KeyRound className="h-3.5 w-3.5" /> Reset Password
                      </Button>
                      {/* Toggle admin */}
                      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => toggleUserRole(selectedUser.user_id, "admin", selectedUser.roles.includes("admin"))}>
                        {selectedUser.roles.includes("admin") ? (
                          <><UserMinus className="h-3.5 w-3.5 text-destructive" /> Revoke Admin</>
                        ) : (
                          <><ShieldCheck className="h-3.5 w-3.5" /> Grant Admin</>
                        )}
                      </Button>
                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs gap-1 text-destructive border-destructive/30">
                            <Trash2 className="h-3.5 w-3.5" /> Delete User
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive">Delete User Permanently?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {selectedUser.email}. This action cannot be undone. All data will be lost.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteUser(selectedUser.user_id, selectedUser.email)}>
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Recent transactions */}
                    <div>
                      <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Transactions</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {userActivity.recent_transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-micro">
                            <span className={cn("font-mono font-bold", tx.amount > 0 ? "text-status-validated" : "text-destructive")}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount}
                            </span>
                            <span className="flex-1 truncate text-muted-foreground">{tx.description}</span>
                            <span className="text-muted-foreground shrink-0">
                              {format(new Date(tx.created_at), "dd MMM HH:mm")}
                            </span>
                          </div>
                        ))}
                        {userActivity.recent_transactions.length === 0 && (
                          <p className="text-micro text-muted-foreground text-center py-2">No transactions</p>
                        )}
                      </div>
                    </div>

                    {/* Recent jobs */}
                    <div>
                      <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Jobs</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {userActivity.recent_jobs.map((job) => (
                          <div key={job.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-micro">
                            <Badge variant="outline" className={cn(
                              "text-nano px-1 py-0",
                              job.status === "completed" ? "text-status-validated" : job.status === "failed" ? "text-destructive" : "text-muted-foreground"
                            )}>{job.status}</Badge>
                            <span className="flex-1 truncate font-mono">{job.worker_type}</span>
                            <span className="text-muted-foreground shrink-0">
                              {format(new Date(job.created_at), "dd MMM HH:mm")}
                            </span>
                          </div>
                        ))}
                        {userActivity.recent_jobs.length === 0 && (
                          <p className="text-micro text-muted-foreground text-center py-2">No jobs</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
