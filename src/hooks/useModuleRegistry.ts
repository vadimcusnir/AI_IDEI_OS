/**
 * useModuleRegistry — Fail-closed module registry.
 * If a module is not in registry or not active, it cannot execute.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SystemModule {
  id: string;
  module_key: string;
  name: string;
  module_type: "ui" | "api" | "ai" | "economy" | "infrastructure";
  status: "active" | "deprecated" | "blocked" | "pending";
  description: string;
  min_tier: string;
  version: string;
  dependencies: string[];
  access_requirements: Record<string, unknown>;
}

export function useModuleRegistry() {
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await (supabase.from("system_modules") as any)
      .select("*")
      .order("name");
    setModules((data || []) as SystemModule[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Fail-closed check: module must exist AND be active */
  const isExecutable = useCallback((moduleKey: string): boolean => {
    const mod = modules.find(m => m.module_key === moduleKey);
    return mod?.status === "active";
  }, [modules]);

  /** Get module by key */
  const getModule = useCallback((moduleKey: string): SystemModule | undefined => {
    return modules.find(m => m.module_key === moduleKey);
  }, [modules]);

  return { modules, loading, isExecutable, getModule, reload: load };
}
