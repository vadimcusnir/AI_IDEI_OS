/**
 * useABTest — Lightweight A/B testing hook with persistent variant assignment.
 * Stores variant in localStorage, tracks impressions + conversions via analytics_events.
 * 
 * Usage:
 *   const { variant, trackConversion } = useABTest("cta_color", ["blue", "gold", "green"]);
 *   return <Button className={variant === "gold" ? "bg-gold" : "bg-primary"} onClick={trackConversion} />
 */

import { useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ABTestOptions<V extends string> {
  /** Experiment name (unique key) */
  experiment: string;
  /** Variant options */
  variants: V[];
  /** Weight distribution (must sum to 1). Default: equal weights */
  weights?: number[];
}

interface ABTestResult<V extends string> {
  variant: V;
  trackConversion: (label?: string) => void;
}

function pickVariant<V extends string>(variants: V[], weights?: number[]): V {
  if (!weights || weights.length !== variants.length) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r <= sum) return variants[i];
  }
  return variants[variants.length - 1];
}

export function useABTest<V extends string>({
  experiment,
  variants,
  weights,
}: ABTestOptions<V>): ABTestResult<V> {
  const { user } = useAuth();
  const impressionSent = useRef(false);

  const variant = useMemo(() => {
    const key = `ab_${experiment}`;
    const stored = localStorage.getItem(key) as V | null;
    if (stored && variants.includes(stored)) return stored;

    const picked = pickVariant(variants, weights);
    localStorage.setItem(key, picked);
    return picked;
  }, [experiment, variants.join(",")]);

  // Track impression once
  useEffect(() => {
    if (impressionSent.current) return;
    impressionSent.current = true;

    supabase.from("analytics_events").insert({
      event_name: "ab_impression",
      user_id: user?.id ?? null,
      session_id: sessionStorage.getItem("session_id") ?? crypto.randomUUID(),
      event_params: { experiment, variant },
    }).then(() => {});
  }, [experiment, variant, user?.id]);

  const trackConversion = (label?: string) => {
    supabase.from("analytics_events").insert({
      event_name: "ab_conversion",
      user_id: user?.id ?? null,
      session_id: sessionStorage.getItem("session_id") ?? crypto.randomUUID(),
      event_params: { experiment, variant, label: label ?? "click" },
    }).then(() => {});
  };

  return { variant, trackConversion };
}
