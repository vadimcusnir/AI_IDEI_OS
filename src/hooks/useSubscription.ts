import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const SUBSCRIPTION_TIERS = {
  core_monthly: {
    price_id: "price_1T8qQtIK7fwtty4o6GFGNU28",
    product_id: "prod_U74a8adWSDNymI",
    name: "Core",
    price: 11,
    interval: "month" as const,
    neurons_quota: 2000,
    features: ["Toate serviciile AI", "Extracție nelimitată", "Knowledge Graph"],
  },
  pro_monthly: {
    price_id: "price_1T8qRgIK7fwtty4ox2y0cEZJ",
    product_id: "prod_U74aOlNMMVn7lY",
    name: "Pro",
    price: 47,
    interval: "month" as const,
    neurons_quota: 10000,
    features: ["Tot din Core", "Procesare prioritară", "Batch processing", "Analytics avansat"],
  },
  elite_monthly: {
    price_id: "price_elite_placeholder",
    product_id: "prod_elite_placeholder",
    name: "Elite",
    price: 137,
    interval: "month" as const,
    neurons_quota: 50000,
    features: ["Tot din Pro", "Locuri nelimitate", "SLA & suport dedicat", "NOTA2 benefits"],
  },
} as const;

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  tier: keyof typeof SUBSCRIPTION_TIERS | null;
  loading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    tier: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      let tier: keyof typeof SUBSCRIPTION_TIERS | null = null;
      if (data?.product_id) {
        const found = Object.entries(SUBSCRIPTION_TIERS).find(
          ([, t]) => t.product_id === data.product_id
        );
        if (found) tier = found[0] as keyof typeof SUBSCRIPTION_TIERS;
      }

      setState({
        subscribed: data?.subscribed ?? false,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        tier,
        loading: false,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [session?.access_token]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const subscribe = async (priceId: string) => {
    if (!session?.access_token) return;
    const { data, error } = await supabase.functions.invoke("create-subscription", {
      body: { priceId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  const manageSubscription = async () => {
    if (!session?.access_token) return;
    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  return {
    ...state,
    checkSubscription,
    subscribe,
    manageSubscription,
  };
}
