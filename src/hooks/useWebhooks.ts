import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import i18next from "i18next";

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  description: string;
  failure_count: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  status: string;
  attempt: number;
  delivered_at: string | null;
  created_at: string;
}

export function useWebhookEndpoints() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .select("id, user_id, url, events, is_active, description, failure_count, last_triggered_at, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WebhookEndpoint[];
    },
    enabled: !!user,
  });
}

export function useWebhookDeliveries(endpointId: string | undefined) {
  return useQuery({
    queryKey: ["webhook-deliveries", endpointId],
    queryFn: async () => {
      if (!endpointId) return [];
      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select("*")
        .eq("endpoint_id", endpointId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as WebhookDelivery[];
    },
    enabled: !!endpointId,
  });
}

export function useCreateWebhookEndpoint() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ url, events, description }: { url: string; events: string[]; description?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .insert({ user_id: user.id, url, events, description: description || "" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook-endpoints"] });
      toast.success(i18next.t("common:webhook_created"));
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteWebhookEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook-endpoints"] });
      toast.success(i18next.t("common:webhook_deleted"));
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useToggleWebhookEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("webhook_endpoints").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook-endpoints"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}
