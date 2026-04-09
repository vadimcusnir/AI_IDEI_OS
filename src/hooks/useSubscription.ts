import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SUBSCRIPTION_TIERS, NEURONS_EXCHANGE_RATE } from "@/config/economyConfig";

export { SUBSCRIPTION_TIERS, NEURONS_EXCHANGE_RATE };

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  tier: keyof typeof SUBSCRIPTION_TIERS | null;
  loading: boolean;
}

// Global cache to prevent duplicate calls across hook instances
let _cache: { data: SubscriptionState; ts: number } | null = null;
let _inflight: Promise<void> | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes (was 60s — caused 429s)

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

    // Return cached result if fresh enough
    if (!force && _cache && Date.now() - _cache.ts < CACHE_TTL) {
      if (mountedRef.current) setState(_cache.data);
      return;
    }

    // Deduplicate in-flight requests
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

        let tier: keyof typeof SUBSCRIPTION_TIERS | null = null;
        if (data?.product_id) {
          const found = Object.entries(SUBSCRIPTION_TIERS).find(
            ([, t]) => t.product_id === data.product_id
          );
          if (found) tier = found[0] as keyof typeof SUBSCRIPTION_TIERS;
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
