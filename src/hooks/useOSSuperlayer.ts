/**
 * useOSSuperlayer — Fetches data from Cusnir_OS superlayer tables
 * (OTOS, MMS, LCSS, Agents, Executions, Memory Patterns, Power Unlocks)
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OTOS {
  id: string;
  name: string;
  mechanism: string;
  output_type: string;
  domain: string;
  status: string;
  created_at: string;
}

interface MMS {
  id: string;
  name: string;
  intent: string;
  complexity_level: number;
  status: string;
  created_at: string;
}

interface LCSS {
  id: string;
  name: string;
  macro_intent: string;
  strategic_value: number;
  status: string;
  created_at: string;
}

interface OSAgent {
  id: string;
  role: string;
  capabilities: string[];
  agent_type: string;
  status: string;
  performance_score: number;
  last_active_at: string | null;
}

interface OSExecution {
  id: string;
  status: string;
  credits_cost: number;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface MemoryPattern {
  id: string;
  pattern_type: string;
  category: string;
  frequency: number;
  effectiveness_score: number;
  last_used_at: string | null;
  created_at: string;
}

interface PowerUnlock {
  id: string;
  capability_key: string;
  capability_name: string;
  unlocked_at: string;
  xp_cost: number;
  tier: string;
}

interface SupStats {
  total_otos: number;
  total_mms: number;
  total_lcss: number;
  total_agents: number;
  active_agents: number;
  total_executions: number;
  total_patterns: number;
  unlocked_capabilities: number;
}

export function useOSSuperlayer() {
  const { user } = useAuth();
  const [otos, setOtos] = useState<OTOS[]>([]);
  const [mms, setMms] = useState<MMS[]>([]);
  const [lcss, setLcss] = useState<LCSS[]>([]);
  const [agents, setAgents] = useState<OSAgent[]>([]);
  const [executions, setExecutions] = useState<OSExecution[]>([]);
  const [patterns, setPatterns] = useState<MemoryPattern[]>([]);
  const [unlocks, setUnlocks] = useState<PowerUnlock[]>([]);
  const [stats, setStats] = useState<SupStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [otosR, mmsR, lcssR, agentsR, execR, patR, unlR] = await Promise.all([
      supabase.from("os_otos").select("id, name, mechanism, output_type, domain, status, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("os_mms").select("id, name, intent, complexity_level, status, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("os_lcss").select("id, name, macro_intent, strategic_value, status, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("os_agents").select("id, role, capabilities, agent_type, status, performance_score, last_active_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("os_executions").select("id, status, credits_cost, duration_ms, started_at, completed_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("os_memory_patterns").select("id, pattern_type, category, frequency, effectiveness_score, last_used_at, created_at").eq("user_id", user.id).order("frequency", { ascending: false }).limit(50),
      supabase.from("os_power_unlocks").select("id, capability_key, capability_name, unlocked_at, xp_cost, tier").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
    ]);

    const o = (otosR.data || []) as OTOS[];
    const m = (mmsR.data || []) as MMS[];
    const l = (lcssR.data || []) as LCSS[];
    const a = (agentsR.data || []) as OSAgent[];
    const e = (execR.data || []) as OSExecution[];
    const p = (patR.data || []) as MemoryPattern[];
    const u = (unlR.data || []) as PowerUnlock[];

    setOtos(o); setMms(m); setLcss(l); setAgents(a);
    setExecutions(e); setPatterns(p); setUnlocks(u);

    setStats({
      total_otos: o.length,
      total_mms: m.length,
      total_lcss: l.length,
      total_agents: a.length,
      active_agents: a.filter(x => x.status === "active").length,
      total_executions: e.length,
      total_patterns: p.length,
      unlocked_capabilities: u.length,
    });

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { otos, mms, lcss, agents, executions, patterns, unlocks, stats, loading, reload: load };
}
