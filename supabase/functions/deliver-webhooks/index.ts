import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const MAX_RETRIES = 3;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get pending deliveries
    const { data: deliveries, error } = await supabase
      .from("webhook_deliveries")
      .select("*, webhook_endpoints!inner(*)")
      .eq("status", "pending")
      .lte("attempt", MAX_RETRIES)
      .order("created_at")
      .limit(20);

    if (error) throw error;
    if (!deliveries?.length) {
      return new Response(JSON.stringify({ delivered: 0 }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    let delivered = 0;
    for (const delivery of deliveries) {
      const endpoint = delivery.webhook_endpoints;
      if (!endpoint?.is_active) continue;

      // Create HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(endpoint.secret),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const payloadStr = JSON.stringify(delivery.payload);
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
      const sigHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

      try {
        const resp = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": `sha256=${sigHex}`,
            "X-Webhook-Event": delivery.event_type,
            "X-Webhook-Delivery": delivery.id,
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000),
        });

        await supabase.from("webhook_deliveries").update({
          status: resp.ok ? "delivered" : "failed",
          response_status: resp.status,
          response_body: (await resp.text()).slice(0, 1000),
          delivered_at: resp.ok ? new Date().toISOString() : null,
        }).eq("id", delivery.id);

        if (resp.ok) {
          delivered++;
          await supabase.from("webhook_endpoints").update({
            failure_count: 0,
            last_triggered_at: new Date().toISOString(),
          }).eq("id", endpoint.id);
        } else {
          // Increment failure, retry later
          await supabase.from("webhook_deliveries").update({
            attempt: delivery.attempt + 1,
            status: delivery.attempt + 1 >= MAX_RETRIES ? "failed" : "pending",
          }).eq("id", delivery.id);

          await supabase.from("webhook_endpoints").update({
            failure_count: endpoint.failure_count + 1,
            ...(endpoint.failure_count + 1 >= 10 ? { is_active: false } : {}),
          }).eq("id", endpoint.id);
        }
      } catch (fetchErr) {
        await supabase.from("webhook_deliveries").update({
          status: delivery.attempt + 1 >= MAX_RETRIES ? "failed" : "pending",
          attempt: delivery.attempt + 1,
          response_body: String(fetchErr).slice(0, 500),
        }).eq("id", delivery.id);
      }
    }

    return new Response(JSON.stringify({ delivered, total: deliveries.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
