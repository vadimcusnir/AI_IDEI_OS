import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FinOpsStats {
  jobs_running: number;
  jobs_failed_1h: number;
  jobs_failed_24h: number;
  jobs_completed_24h: number;
  total_credits_spent_24h: number;
  total_credits_refunded_24h: number;
  active_alerts: number;
  critical_alerts: number;
  total_users: number;
  avg_job_cost: number;
}

export interface ProviderHealth {
  id: string;
  provider_key: string;
  status: string;
  auth_status: string;
  quota_status: string;
  spend_status: string;
  balance_remaining: number | null;
  quota_remaining: number | null;
  quota_limit: number | null;
  monthly_spend: number | null;
  failure_rate_1h: number;
  failure_rate_24h: number;
  avg_latency_1h: number;
  avg_latency_24h: number;
  retry_rate: number;
  last_successful_call: string | null;
  last_failed_call: string | null;
  error_signatures: any[];
  alert_level: string;
  checked_at: string;
}

export interface AdminAlert {
  id: string;
  alert_type: string;
  severity: string;
  provider_key: string | null;
  service_key: string | null;
  title: string;
  description: string | null;
  error_signal: string | null;
  impact_scope: string | null;
  recommended_action: string | null;
  first_seen: string;
  last_seen: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  occurrences: number;
}

export interface CostEntry {
  id: string;
  cost_type: string;
  provider_key: string | null;
  service_key: string | null;
  tier: string | null;
  amount_usd: number;
  amount_credits: number;
  cost_category: string;
  description: string | null;
  created_at: string;
}

export function useFinOps() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FinOpsStats | null>(null);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [statsRes, healthRes, alertsRes, costsRes] = await Promise.all([
      supabase.rpc("finops_dashboard_stats"),
      supabase.from("provider_health_checks").select("*").order("checked_at", { ascending: false }),
      supabase.from("admin_alerts").select("*").is("resolved_at", null).order("last_seen", { ascending: false }),
      supabase.from("platform_cost_ledger").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    if (statsRes.data) setStats(statsRes.data as unknown as FinOpsStats);
    
    if (healthRes.data) {
      const seen = new Set<string>();
      const unique = (healthRes.data as unknown as ProviderHealth[]).filter(p => {
        if (seen.has(p.provider_key)) return false;
        seen.add(p.provider_key);
        return true;
      });
      setProviders(unique);
    }
    
    if (alertsRes.data) setAlerts(alertsRes.data as unknown as AdminAlert[]);
    if (costsRes.data) setCosts(costsRes.data as unknown as CostEntry[]);
    setLoading(false);
  }, [user]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (!user) return;
    await supabase.from("admin_alerts").update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
    }).eq("id", alertId);
    load();
  }, [user, load]);

  const resolveAlert = useCallback(async (alertId: string) => {
    if (!user) return;
    await supabase.from("admin_alerts").update({
      resolved_at: new Date().toISOString(),
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
    }).eq("id", alertId);
    load();
  }, [user, load]);

  useEffect(() => { load(); }, [load]);

  return { stats, providers, alerts, costs, loading, reload: load, acknowledgeAlert, resolveAlert };
}
