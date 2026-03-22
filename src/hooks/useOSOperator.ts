import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OSModule {
  id: string;
  module_key: string;
  module_name: string;
  module_type: string;
  version: string;
  status: string;
  owner: string;
  risk_level: string;
  health_status: string;
  avg_latency_ms: number;
  error_rate: number;
  last_health_check: string;
  description: string;
}

interface OSStats {
  total_modules: number;
  active_modules: number;
  healthy_modules: number;
  warning_modules: number;
  critical_modules: number;
  avg_latency_ms: number;
  avg_error_rate: number;
  active_jobs: number;
  queue_depth: number;
  decision_ledger_24h: number;
  os_version: string;
  prompt_system_version: string;
}

interface LedgerEntry {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_resource: string | null;
  verdict: string | null;
  reason: string | null;
  created_at: string;
}

export function useOSOperator() {
  const { user } = useAuth();
  const [modules, setModules] = useState<OSModule[]>([]);
  const [stats, setStats] = useState<OSStats | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [modulesRes, statsRes, ledgerRes] = await Promise.all([
      supabase.from("os_modules").select("*").order("module_name"),
      supabase.rpc("os_system_stats"),
      supabase.from("decision_ledger").select("id, event_type, actor_id, target_resource, verdict, reason, created_at")
        .order("created_at", { ascending: false }).limit(20),
    ]);

    if (modulesRes.data) setModules(modulesRes.data as OSModule[]);
    if (statsRes.data) setStats(statsRes.data as unknown as OSStats);
    if (ledgerRes.data) setLedger(ledgerRes.data as LedgerEntry[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { modules, stats, ledger, loading, reload: load };
}
