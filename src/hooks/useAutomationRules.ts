import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import i18next from "i18next";

export const TRIGGER_EVENTS = [
  { key: "low_credits", labelKey: "rules.trigger_low_credits", descKey: "rules.trigger_low_credits_desc" },
  { key: "job_failed", labelKey: "rules.trigger_job_failed", descKey: "rules.trigger_job_failed_desc" },
  { key: "storage_80", labelKey: "rules.trigger_storage_80", descKey: "rules.trigger_storage_80_desc" },
  { key: "daily_spend_high", labelKey: "rules.trigger_daily_spend", descKey: "rules.trigger_daily_spend_desc" },
  { key: "subscription_expiring", labelKey: "rules.trigger_sub_expiring", descKey: "rules.trigger_sub_expiring_desc" },
] as const;

export const ACTION_TYPES = [
  { key: "notify", labelKey: "rules.action_notify", descKey: "rules.action_notify_desc" },
  { key: "retry_job", labelKey: "rules.action_retry", descKey: "rules.action_retry_desc" },
  { key: "pause_jobs", labelKey: "rules.action_pause", descKey: "rules.action_pause_desc" },
  { key: "email_alert", labelKey: "rules.action_email", descKey: "rules.action_email_desc" },
] as const;

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  condition: Json;
  action_type: string;
  action_config: Json;
  is_active: boolean;
  fire_count: number;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useAutomationRules() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["automation-rules", user?.id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AutomationRule[];
    },
    enabled: !!user?.id,
  });

  const createRule = useMutation({
    mutationFn: async (rule: Partial<AutomationRule>) => {
      const { condition, action_config, ...rest } = rule;
      const { data, error } = await supabase
        .from("automation_rules")
        .insert({
          user_id: user!.id,
          ...rest,
          condition: (condition ?? {}) as Json,
          action_config: (action_config ?? {}) as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success(i18next.t("common:rules.rule_created"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, condition, action_config, ...updates }: Partial<AutomationRule> & { id: string }) => {
      const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
      if (condition !== undefined) payload.condition = condition as Json;
      if (action_config !== undefined) payload.action_config = action_config as Json;
      const { error } = await supabase
        .from("automation_rules")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success(i18next.t("common:rules.rule_updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success(i18next.t("common:rules.rule_deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    rules: query.data ?? [],
    loading: query.isLoading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}
