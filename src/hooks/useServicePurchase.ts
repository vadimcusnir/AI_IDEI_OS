/**
 * useServicePurchase — Hook for purchasing and executing services.
 * Handles the full flow: invoke edge function → track status → return deliverable.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";

interface PurchaseParams {
  service_slug: string;
  service_level: "L1" | "L2" | "L3";
  user_input: string;
  neuron_ids?: number[];
}

interface PurchaseResult {
  success: boolean;
  purchase_id?: string;
  deliverable_id?: string;
  content?: string;
  service_name?: string;
  credits_spent?: number;
  error?: string;
}

export function useServicePurchase() {
  const { user } = useAuth();
  const { refetch: refetchBalance } = useCreditBalance();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  const purchase = async (params: PurchaseParams): Promise<PurchaseResult> => {
    if (!user) {
      toast.error("Authentication required");
      return { success: false, error: "Not authenticated" };
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("execute-service", {
        body: params,
      });

      if (error) {
        const msg = error.message || "Service execution failed";
        toast.error(msg);
        const res: PurchaseResult = { success: false, error: msg };
        setResult(res);
        return res;
      }

      if (data?.error) {
        toast.error(data.error);
        const res: PurchaseResult = { success: false, error: data.error };
        setResult(res);
        return res;
      }

      await refetchBalance();
      toast.success(`${data.service_name || "Service"} completed!`);

      const res: PurchaseResult = {
        success: true,
        purchase_id: data.purchase_id,
        deliverable_id: data.deliverable_id,
        content: data.content,
        service_name: data.service_name,
        credits_spent: data.credits_spent,
      };
      setResult(res);
      return res;
    } catch (err: any) {
      const msg = err.message || "Unexpected error";
      toast.error(msg);
      const res: PurchaseResult = { success: false, error: msg };
      setResult(res);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { purchase, loading, result };
}
