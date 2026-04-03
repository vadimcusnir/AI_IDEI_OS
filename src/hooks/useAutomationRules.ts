import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export const TRIGGER_EVENTS = [
  { key: "low_credits", label: "Credite scăzute", description: "Când soldul scade sub un prag" },
  { key: "job_failed", label: "Job eșuat", description: "Când un job se termină cu eroare" },
  { key: "storage_80", label: "Storage 80%+", description: "Când spațiul de stocare depășește 80%" },
  { key: "daily_spend_high", label: "Consum zilnic ridicat", description: "Când cheltuielile zilnice depășesc un prag" },
  { key: "subscription_expiring", label: "Abonament expiră", description: "Cu 3 zile înainte de expirare" },
] as const;

export const ACTION_TYPES = [
  { key: "notify", label: "Notificare", description: "Trimite notificare in-app" },
  { key: "retry_job", label: "Retry job", description: "Reîncearcă automat job-ul eșuat" },
  { key: "pause_jobs", label: "Pauză joburi", description: "Oprește execuțiile noi temporar" },
  { key: "email_alert", label: "Email alert", description: "Trimite email de alertă" },
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
      const { data, error } = await supabase
        .from("automation_rules")
        .insert({ user_id: user!.id, ...rule })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Regulă creată");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutomationRule> & { id: string }) => {
      const { error } = await supabase
        .from("automation_rules")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Regulă actualizată");
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
      toast.success("Regulă ștearsă");
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
