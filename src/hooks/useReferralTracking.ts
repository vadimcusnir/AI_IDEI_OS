/**
 * useReferralTracking — Tracks referral codes from URL params.
 * Stores referrer info in localStorage, attributes on signup.
 * 
 * URL format: ?ref=USER_ID or ?ref=USERNAME
 */

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const REF_KEY = "referral_code";
const REF_TIMESTAMP = "referral_ts";

export function useReferralCapture() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && !localStorage.getItem(REF_KEY)) {
      localStorage.setItem(REF_KEY, ref);
      localStorage.setItem(REF_TIMESTAMP, Date.now().toString());

      supabase.from("analytics_events").insert({
        event_name: "referral_click",
        event_params: { referrer_code: ref, landing_page: window.location.pathname },
        session_id: sessionStorage.getItem("session_id") ?? crypto.randomUUID(),
      }).then(() => {});
    }
  }, [searchParams]);
}

export function useReferralAttribution() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const ref = localStorage.getItem(REF_KEY);
    if (!ref) return;

    const attributed = localStorage.getItem(`ref_attributed_${user.id}`);
    if (attributed) return;

    supabase.from("analytics_events").insert({
      event_name: "referral_signup",
      user_id: user.id,
      event_params: {
        referrer_code: ref,
        time_to_signup_ms: Date.now() - Number(localStorage.getItem(REF_TIMESTAMP) || 0),
      },
      session_id: sessionStorage.getItem("session_id") ?? crypto.randomUUID(),
    }).then(() => {
      localStorage.setItem(`ref_attributed_${user.id}`, "true");
    });
  }, [user?.id]);
}

export function getReferralLink(userId: string): string {
  return `https://ai-idei.com?ref=${userId}`;
}
