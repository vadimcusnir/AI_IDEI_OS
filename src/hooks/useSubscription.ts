import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ALL_TIERS, SUBSCRIPTION_TIERS, ANNUAL_TIERS, NEURONS_EXCHANGE_RATE } from "@/config/economyConfig";

export { SUBSCRIPTION_TIERS, ANNUAL_TIERS, NEURONS_EXCHANGE_RATE };

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  tier: string | null;
  loading: boolean;
}

// Global cache to prevent duplicate calls across hook instances
let _cache: { data: SubscriptionState; ts: number } | null = null;
let _inflight: Promise<void> | null = null;
const CACHE_TTL = 5 * 60 * 1000;
const POLL_INTERVAL = 5 * 60 * 1000;

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>(
    _cache ? _cache.data : {
      subscribed: false,
      productId: null,
      subscriptionEnd: null,
      tier: null,
      loading: true,
    }
  );
  const mountedRef = useRef(true);

  const checkSubscription = useCallback(async (force = false) => {
    if (!session?.access_token) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    if (!force && _cache && Date.now() - _cache.ts < CACHE_TTL) {
      if (mountedRef.current) setState(_cache.data);
      return;
    }

    if (_inflight) {
      await _inflight;
      if (_cache && mountedRef.current) setState(_cache.data);
      return;
    }

    _inflight = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-subscription", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (error) throw error;

        let tier: string | null = null;
        if (data?.product_id) {
          const found = Object.entries(ALL_TIERS).find(
            ([, t]) => t.product_id === data.product_id
          );
          if (found) tier = found[0];
        }

        const newState: SubscriptionState = {
          subscribed: data?.subscribed ?? false,
          productId: data?.product_id ?? null,
          subscriptionEnd: data?.subscription_end ?? null,
          tier,
          loading: false,
        };

        _cache = { data: newState, ts: Date.now() };
        if (mountedRef.current) setState(newState);
      } catch {
        if (mountedRef.current) setState(s => ({ ...s, loading: false }));
      } finally {
        _inflight = null;
      }
    })();

    await _inflight;
  }, [session?.access_token]);

  useEffect(() => {
    mountedRef.current = true;
    checkSubscription();
    const interval = setInterval(() => checkSubscription(), POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkSubscription]);

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

      if (error) throw new Error(error.message || "Eroare la crearea sesiunii de plată.");
      if (!data?.url) throw new Error("Nu s-a primit URL-ul de checkout de la Stripe.");

      window.location.href = data.url;
    } catch (e: any) {
      const message = e?.message || "A apărut o eroare. Încearcă din nou.";
      toast.error(message);
      throw e;
    }
  };

  const subscribe = (priceId: string) => createCheckoutSession(priceId, "subscription");
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
