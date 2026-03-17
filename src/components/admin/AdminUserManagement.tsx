import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, UserPlus, UserMinus, Coins, PlusCircle, Ban, ShieldCheck,
  Eye, Loader2, Clock, Brain, Briefcase, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

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
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

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
    setLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.user_id.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
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

  const toggleUserRole = async (userId: string, hasAdmin: boolean) => {
    if (hasAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      toast.success(t("admin_role_revoked"));
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      toast.success(t("admin_role_granted"));
    }
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
    if (error) toast.error(error.message);
    else {
      toast.success(t("credits_applied", { amount: `${amount > 0 ? "+" : ""}${amount}` }));
      setAdjustAmount("");
      setAdjustDescription("");
      loadUsers();
      if (selectedUser) loadUserActivity(userId);
    }
    setAdjustLoading(false);
  };

  return (
    <div>
      {/* Search bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by user ID or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Badge variant="outline" className="text-[10px]">{filteredUsers.length} users</Badge>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px]">User</TableHead>
              <TableHead className="text-[10px]">Roles</TableHead>
              <TableHead className="text-[10px] text-right">Neurons</TableHead>
              <TableHead className="text-[10px] text-right">Balance</TableHead>
              <TableHead className="text-[10px] text-right">Spent</TableHead>
              <TableHead className="text-[10px] w-24">Actions</TableHead>
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
            ) : paginatedUsers.map((u) => (
              <TableRow key={u.user_id} className="cursor-pointer hover:bg-muted/50" onClick={() => openUserDetail(u)}>
                <TableCell>
                  <div>
                    <p className="text-xs font-mono">{u.user_id.substring(0, 12)}…</p>
                    {u.email && <p className="text-[10px] text-muted-foreground">{u.email}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {u.roles.length === 0 && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">user</span>}
                    {u.roles.map((r) => (
                      <span key={r} className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-mono",
                        r === "admin" ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
                      )}>{r}</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-right">{u.neuron_count}</TableCell>
                <TableCell className="text-xs font-mono text-right">{u.balance}</TableCell>
                <TableCell className="text-xs font-mono text-right">{u.total_spent}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openUserDetail(u)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => toggleUserRole(u.user_id, u.roles.includes("admin"))}
                      title={u.roles.includes("admin") ? "Revoke admin" : "Grant admin"}
                    >
                      {u.roles.includes("admin") ? <UserMinus className="h-3.5 w-3.5 text-destructive" /> : <UserPlus className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />Prev
          </Button>
          <span className="text-[10px] text-muted-foreground">Page {page + 1} of {totalPages}</span>
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
                <SheetTitle className="text-sm">{t("user_detail")}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                {/* User info */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                  <p className="text-[10px] text-muted-foreground font-mono">{selectedUser.user_id}</p>
                  {selectedUser.email && <p className="text-xs font-medium">{selectedUser.email}</p>}
                  <div className="flex gap-1">
                    {selectedUser.roles.length === 0 && <Badge variant="outline" className="text-[9px]">user</Badge>}
                    {selectedUser.roles.map((r) => (
                      <Badge key={r} variant={r === "admin" ? "destructive" : "default"} className="text-[9px]">{r}</Badge>
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
                        <p className="text-[9px] text-muted-foreground">Neurons</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border text-center">
                        <FileText className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                        <p className="text-sm font-bold">{userActivity.artifact_count}</p>
                        <p className="text-[9px] text-muted-foreground">Artifacts</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border text-center">
                        <Briefcase className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                        <p className="text-sm font-bold">{userActivity.episode_count}</p>
                        <p className="text-[9px] text-muted-foreground">Episodes</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-primary/5">
                        <p className="text-sm font-bold text-primary">{selectedUser.balance}</p>
                        <p className="text-[9px] text-muted-foreground">Balance</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-sm font-bold">{selectedUser.total_spent}</p>
                        <p className="text-[9px] text-muted-foreground">Spent</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-sm font-bold">{selectedUser.total_earned}</p>
                        <p className="text-[9px] text-muted-foreground">Earned</p>
                      </div>
                    </div>

                    {/* Credit adjustment */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("adjust_credits")}</p>
                      <div className="flex gap-2">
                        <Input
                          type="number" placeholder="±amount"
                          value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)}
                          className="h-7 text-xs w-24"
                        />
                        <Input
                          placeholder="Reason..."
                          value={adjustDescription} onChange={(e) => setAdjustDescription(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Button
                          size="sm" className="h-7 text-xs"
                          disabled={adjustLoading || !adjustAmount || !adjustDescription.trim()}
                          onClick={() => adjustCredits(selectedUser.user_id)}
                        >
                          {adjustLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Role management */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm" className="flex-1 text-xs gap-1"
                        onClick={() => toggleUserRole(selectedUser.user_id, selectedUser.roles.includes("admin"))}
                      >
                        {selectedUser.roles.includes("admin") ? (
                          <><UserMinus className="h-3.5 w-3.5 text-destructive" />{t("revoke_admin")}</>
                        ) : (
                          <><ShieldCheck className="h-3.5 w-3.5" />{t("grant_admin")}</>
                        )}
                      </Button>
                    </div>

                    {/* Recent transactions */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("recent_transactions")}</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {userActivity.recent_transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-[10px]">
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
                          <p className="text-[10px] text-muted-foreground text-center py-2">{t("no_transactions")}</p>
                        )}
                      </div>
                    </div>

                    {/* Recent jobs */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Jobs</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {userActivity.recent_jobs.map((job) => (
                          <div key={job.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-[10px]">
                            <Badge variant="outline" className={cn(
                              "text-[8px] px-1 py-0",
                              job.status === "completed" ? "text-status-validated" : job.status === "failed" ? "text-destructive" : "text-muted-foreground"
                            )}>{job.status}</Badge>
                            <span className="flex-1 truncate font-mono">{job.worker_type}</span>
                            <span className="text-muted-foreground shrink-0">
                              {format(new Date(job.created_at), "dd MMM HH:mm")}
                            </span>
                          </div>
                        ))}
                        {userActivity.recent_jobs.length === 0 && (
                          <p className="text-[10px] text-muted-foreground text-center py-2">No jobs</p>
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
