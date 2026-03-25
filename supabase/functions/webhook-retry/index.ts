import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * P3-011: Webhook Reliability Upgrade
 * Retry logic with exponential backoff and dead-letter queue
 * for failed webhook deliveries.
 */
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch pending webhook deliveries that need retry
    const { data: pending } = await supabase
      .from("webhook_deliveries")
      .select("id, endpoint_id, payload, attempt_count, max_attempts, last_error")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20);

    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let succeeded = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const delivery of pending) {
      // Get endpoint URL
      const { data: endpoint } = await supabase
        .from("webhook_endpoints")
        .select("url, secret, is_active")
        .eq("id", delivery.endpoint_id)
        .single();

      if (!endpoint || !endpoint.is_active) {
        await supabase.from("webhook_deliveries").update({
          status: "skipped",
          last_error: "Endpoint inactive or not found",
        }).eq("id", delivery.id);
        continue;
      }

      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": endpoint.secret || "",
            "X-Delivery-Id": delivery.id,
          },
          body: JSON.stringify(delivery.payload),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (response.ok) {
          await supabase.from("webhook_deliveries").update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
            attempt_count: (delivery.attempt_count || 0) + 1,
          }).eq("id", delivery.id);
          succeeded++;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        const attempts = (delivery.attempt_count || 0) + 1;
        const maxAttempts = delivery.max_attempts || 5;
        const isDead = attempts >= maxAttempts;

        await supabase.from("webhook_deliveries").update({
          status: isDead ? "dead_letter" : "pending",
          attempt_count: attempts,
          last_error: (err as Error).message,
          // Exponential backoff: next retry after 2^attempts seconds
          next_retry_at: isDead ? null : new Date(Date.now() + Math.pow(2, attempts) * 1000).toISOString(),
        }).eq("id", delivery.id);

        if (isDead) deadLettered++;
        else failed++;
      }
    }

    return new Response(JSON.stringify({
      processed: pending.length,
      succeeded,
      retrying: failed,
      dead_lettered: deadLettered,
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
