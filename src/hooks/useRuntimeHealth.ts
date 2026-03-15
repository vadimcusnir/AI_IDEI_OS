import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RuntimeStats {
  services_healthy: number;
  services_degraded: number;
  services_down: number;
  validations_1h: number;
  denials_1h: number;
  avg_latency_ms: number;
  feature_flags_active: number;
  active_jobs: number;
}

interface ServiceHealth {
  service_key: string;
  status: string;
  circuit_state: string;
  consecutive_failures: number;
  avg_latency_ms: number;
  last_check_at: string;
  cooldown_until: string | null;
}

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rollout_percentage: number;
}

export function useRuntimeHealth() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RuntimeStats | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [statsRes, healthRes, flagsRes] = await Promise.all([
      supabase.rpc("runtime_system_stats"),
      supabase.from("runtime_health").select("*").order("service_key"),
      supabase.from("feature_flags").select("*").order("key"),
    ]);

    if (statsRes.data) setStats(statsRes.data as unknown as RuntimeStats);
    if (healthRes.data) setServices(healthRes.data as ServiceHealth[]);
    if (flagsRes.data) setFlags(flagsRes.data as FeatureFlag[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { stats, services, flags, loading, reload: load };
}
