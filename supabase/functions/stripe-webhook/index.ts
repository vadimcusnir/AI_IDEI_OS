import Stripe from "npm:stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  try {
    // Verify Stripe signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Webhook signature verification failed:", msg);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle checkout.session.completed for top-ups
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only process paid sessions with our metadata
      if (session.payment_status !== "paid") {
        console.log("Session not paid yet, skipping:", session.id);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = session.metadata?.user_id;
      const neurons = parseInt(session.metadata?.neurons || "0");
      const packageKey = session.metadata?.package_key;

      if (!userId || neurons <= 0 || neurons > 50_000) {
        console.log("Missing or invalid metadata, skipping:", { userId, neurons, packageKey });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Idempotency check — don't double-credit
      const description = `STRIPE TOPUP: +${neurons} NEURONS (${session.id})`;
      const { data: existingTx } = await supabaseAdmin
        .from("credit_transactions")
        .select("id")
        .eq("description", description)
        .maybeSingle();

      if (existingTx) {
        console.log("Already processed session:", session.id);
        return new Response(JSON.stringify({ received: true, already_processed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add credits atomically
      const { data: added } = await supabaseAdmin.rpc("add_credits", {
        _user_id: userId,
        _amount: neurons,
        _description: description,
        _type: "topup",
      });

      if (!added) {
        console.error("Failed to add credits for user:", userId);
        return new Response(JSON.stringify({ error: "Failed to add credits" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notify user
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        type: "credits_added",
        title: `+${neurons} NEURONS adăugați`,
        message: `Plata pentru pachetul ${packageKey || "top-up"} a fost procesată cu succes.`,
        link: "/credits",
        meta: { neurons, session_id: session.id, package_key: packageKey },
      });

      // Award XP for purchase
      await supabaseAdmin.rpc("award_xp", {
        _user_id: userId,
        _amount: Math.min(Math.floor(neurons / 10), 100),
        _source: "topup",
        _description: `Purchased ${neurons} NEURONS`,
      });

      console.log(`✅ Added ${neurons} NEURONS to user ${userId} (session: ${session.id})`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("stripe-webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
