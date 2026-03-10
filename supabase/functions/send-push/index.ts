import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Validate caller: internal secret (from DB trigger) or service role key
    const internalSecret = req.headers.get("x-internal-secret");
    const authHeader = req.headers.get("authorization");
    let authorized = false;

    if (internalSecret) {
      const { data } = await supabaseAdmin
        .from("push_config")
        .select("value")
        .eq("key", "internal_secret")
        .single();
      authorized = data?.value === internalSecret;
    }

    if (!authorized && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      authorized = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { user_id, title, message, link, type } = await req.json();
    if (!user_id) throw new Error("Missing user_id");

    // Get VAPID keys
    const { data: config } = await supabaseAdmin
      .from("push_config")
      .select("key, value")
      .in("key", ["vapid_public", "vapid_private"]);

    if (!config || config.length < 2) {
      return new Response(JSON.stringify({ sent: 0, reason: "vapid_not_configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublic = config.find((c: any) => c.key === "vapid_public")!.value;
    const vapidPrivate = config.find((c: any) => c.key === "vapid_private")!.value;

    webpush.setVapidDetails("mailto:admin@ai-idei.com", vapidPublic, vapidPrivate);

    // Check user's notification preferences
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("push_enabled, push_jobs, push_credits, push_feedback, push_versions")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!prefs?.push_enabled) {
      return new Response(JSON.stringify({ sent: 0, reason: "push_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check type-specific preferences
    const typePrefs: Record<string, boolean> = {
      job_completed: prefs.push_jobs,
      job_failed: prefs.push_jobs,
      credits_low: prefs.push_credits,
      feedback_response: prefs.push_feedback,
      feedback_new: prefs.push_feedback,
      version_created: prefs.push_versions,
      artifact_created: prefs.push_jobs,
    };

    if (type && type in typePrefs && !typePrefs[type]) {
      return new Response(JSON.stringify({ sent: 0, reason: "type_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's push subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, message, link });
    let sent = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        console.error("Push send error:", err.message);
        // Remove expired subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-push error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
