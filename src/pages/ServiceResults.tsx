import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/motion/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, Coins,
  Search, X, Copy, RotateCcw, Download, ChevronDown, ChevronUp,
  BarChart3, Layers, Filter, Calendar, TrendingUp,
} from "lucide-react";

interface RunRecord {
  id: string;
  service_key: string;
  service_name: string;
  neuron_id: number | null;
  job_id: string | null;
  status: string;
  credits_cost: number;
  duration_ms: number | null;
  result_preview: string;
  inputs: Record<string, any>;
  batch_id: string | null;
  created_at: string;
  completed_at: string | null;
}

type FilterStatus = "all" | "completed" | "failed" | "running";
type SortBy = "date" | "cost" | "duration" | "service";

export default function ServiceResults() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const batchFilter = searchParams.get("batch");
  const serviceFilter = searchParams.get("service");

  useEffect(() => {
    if (authLoading || !user) return;
    loadRuns();
  }, [user, authLoading]);

  const loadRuns = async () => {
    let query = supabase
      .from("service_run_history")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (batchFilter) query = query.eq("batch_id", batchFilter);
    if (serviceFilter) query = query.eq("service_key", serviceFilter);

    const { data, error } = await query;
    if (error) toast.error(t("toast_load_error"));
    setRuns((data as RunRecord[]) || []);
    setLoading(false);
  };

  // Stats
  const stats = useMemo(() => {
    const completed = runs.filter(r => r.status === "completed");
    const failed = runs.filter(r => r.status === "failed");
    const totalCredits = runs.reduce((s, r) => s + r.credits_cost, 0);
    const avgDuration = completed.length > 0
      ? Math.round(completed.reduce((s, r) => s + (r.duration_ms || 0), 0) / completed.length)
      : 0;
    const uniqueServices = new Set(runs.map(r => r.service_key)).size;
    const uniqueBatches = new Set(runs.filter(r => r.batch_id).map(r => r.batch_id)).size;
    return { completed: completed.length, failed: failed.length, totalCredits, avgDuration, uniqueServices, uniqueBatches, total: runs.length };
  }, [runs]);

  // Filtering + sorting
  const filtered = useMemo(() => {
    let list = runs;
    if (filterStatus !== "all") list = list.filter(r => r.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.service_name.toLowerCase().includes(q) ||
        r.service_key.toLowerCase().includes(q) ||
        r.result_preview.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "cost": return [...list].sort((a, b) => b.credits_cost - a.credits_cost);
      case "duration": return [...list].sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0));
      case "service": return [...list].sort((a, b) => a.service_name.localeCompare(b.service_name));
      default: return list;
    }
  }, [runs, filterStatus, search, sortBy]);

  const copyResult = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("toast_copied"));
  };

  const exportCSV = () => {
    const headers = ["Service", "Status", "Credits", "Duration (s)", "Date", "Preview"];
    const rows = filtered.map(r => [
      r.service_name,
      r.status,
      r.credits_cost,
      r.duration_ms ? (r.duration_ms / 1000).toFixed(1) : "",
      r.created_at,
      r.result_preview.slice(0, 100).replace(/"/g, "'"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service-results-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("toast_csv_exported"));
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
      case "running": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="flex-1 overflow-y-auto">
      <SEOHead title="Service Results — AI-IDEI" description="View detailed results of all AI service executions." />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/services")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-medium">Rezultate servicii</h1>
            <p className="text-xs text-muted-foreground">
              Istoric complet al execuțiilor AI
              {batchFilter && <span className="ml-1">· Batch <span className="font-mono">{batchFilter.slice(0, 8)}</span></span>}
              {serviceFilter && <span className="ml-1">· {serviceFilter}</span>}
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
            <Download className="h-3 w-3" /> Export CSV
          </Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total execuții", value: stats.total, icon: Layers },
            { label: "Completate", value: stats.completed, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Credite cheltuite", value: stats.totalCredits, icon: Coins, suffix: "N" },
            { label: "Timp mediu", value: stats.avgDuration > 0 ? `${(stats.avgDuration / 1000).toFixed(1)}s` : "—", icon: Clock },
          ].map((kpi, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <kpi.icon className={cn("h-4 w-4", kpi.color || "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-bold font-mono">{kpi.value}</span>
                  {kpi.suffix && <span className="text-micro text-muted-foreground">{kpi.suffix}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută serviciu sau rezultat..."
              className="pl-9 pr-8 h-9 text-sm bg-card"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter pills */}
            {(["all", "completed", "failed"] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  filterStatus === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {s === "all" ? "Toate" : s === "completed" ? "✓ Complete" : "✗ Eșuate"}
              </button>
            ))}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="h-8 rounded-md border border-border bg-card px-2 text-xs outline-none"
            >
              <option value="date">Dată</option>
              <option value="cost">Cost</option>
              <option value="duration">Durată</option>
              <option value="service">Serviciu</option>
            </select>
          </div>
        </div>

        {/* Clear batch/service filter */}
        {(batchFilter || serviceFilter) && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1"
              onClick={() => { setSearchParams({}); loadRuns(); }}
            >
              <X className="h-3 w-3" /> Elimină filtrele
            </Button>
          </div>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="h-10 w-10 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Nicio execuție găsită</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              {filtered.length} rezultat{filtered.length !== 1 ? "e" : ""}
            </p>
            {filtered.map((run, i) => {
              const isExpanded = expanded === run.id;
              return (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="border border-border rounded-xl bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : run.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    {statusIcon(run.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate">{run.service_name}</p>
                        {run.batch_id && (
                          <Badge variant="outline" className="text-nano font-mono">
                            BATCH
                          </Badge>
                        )}
                      </div>
                      <p className="text-micro text-muted-foreground">
                        {format(new Date(run.created_at), "dd MMM yyyy, HH:mm")}
                        {run.duration_ms && ` · ${(run.duration_ms / 1000).toFixed(1)}s`}
                        {run.neuron_id && ` · Neuron #${run.neuron_id}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-muted-foreground flex items-center gap-0.5">
                        <Coins className="h-3 w-3" /> {run.credits_cost}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border px-4 py-4 space-y-4">
                          {/* Result preview */}
                          {run.result_preview ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">
                                  Rezultat
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-micro gap-1"
                                  onClick={() => copyResult(run.result_preview)}
                                >
                                  <Copy className="h-3 w-3" /> Copiază
                                </Button>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-4 sm:p-5 max-h-80 overflow-auto">
                                <div className="prose-compact whitespace-pre-wrap">{run.result_preview}</div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 italic">
                              Niciun rezultat salvat pentru această execuție.
                            </p>
                          )}

                          {/* Input context */}
                          {run.inputs && Object.keys(run.inputs).length > 0 && (
                            <div>
                              <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Input
                              </p>
                              <div className="bg-muted/30 rounded-lg p-3 text-dense space-y-1">
                                {Object.entries(run.inputs).map(([key, val]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="text-muted-foreground font-mono shrink-0">{key}:</span>
                                    <span className="truncate">{String(val).slice(0, 200)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Meta */}
                          <div className="flex flex-wrap gap-3 text-micro text-muted-foreground">
                            <span>ID: <span className="font-mono">{run.id.slice(0, 8)}</span></span>
                            {run.job_id && <span>Job: <span className="font-mono">{run.job_id.slice(0, 8)}</span></span>}
                            {run.batch_id && (
                              <button
                                onClick={() => { setSearchParams({ batch: run.batch_id! }); loadRuns(); }}
                                className="text-primary hover:underline"
                              >
                                Batch: <span className="font-mono">{run.batch_id.slice(0, 8)}</span>
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1.5 h-8"
                              onClick={() => navigate(`/run/${run.service_key}`)}
                            >
                              <RotateCcw className="h-3 w-3" /> Re-run
                            </Button>
                            {run.result_preview && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1.5 h-8"
                                onClick={() => {
                                  const blob = new Blob([run.result_preview], { type: "text/plain" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${run.service_key}-${run.id.slice(0, 8)}.txt`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <Download className="h-3 w-3" /> Download .txt
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Success rate bar */}
        {stats.total > 0 && (
          <div className="mt-8 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Rată de succes
              </p>
              <span className="text-sm font-bold font-mono">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </span>
            </div>
            <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} className="h-2" />
            <div className="flex justify-between mt-2 text-micro text-muted-foreground">
              <span>{stats.completed} completate</span>
              <span>{stats.failed} eșuate</span>
              <span>{stats.uniqueServices} servicii unice</span>
            </div>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
