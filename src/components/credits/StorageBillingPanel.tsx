import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatBytes } from "@/hooks/useStorageUsage";
import { HardDrive, Coins, TrendingUp, FileText, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StorageCost {
  total_bytes: number;
  billable_bytes: number;
  free_bytes: number;
  cost_neurons: number;
  artifact_count: number;
}

interface BillingLogEntry {
  id: string;
  billing_date: string;
  total_bytes: number;
  billable_bytes: number;
  neurons_charged: number;
  artifact_count: number;
}

interface LargeArtifact {
  id: string;
  title: string;
  size_bytes: number;
  artifact_type: string;
  created_at: string;
}

export function StorageBillingPanel() {
  const { user } = useAuth();
  const { t } = useTranslation("pages");

  const costQuery = useQuery({
    queryKey: ["storage-cost", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("calculate_storage_cost", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return (data as unknown as StorageCost[])?.[0] ?? null;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const billingLogQuery = useQuery({
    queryKey: ["storage-billing-log", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_billing_log")
        .select("id, billing_date, total_bytes, billable_bytes, neurons_charged, artifact_count")
        .eq("user_id", user!.id)
        .order("billing_date", { ascending: false })
        .limit(7);
      if (error) throw error;
      return (data as unknown as BillingLogEntry[]) ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const largeFilesQuery = useQuery({
    queryKey: ["largest-artifacts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifacts")
        .select("id, title, size_bytes, artifact_type, created_at")
        .eq("author_id", user!.id)
        .gt("size_bytes", 0)
        .order("size_bytes", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data as unknown as LargeArtifact[]) ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const cost = costQuery.data;
  const loading = costQuery.isLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cost) return null;

  const monthlyEstimate = cost.cost_neurons;
  const dailyEstimate = Math.ceil(monthlyEstimate / 30);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-primary" />
          Storage Billing
        </h3>
        {monthlyEstimate > 0 && (
          <Badge variant="outline" className="text-nano gap-1">
            <TrendingUp className="h-3 w-3" />
            ~{dailyEstimate} N/day
          </Badge>
        )}
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-muted/30 p-2.5">
          <p className="text-micro text-muted-foreground">Total stored</p>
          <p className="text-sm font-semibold font-mono">{formatBytes(cost.total_bytes)}</p>
          <p className="text-micro text-muted-foreground">{cost.artifact_count} files</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-2.5">
          <p className="text-micro text-muted-foreground">Monthly cost</p>
          <p className={cn(
            "text-sm font-semibold font-mono",
            monthlyEstimate > 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {monthlyEstimate} N
          </p>
          <p className="text-micro text-muted-foreground">
            Free: {formatBytes(cost.free_bytes)}
          </p>
        </div>
      </div>

      {/* Billing progress bar */}
      {cost.total_bytes > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-micro text-muted-foreground">
            <span>Free tier usage</span>
            <span>{formatBytes(Math.min(cost.total_bytes, cost.free_bytes))} / {formatBytes(cost.free_bytes)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                cost.billable_bytes > 0 ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(100, (cost.total_bytes / cost.free_bytes) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent billing log */}
      {billingLogQuery.data && billingLogQuery.data.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <span className="text-micro font-medium text-muted-foreground uppercase tracking-wider">
            Recent charges
          </span>
          {billingLogQuery.data.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between text-dense py-0.5">
              <span className="text-muted-foreground">
                {format(new Date(entry.billing_date), "dd MMM")}
              </span>
              <span className="font-mono text-destructive">-{entry.neurons_charged} N</span>
            </div>
          ))}
        </div>
      )}

      {/* Largest files */}
      {largeFilesQuery.data && largeFilesQuery.data.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <span className="text-micro font-medium text-muted-foreground uppercase tracking-wider">
            Largest files
          </span>
          {largeFilesQuery.data.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-dense py-0.5">
              <span className="text-muted-foreground truncate max-w-[160px]" title={f.title}>
                <FileText className="inline h-3 w-3 mr-1" />
                {f.title}
              </span>
              <span className="font-mono shrink-0">{formatBytes(f.size_bytes)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
