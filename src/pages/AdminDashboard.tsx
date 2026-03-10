import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Users, Brain, Briefcase, Coins, Sparkles, Activity, RefreshCw, Trash2, Eye, EyeOff, UserPlus, UserMinus, ScrollText, PlusCircle, MinusCircle, MessageCircle, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AdminFeedbackTab } from "@/components/feedback/AdminFeedbackTab";
import { AdminChangelogTab } from "@/components/admin/AdminChangelogTab";
import { AdminKnowledgeGraphTab } from "@/components/admin/AdminKnowledgeGraphTab";

// ─── Types ──────────────────────────────────────────
interface PlatformStats {
  totalNeurons: number; publishedNeurons: number; draftNeurons: number;
  totalEpisodes: number; totalJobs: number; completedJobs: number; failedJobs: number;
  totalUsers: number; totalCreditsCirculating: number; totalCreditsSpent: number;
  activeServices: number;
}

interface UserRow {
  user_id: string; email: string; balance: number; total_spent: number; total_earned: number;
  neuron_count: number; roles: string[];
}

interface NeuronRow {
  id: number; number: number; title: string; status: string; visibility: string;
  author_id: string; created_at: string; score: number; lifecycle: string;
}

interface JobRow {
  id: string; worker_type: string; status: string; neuron_id: number;
  author_id: string; created_at: string; completed_at: string | null;
}

interface ServiceRow {
  id: string; service_key: string; name: string; category: string;
  credits_cost: number; is_active: boolean; service_class: string;
}

