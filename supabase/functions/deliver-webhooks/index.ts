import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const MAX_RETRIES = 3;

/**
 * deliver-webhooks — Process pending webhook deliveries.
 * SECURITY: Requires internal secret or service-role auth.
 */
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Security: Only allow internal calls (cron, admin, or service-role)
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const providedSecret = req.headers.get("X-Internal-Secret");
  const authHeader = req.headers.get("Authorization");

  let isAuthorized = false;

  // Check internal secret
  if (internalSecret && providedSecret) {
    // Constant-time comparison
    const a = new TextEncoder().encode(internalSecret);
    const b = new TextEncoder().encode(providedSecret);
    if (a.length === b.length) {
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
      isAuthorized = diff === 0;
    }
  }

  // Fallback: check if caller is admin via JWT
  if (!isAuthorized && authHeader) {
    const supabaseCheck = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user } } = await supabaseCheck.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (user) {
      const { data: hasAdmin } = await supabaseCheck.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      isAuthorized = !!hasAdmin;
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

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
          response_body: "Delivery failed",
        }).eq("id", delivery.id);
      }
    }

    return new Response(JSON.stringify({ delivered, total: deliveries.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
