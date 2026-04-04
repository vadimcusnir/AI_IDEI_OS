/**
 * intent-router — Routes user intent to top MMS/OTOS candidates.
 * Input: { intent: string, audience_type?: string, context?: object, user_id?: string }
 * Output: { intent_key, candidates: [{ mms_id, name, confidence, neurons_cost, expected_outputs }], quick_actions: [...] }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":intent-router", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const { intent, audience_type, context, user_id } = await req.json();

    if (!intent || typeof intent !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'intent' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Load active intents and find best match
    const { data: intents } = await supabase
      .from("intent_map")
      .select("*")
      .eq("is_active", true);

    const intentLower = intent.toLowerCase();
    let matchedIntent = null;
    let bestScore = 0;

    for (const im of intents || []) {
      let score = 0;
      // Direct key match
      if (intentLower.includes(im.intent_key.replace(/_/g, " "))) score += 3;
      // Domain filter match
      for (const domain of im.domain_filter || []) {
        if (intentLower.includes(domain)) score += 1;
      }
      // Label match
      if (intentLower.includes(im.label.toLowerCase())) score += 2;
      if (intentLower.includes(im.label_ro.toLowerCase())) score += 2;

      if (score > bestScore) {
        bestScore = score;
        matchedIntent = im;
      }
    }

    // Fallback to get_clients if no match
    if (!matchedIntent) {
      matchedIntent = (intents || []).find((i: any) => i.intent_key === "get_clients") || intents?.[0];
    }

    const intentKey = matchedIntent?.intent_key || "get_clients";
    const domainFilter = matchedIntent?.domain_filter || [];

    // 2. Find top OTOS matching domain filter (quick actions)
    const { data: topOtos } = await supabase
      .from("os_otos")
      .select("id, name, domain, neurons_cost, score_tier, mechanism")
      .in("domain", domainFilter)
      .in("score_tier", ["S", "A"])
      .eq("status", "active")
      .order("score_total", { ascending: false })
      .limit(5);

    // 3. Find MMS candidates matching intent domains
    const { data: allMms } = await supabase
      .from("os_mms")
      .select("id, name, intent, bundle_price_neurons, otos_ids, score_total, description")
      .eq("status", "active")
      .order("score_total", { ascending: false });

    // Score MMS by domain overlap with intent
    const scoredMms = (allMms || []).map((mms: any) => {
      let confidence = 0.3;
      const mmsIntent = (mms.intent || "").toLowerCase();
      
      for (const domain of domainFilter) {
        if (mmsIntent.includes(domain)) confidence += 0.15;
        if ((mms.name || "").toLowerCase().includes(domain)) confidence += 0.1;
      }
      if (intentLower.includes(mmsIntent)) confidence += 0.2;
      
      return {
        mms_id: mms.id,
        name: mms.name,
        description: mms.description,
        confidence: Math.min(0.95, confidence),
        neurons_cost: mms.bundle_price_neurons || 0,
        expected_outputs: (mms.otos_ids || []).length,
        otos_count: (mms.otos_ids || []).length,
      };
    }).sort((a: any, b: any) => b.confidence - a.confidence).slice(0, 3);

    return new Response(JSON.stringify({
      intent_key: intentKey,
      intent_label: matchedIntent?.label || intentKey,
      intent_label_ro: matchedIntent?.label_ro || "",
      match_confidence: bestScore > 0 ? Math.min(0.95, 0.4 + bestScore * 0.1) : 0.3,
      candidates: scoredMms,
      quick_actions: (topOtos || []).map((o: any) => ({
        otos_id: o.id,
        name: o.name,
        domain: o.domain,
        neurons_cost: o.neurons_cost,
        tier: o.score_tier,
        mechanism: o.mechanism,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
