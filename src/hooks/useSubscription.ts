import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const NEURONS_EXCHANGE_RATE = 0.002; // 1 NEURON = $0.002 USD → $1 = 500 NEURONS

export const SUBSCRIPTION_TIERS = {
  starter_monthly: {
    price_id: "price_1TIKY1IK7fwtty4owN1RjdOy",
    product_id: "prod_UGsIVXzAl33sDX",
    name: "Starter",
    price: 23,
    interval: "month" as const,
    neurons_quota: 3000,
    execution_discount: 0.10,
    features: ["3,000 NEURONS / lună", "Servicii AI de bază", "Extracție & structurare", "Library access", "-10% cost execuție"],
  },
  pro_monthly: {
    price_id: "price_1TIKYHIK7fwtty4o4Sa2M9BK",
    product_id: "prod_UGsI5IhppWlJ1B",
    name: "Pro",
    price: 47,
    interval: "month" as const,
    neurons_quota: 10000,
    execution_discount: 0.20,
    features: ["10,000 NEURONS / lună", "Toate serviciile AI", "Procesare prioritară", "Batch processing", "Analytics avansat", "Knowledge Graph", "-20% cost execuție"],
  },
  vip_monthly: {
    price_id: "price_1TIKYJIK7fwtty4ovNton4Pq",
    product_id: "prod_UGsI4kjBe8Km2J",
    name: "VIP",
    price: 95,
    interval: "month" as const,
    neurons_quota: 30000,
    execution_discount: 0.40,
    features: ["30,000 NEURONS / lună", "Tot din Pro", "Locuri nelimitate", "SLA & suport dedicat", "API access", "NOTA2 benefits", "-40% cost execuție"],
  },
  enterprise_monthly: {
    price_id: "price_1TIKYQIK7fwtty4oDzVo8A9X",
    product_id: "prod_UGsJp3Rln1QfqD",
    name: "Enterprise",
    price: 137,
    interval: "month" as const,
    neurons_quota: 50000,
    execution_discount: 0.50,
    features: ["50,000 NEURONS / lună", "Tot din VIP", "API nelimitat", "White-label reports", "Dedicated account manager", "Custom workflows", "-50% cost execuție"],
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

  /**
   * Unified checkout — creates a Stripe Checkout session and redirects.
   * @param priceId — Stripe price ID
   * @param mode — 'subscription' for recurring, 'payment' for one-time top-ups
   */
  const createCheckoutSession = async (
    priceId: string,
    mode: "subscription" | "payment" = "subscription"
  ) => {
    if (!session?.access_token) {
      toast.error("Trebuie să fii autentificat pentru a continua.");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { price_id: priceId, mode },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        throw new Error(error.message || "Eroare la crearea sesiunii de plată.");
      }

      if (!data?.url) {
        throw new Error("Nu s-a primit URL-ul de checkout de la Stripe.");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (e: any) {
      const message = e?.message || "A apărut o eroare. Încearcă din nou.";
      toast.error(message);
      throw e;
    }
  };

  /** Shortcut: subscribe to a recurring plan */
  const subscribe = (priceId: string) => createCheckoutSession(priceId, "subscription");

  /** Shortcut: one-time NEURONS purchase */
  const buyNeurons = (priceId: string) => createCheckoutSession(priceId, "payment");

  const manageSubscription = async () => {
    if (!session?.access_token) return;
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Eroare la deschiderea portalului.");
    }
  };

  return {
    ...state,
    checkSubscription,
    createCheckoutSession,
    subscribe,
    buyNeurons,
    manageSubscription,
  };
}
