import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Download, FileJson, FileText, Clock, CheckCircle2, XCircle,
  AlertTriangle, Shield, Loader2, TrendingUp, BarChart3,
  Bell, Eye, Lock
} from "lucide-react";

// ── CSV/JSON Export ──
function ExportSection() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [exportTable, setExportTable] = useState("credit_transactions");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const EXPORTABLE_TABLES = [
    { value: "credit_transactions", label: "Credit Transactions" },
    { value: "decision_ledger", label: "Decision Ledger" },
    { value: "compliance_log", label: "Compliance Log" },
    { value: "abuse_events", label: "Abuse Events" },
    { value: "analytics_events", label: "Analytics Events" },
    { value: "neuron_jobs", label: "Jobs History" },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from(exportTable as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info(t("toast_no_data"));
        return;
      }

      let content: string;
      let mimeType: string;
      let ext: string;

      if (exportFormat === "csv") {
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(row =>
          Object.values(row).map(v =>
            typeof v === "object" ? `"${JSON.stringify(v).replace(/"/g, '""')}"` : `"${String(v ?? "").replace(/"/g, '""')}"`
          ).join(",")
        );
        content = [headers, ...rows].join("\n");
        mimeType = "text/csv";
        ext = "csv";
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        ext = "json";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportTable}_${new Date().toISOString().split("T")[0]}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} rows`);
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Download className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Audit Export</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        <Select value={exportTable} onValueChange={setExportTable}>
          <SelectTrigger className="w-48 text-xs h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXPORTABLE_TABLES.map(t => (
              <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={exportFormat} onValueChange={v => setExportFormat(v as any)}>
          <SelectTrigger className="w-28 text-xs h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="csv" className="text-xs"><FileText className="inline h-3 w-3 mr-1" />CSV</SelectItem>
            <SelectItem value="json" className="text-xs"><FileJson className="inline h-3 w-3 mr-1" />JSON</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-9 text-xs gap-1.5" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          Export
        </Button>
      </div>
    </div>
  );
}

// ── Approval Requests ──
function ApprovalRequests() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_approval_requests" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("admin_approval_requests" as any)
      .update({
        status: "approved",
        approved_by: user?.id,
        resolved_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_approved"));
    load();
  };

  const handleReject = async (id: string, note: string) => {
    const { error } = await supabase
      .from("admin_approval_requests" as any)
      .update({
        status: "rejected",
        approved_by: user?.id,
        resolved_at: new Date().toISOString(),
        resolution_note: note,
      } as any)
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_rejected"));
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Multi-Level Approvals</h3>
        <Badge variant="outline" className="text-nano ml-auto">
          {requests.filter(r => r.status === "pending").length} pending
        </Badge>
      </div>

      {requests.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No approval requests</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {requests.map(req => (
            <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{req.action_type}</p>
                <p className="text-micro text-muted-foreground">
                  {req.target_resource} · Level {req.approval_level}/{req.required_level}
                  {req.timelock_until && ` · Timelock: ${new Date(req.timelock_until).toLocaleDateString()}`}
                </p>
              </div>
              <Badge variant={
                req.status === "approved" ? "default" :
                req.status === "rejected" ? "destructive" : "outline"
              } className="text-nano shrink-0">
                {req.status}
              </Badge>
              {req.status === "pending" && (
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" className="h-7 text-micro" onClick={() => handleApprove(req.id)}>
                    <CheckCircle2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-micro" onClick={() => handleReject(req.id, "Rejected by admin")}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Anomaly Alerts ──
function AnomalyAlerts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("anomaly_alerts" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setAlerts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const acknowledge = async (id: string) => {
    await supabase
      .from("anomaly_alerts" as any)
      .update({
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    toast.success(t("toast_alert_ack"));
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Anomaly Alerts</h3>
        <Badge variant="outline" className="text-nano ml-auto text-amber-600">
          {alerts.filter(a => !a.acknowledged_at).length} active
        </Badge>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No anomalies detected</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map(alert => (
            <div key={alert.id} className={cn(
              "flex items-center gap-3 p-3 rounded-lg border bg-background",
              alert.severity === "critical" ? "border-destructive/30" :
              alert.severity === "warning" ? "border-amber-500/30" : "border-border"
            )}>
              <AlertTriangle className={cn("h-4 w-4 shrink-0",
                alert.severity === "critical" ? "text-destructive" : "text-amber-500"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{alert.alert_type}: {alert.metric_name}</p>
                <p className="text-micro text-muted-foreground">
                  Value: {alert.current_value} (threshold: {alert.threshold_value})
                  {alert.deviation_pct && ` · ${alert.deviation_pct}% deviation`}
                </p>
              </div>
              {!alert.acknowledged_at ? (
                <Button size="sm" variant="outline" className="h-7 text-micro" onClick={() => acknowledge(alert.id)}>
                  <Eye className="h-3 w-3 mr-1" /> ACK
                </Button>
              ) : (
                <Badge variant="outline" className="text-nano text-emerald-600">ACK</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cost vs Revenue Chart (simplified) ──
function CostRevenueOverview() {
  const [data, setData] = useState<{ service: string; cost: number; revenue: number; jobs: number; margin: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Get real job data with costs
      const { data: jobs } = await supabase
        .from("neuron_jobs" as any)
        .select("worker_type, status, credits_cost")
        .in("status", ["completed", "failed"])
        .order("created_at", { ascending: false })
        .limit(1000);

      // Get service catalog for pricing
      const { data: catalog } = await supabase
        .from("service_catalog" as any)
        .select("service_key, credits_cost, name");

      const catalogMap = new Map((catalog || []).map((c: any) => [c.service_key, c]));

      const serviceMap: Record<string, { cost: number; revenue: number; jobs: number }> = {};
      (jobs || []).forEach((job: any) => {
        const svc = job.worker_type || "other";
        if (!serviceMap[svc]) serviceMap[svc] = { cost: 0, revenue: 0, jobs: 0 };
        serviceMap[svc].jobs++;
        const creditsCost = job.credits_cost || (catalogMap.get(svc) as any)?.credits_cost || 0;
        // Real compute cost ≈ credits × $0.01 (1 credit = $0.01)
        const computeCost = creditsCost * 0.01;
        // Revenue = credits charged to user
        serviceMap[svc].cost += computeCost;
        serviceMap[svc].revenue += creditsCost * 0.01 * 10; // 10x markup target
      });

      setData(
        Object.entries(serviceMap)
          .map(([service, vals]) => ({
            service: (catalogMap.get(service) as any)?.name || service.replace(/-/g, " "),
            ...vals,
            margin: vals.revenue > 0 ? ((vals.revenue - vals.cost) / vals.revenue * 100) : 0,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
      );
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const maxVal = Math.max(...data.map(d => Math.max(d.cost, d.revenue)), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Cost vs Revenue by Service</h3>
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No transaction data</p>
      ) : (
        <div className="space-y-3">
          {data.map(d => (
            <div key={d.service} className="space-y-1">
              <div className="flex items-center justify-between text-micro">
                <span className="font-medium truncate max-w-[140px]">{d.service}</span>
                <span className="text-muted-foreground">
                  Cost: ${d.cost.toFixed(2)} · Rev: ${d.revenue.toFixed(2)} · {d.jobs} jobs · {d.margin.toFixed(0)}% margin
                </span>
              </div>
              <div className="flex gap-1 h-2">
                <div className="h-full rounded-full bg-destructive/40" style={{ width: `${(d.cost / maxVal) * 100}%` }} />
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${(d.revenue / maxVal) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 text-nano text-muted-foreground pt-2">
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-destructive/40" /> Compute Cost</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-primary/60" /> Revenue (10× markup)</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ──
export function AdminAdvancedTab() {
  return (
    <div className="space-y-6">
      <ExportSection />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApprovalRequests />
        <AnomalyAlerts />
      </div>
      <CostRevenueOverview />
    </div>
  );
}