interface LogEntry {
  id: string;
  function_name: string;
  level: string;
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { isAdmin, loading, user } = useAdminCheck();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [neurons, setNeurons] = useState<NeuronRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Credit adjustment state
  const [adjustingUser, setAdjustingUser] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    // AdminRoute already handles auth + role check, just load data
    if (loading || !user || !isAdmin) return;
    loadAll();
  }, [isAdmin, loading, user]);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    await Promise.all([loadStats(), loadUsers(), loadNeurons(), loadJobs(), loadServices(), loadLogs()]);
    setLoadingData(false);
  }, []);

  const loadStats = async () => {
    const [neuronsAll, neuronsPub, neuronsDraft, episodes, jobsAll, jobsDone, jobsFailed, credits, servicesActive] = await Promise.all([
      supabase.from("neurons").select("id", { count: "exact", head: true }),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("episodes").select("id", { count: "exact", head: true }),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("user_credits").select("balance, total_spent"),
      supabase.from("service_catalog").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

    const creditsData = credits.data || [];
    setStats({
      totalNeurons: neuronsAll.count ?? 0,
      publishedNeurons: neuronsPub.count ?? 0,
      draftNeurons: neuronsDraft.count ?? 0,
      totalEpisodes: episodes.count ?? 0,
      totalJobs: jobsAll.count ?? 0,
      completedJobs: jobsDone.count ?? 0,
      failedJobs: jobsFailed.count ?? 0,
      totalUsers: creditsData.length,
      totalCreditsCirculating: creditsData.reduce((s, c: any) => s + (c.balance || 0), 0),
      totalCreditsSpent: creditsData.reduce((s, c: any) => s + (c.total_spent || 0), 0),
      activeServices: servicesActive.count ?? 0,
    });
  };

  const loadUsers = async () => {
    const { data: creditsData } = await supabase.from("user_credits").select("user_id, balance, total_spent, total_earned");
    const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");
    const { data: neuronsData } = await supabase.from("neurons").select("author_id");

    const neuronCounts: Record<string, number> = {};
    (neuronsData || []).forEach((n: any) => {
      if (n.author_id) neuronCounts[n.author_id] = (neuronCounts[n.author_id] || 0) + 1;
    });

    const rolesMap: Record<string, string[]> = {};
    (rolesData || []).forEach((r: any) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });

    const rows: UserRow[] = (creditsData || []).map((c: any) => ({
      user_id: c.user_id,
      email: c.user_id.substring(0, 8) + "…",
      balance: c.balance,
      total_spent: c.total_spent,
      total_earned: c.total_earned,
      neuron_count: neuronCounts[c.user_id] || 0,
      roles: rolesMap[c.user_id] || [],
    }));

    setUsers(rows);
  };

  const loadNeurons = async () => {
    const { data } = await supabase.from("neurons")
      .select("id, number, title, status, visibility, author_id, created_at, score, lifecycle")
      .order("created_at", { ascending: false }).limit(50);
    setNeurons(data as NeuronRow[] || []);
  };

  const loadJobs = async () => {
    const { data } = await supabase.from("neuron_jobs")
      .select("id, worker_type, status, neuron_id, author_id, created_at, completed_at")
      .order("created_at", { ascending: false }).limit(50);
    setJobs(data as JobRow[] || []);
  };

  const loadServices = async () => {
    const { data } = await supabase.from("service_catalog")
      .select("id, service_key, name, category, credits_cost, is_active, service_class")
      .order("created_at", { ascending: false });
    setServices(data as ServiceRow[] || []);
  };

  const loadLogs = async () => {
    // Load recent credit transactions as operational logs + failed jobs as error tracking
    const [txResult, failedJobsResult] = await Promise.all([
      supabase.from("credit_transactions")
        .select("id, user_id, amount, type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("neuron_jobs")
        .select("id, worker_type, status, created_at, completed_at, result")
        .in("status", ["failed", "running"])
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const logEntries: LogEntry[] = [];

    // Map transactions to log entries
    (txResult.data || []).forEach((tx: any) => {
      logEntries.push({
        id: tx.id,
        function_name: "credit-engine",
        level: tx.type === "denied" ? "error" : tx.type === "release" ? "warn" : "info",
        message: `[${tx.type.toUpperCase()}] ${tx.description} | amount: ${tx.amount} | user: ${tx.user_id.substring(0, 8)}…`,
        timestamp: tx.created_at,
      });
    });

    // Map failed/running jobs to log entries
    (failedJobsResult.data || []).forEach((j: any) => {
      const resultMsg = j.result?.error || j.result?.reason || "";
      logEntries.push({
        id: `job-${j.id}`,
        function_name: j.worker_type || "run-service",
        level: j.status === "failed" ? "error" : "warn",
        message: `[JOB ${j.status.toUpperCase()}] ${j.worker_type} | ${resultMsg}`.trim(),
        timestamp: j.created_at,
      });
    });

    // Sort by timestamp desc
    logEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(logEntries.slice(0, 80));
  };

  // ─── Admin Actions ──────────────────────────────────
  const toggleServiceActive = async (serviceId: string, currentActive: boolean) => {
    const { error } = await supabase.from("service_catalog")
      .update({ is_active: !currentActive }).eq("id", serviceId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Service ${!currentActive ? "activated" : "deactivated"}`);
    loadServices();
    loadStats();
  };

  const toggleUserRole = async (userId: string, hasAdmin: boolean) => {
    if (hasAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) { toast.error(error.message); return; }
      toast.success("Admin role revoked");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) { toast.error(error.message); return; }
      toast.success("Admin role granted");
    }
    loadUsers();
  };

  const adjustCredits = async (userId: string) => {
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) { toast.error("Invalid amount"); return; }
    if (!adjustDescription.trim()) { toast.error("Add a description"); return; }

    setAdjustLoading(true);
    try {
      // Get current balance
      const { data: current } = await supabase.from("user_credits")
        .select("balance, total_earned").eq("user_id", userId).single();
      if (!current) { toast.error("User credits not found"); return; }

      const newBalance = current.balance + amount;
      if (newBalance < 0) { toast.error(`Insufficient balance. Current: ${current.balance}`); return; }

      // Update balance
      const updateData: any = { balance: newBalance, updated_at: new Date().toISOString() };
      if (amount > 0) updateData.total_earned = current.total_earned + amount;

      const { error: updateErr } = await supabase.from("user_credits")
        .update(updateData).eq("user_id", userId);
      if (updateErr) { toast.error(updateErr.message); return; }

      // Log transaction
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount,
        type: amount > 0 ? "admin_grant" : "admin_deduct",
        description: `ADMIN: ${adjustDescription}`,
      });

      toast.success(`${amount > 0 ? "+" : ""}${amount} credits applied`);
      setAdjustingUser(null);
      setAdjustAmount("");
      setAdjustDescription("");
      loadUsers();
      loadStats();
    } finally {
      setAdjustLoading(false);
    }
  };

  const deleteNeuron = async (neuronId: number) => {
    const { error } = await supabase.from("neurons").delete().eq("id", neuronId);
    if (error) { toast.error(error.message); return; }
    toast.success("Neuron deleted");
    loadNeurons();
    loadStats();
  };

  const toggleNeuronVisibility = async (neuronId: number, currentVis: string) => {
    const newVis = currentVis === "public" ? "private" : "public";
    const { error } = await supabase.from("neurons").update({ visibility: newVis }).eq("id", neuronId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Visibility changed: ${newVis}`);
    loadNeurons();
  };

  if (loading || loadingData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex-1">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold">Admin Control Panel</h1>
              <p className="text-xs text-muted-foreground">Monitoring and control for the AI-IDEI platform</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadAll} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <KPI label="Users" value={stats.totalUsers} icon={Users} />
          <KPI label="Neurons" value={stats.totalNeurons} icon={Brain} />
          <KPI label="Published" value={stats.publishedNeurons} icon={Brain} color="text-primary" />
          <KPI label="Draft" value={stats.draftNeurons} icon={Brain} />
          <KPI label="Episodes" value={stats.totalEpisodes} icon={Activity} />
          <KPI label="Jobs" value={stats.totalJobs} icon={Briefcase} />
          <KPI label="Credits circ." value={stats.totalCreditsCirculating} icon={Coins} color="text-primary" />
          <KPI label="Credits spent" value={stats.totalCreditsSpent} icon={Coins} color="text-destructive" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
            <TabsTrigger value="neurons" className="text-xs">Neurons</TabsTrigger>
            <TabsTrigger value="jobs" className="text-xs">Jobs</TabsTrigger>
            <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs gap-1">
              <ScrollText className="h-3 w-3" /> Logs
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs gap-1">
              <MessageCircle className="h-3 w-3" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="changelog" className="text-xs gap-1">
              <ScrollText className="h-3 w-3" /> Changelog
            </TabsTrigger>
            <TabsTrigger value="knowledge-graph" className="text-xs gap-1">
              <Network className="h-3 w-3" /> Knowledge Graph
            </TabsTrigger>
          </TabsList>

          {/* ─── Overview ─── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                  <Activity className="h-3 w-3" /> System Health
                </h3>
                <div className="space-y-3">
                  <HealthRow label="Job Success Rate" value={stats.totalJobs > 0 ? `${Math.round((stats.completedJobs / stats.totalJobs) * 100)}%` : "N/A"} good={stats.failedJobs === 0} />
                  <HealthRow label="Failed Jobs" value={String(stats.failedJobs)} good={stats.failedJobs === 0} />
                  <HealthRow label="Active Services" value={String(stats.activeServices)} good={stats.activeServices > 0} />
                  <HealthRow label="Avg Credits/User" value={stats.totalUsers > 0 ? String(Math.round(stats.totalCreditsCirculating / stats.totalUsers)) : "0"} good />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                  <Coins className="h-3 w-3" /> Platform Economy
                </h3>
                <div className="space-y-3">
                  <EconRow label="Credits in circulation" value={stats.totalCreditsCirculating} />
                  <EconRow label="Credits consumed" value={stats.totalCreditsSpent} />
                  <EconRow label="Estimated revenue" value={`$${(stats.totalCreditsSpent * 0.01).toFixed(2)}`} />
                  <EconRow label="Neurons per user" value={stats.totalUsers > 0 ? (stats.totalNeurons / stats.totalUsers).toFixed(1) : "0"} />
                </div>
              </div>

              <div className="sm:col-span-2 bg-card border border-border rounded-xl p-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Last 10 Neurons
                </h3>
                <div className="space-y-1">
                  {neurons.slice(0, 10).map(n => (
                    <button
                      key={n.id}
                      onClick={() => navigate(`/n/${n.number}`)}
                      className="w-full flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-[10px] font-mono text-primary font-bold w-12">#{n.number}</span>
                      <span className="text-xs truncate flex-1">{n.title}</span>
                      <StatusBadge status={n.status} />
                      <StatusBadge status={n.visibility} />
                      <span className="text-[9px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── Users ─── */}
          <TabsContent value="users">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">User ID</TableHead>
                    <TableHead className="text-[10px]">Roles</TableHead>
                     <TableHead className="text-[10px] text-right">Neurons</TableHead>
                     <TableHead className="text-[10px] text-right">Balance</TableHead>
                     <TableHead className="text-[10px] text-right">Spent</TableHead>
                     <TableHead className="text-[10px] text-right">Earned</TableHead>
                     <TableHead className="text-[10px] w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell className="text-xs font-mono">{u.user_id.substring(0, 12)}…</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.roles.length === 0 && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">user</span>}
                          {u.roles.map(r => (
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
                      <TableCell className="text-xs font-mono text-right">{u.total_earned}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleUserRole(u.user_id, u.roles.includes("admin"))}
                            title={u.roles.includes("admin") ? "Revoke admin" : "Grant admin"}
                          >
                            {u.roles.includes("admin") ? <UserMinus className="h-3.5 w-3.5 text-destructive" /> : <UserPlus className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setAdjustingUser(adjustingUser === u.user_id ? null : u.user_id)}
                            title="Adjust credits"
                          >
                            <Coins className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </div>
                        {/* Credit adjustment inline */}
                        {adjustingUser === u.user_id && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border space-y-2">
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="±amount"
                                value={adjustAmount}
                                onChange={e => setAdjustAmount(e.target.value)}
                                className="h-7 text-xs w-24"
                              />
                              <Input
                                placeholder="Descriere tranzacție"
                                value={adjustDescription}
                                onChange={e => setAdjustDescription(e.target.value)}
                                className="h-7 text-xs flex-1"
                              />
                            </div>
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1"
                                disabled={adjustLoading}
                                onClick={() => adjustCredits(u.user_id)}
                              >
                                {adjustLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                                Aplică
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => { setAdjustingUser(null); setAdjustAmount(""); setAdjustDescription(""); }}
                              >
                                Anulează
                              </Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ─── Neurons ─── */}
          <TabsContent value="neurons">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-16">#</TableHead>
                    <TableHead className="text-[10px]">Titlu</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Vizibilitate</TableHead>
                    <TableHead className="text-[10px]">Lifecycle</TableHead>
                    <TableHead className="text-[10px] text-right">Score</TableHead>
                    <TableHead className="text-[10px]">Creat</TableHead>
                    <TableHead className="text-[10px] w-24">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neurons.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="text-xs font-mono text-primary font-bold">
                        <button onClick={() => navigate(`/n/${n.number}`)} className="hover:underline">{n.number}</button>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        <button onClick={() => navigate(`/n/${n.number}`)} className="hover:underline">{n.title}</button>
                      </TableCell>
                      <TableCell><StatusBadge status={n.status} /></TableCell>
                      <TableCell><StatusBadge status={n.visibility} /></TableCell>
                      <TableCell><StatusBadge status={n.lifecycle} /></TableCell>
                      <TableCell className="text-xs font-mono text-right">{n.score.toFixed(1)}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleNeuronVisibility(n.id, n.visibility)} title="Toggle vizibilitate">
                            {n.visibility === "public" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNeuron(n.id)} title="Șterge neuron">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ─── Jobs ─── */}
          <TabsContent value="jobs">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">ID</TableHead>
                    <TableHead className="text-[10px]">Worker</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Neuron</TableHead>
                    <TableHead className="text-[10px]">Creat</TableHead>
                    <TableHead className="text-[10px]">Completat</TableHead>
                    <TableHead className="text-[10px] text-right">Durată</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map(j => {
                    const duration = j.completed_at
                      ? Math.round((new Date(j.completed_at).getTime() - new Date(j.created_at).getTime()) / 1000)
                      : null;
                    return (
                      <TableRow key={j.id}>
                        <TableCell className="text-[10px] font-mono text-muted-foreground">{j.id.substring(0, 8)}</TableCell>
                        <TableCell className="text-xs">{j.worker_type.replace(/-/g, " ")}</TableCell>
                        <TableCell><StatusBadge status={j.status} /></TableCell>
                        <TableCell className="text-xs font-mono text-primary">{j.neuron_id}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{new Date(j.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{j.completed_at ? new Date(j.completed_at).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-xs font-mono text-right">{duration !== null ? `${duration}s` : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ─── Services ─── */}
          <TabsContent value="services">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Key</TableHead>
                    <TableHead className="text-[10px]">Nume</TableHead>
                    <TableHead className="text-[10px]">Categorie</TableHead>
                    <TableHead className="text-[10px]">Clasă</TableHead>
                    <TableHead className="text-[10px] text-right">Cost (credits)</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px] w-20">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-[10px] font-mono">{s.service_key}</TableCell>
                      <TableCell className="text-xs font-medium">{s.name}</TableCell>
                      <TableCell><StatusBadge status={s.category} /></TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded",
                          s.service_class === "A" ? "bg-primary/10 text-primary" :
                          s.service_class === "B" ? "bg-orange-500/10 text-orange-600" :
                          "bg-destructive/10 text-destructive"
                        )}>{s.service_class}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right">{s.credits_cost}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded",
                          s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>{s.is_active ? "ACTIV" : "INACTIV"}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleServiceActive(s.id, s.is_active)}
                          title={s.is_active ? "Dezactivează" : "Activează"}
                        >
                          {s.is_active ? <EyeOff className="h-3.5 w-3.5 text-destructive" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ─── Logs ─── */}
          <TabsContent value="logs">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ScrollText className="h-3 w-3" /> Operational Logs — Tranzacții & Erori
                </h3>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={loadLogs}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                </Button>
              </div>

              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nu există loguri recente.</p>
              ) : (
                <div className="space-y-0.5 max-h-[600px] overflow-y-auto font-mono text-[11px]">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className={cn(
                        "flex items-start gap-2 px-2 py-1.5 rounded",
                        log.level === "error" ? "bg-destructive/5" :
                        log.level === "warn" ? "bg-orange-500/5" :
                        "hover:bg-muted/30"
                      )}
                    >
                      <LogLevelBadge level={log.level} />
                      <span className="text-[10px] text-muted-foreground shrink-0 w-[130px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded shrink-0",
                        "bg-muted text-muted-foreground"
                      )}>
                        {log.function_name}
                      </span>
                      <span className="text-xs break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Feedback ─── */}
          <TabsContent value="feedback">
            <AdminFeedbackTab />
          </TabsContent>

          {/* ─── Changelog ─── */}
          <TabsContent value="changelog">
            <AdminChangelogTab />
          </TabsContent>

          {/* ─── Knowledge Graph ─── */}
          <TabsContent value="knowledge-graph">
            <AdminKnowledgeGraphTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────

function KPI({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-lg font-bold font-mono", color)}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    published: "bg-primary/10 text-primary",
    public: "bg-primary/10 text-primary",
    completed: "bg-primary/10 text-primary",
    active: "bg-primary/10 text-primary",
    draft: "bg-muted text-muted-foreground",
    private: "bg-muted text-muted-foreground",
    pending: "bg-orange-500/10 text-orange-600",
    processing: "bg-orange-500/10 text-orange-600",
    running: "bg-orange-500/10 text-orange-600",
    failed: "bg-destructive/15 text-destructive",
    archived: "bg-muted text-muted-foreground/60",
  };
  return (
    <span className={cn("text-[9px] font-mono uppercase px-1.5 py-0.5 rounded", colors[status] || "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

function LogLevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    error: "bg-destructive/15 text-destructive",
    warn: "bg-orange-500/10 text-orange-600",
    info: "bg-primary/10 text-primary",
  };
  return (
    <span className={cn("text-[8px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 w-10 text-center", colors[level] || "bg-muted text-muted-foreground")}>
      {level}
    </span>
  );
}

function HealthRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-mono font-bold", good ? "text-primary" : "text-destructive")}>{value}</span>
    </div>
  );
}

function EconRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono font-bold">{value}</span>
    </div>
  );
}
