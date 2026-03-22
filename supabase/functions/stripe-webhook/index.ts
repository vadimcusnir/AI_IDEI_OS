import Stripe from "npm:stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map Stripe product IDs to NEURONS quotas (must match useSubscription tiers)
const PRODUCT_NEURONS: Record<string, { neurons: number; tierName: string }> = {
  prod_U74a8adWSDNymI: { neurons: 5000, tierName: "Pro Monthly" },
  prod_U74aOlNMMVn7lY: { neurons: 60000, tierName: "Pro Yearly" },
};

const log = (event: string, details?: any) => {
  console.log(`[stripe-webhook] ${event}${details ? ` — ${JSON.stringify(details)}` : ""}`);
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

    log("Event received", { type: event.type, id: event.id });

    // ═══════════════════════════════════════════
    // EVENT-LEVEL IDEMPOTENCY CHECK
    // ═══════════════════════════════════════════
    const { data: existingEvent } = await supabaseAdmin
      .from("stripe_processed_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      log("Event already processed, skipping", { eventId: event.id });
      return ok({ already_processed: true, event_id: event.id });
    }

    // Record this event as being processed
    await supabaseAdmin.from("stripe_processed_events").insert({
      event_id: event.id,
      event_type: event.type,
    });

    // ═══════════════════════════════════════════
    // 1. CHECKOUT SESSION COMPLETED (Top-ups)
    // ═══════════════════════════════════════════
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        log("Session not paid, skipping", { id: session.id });
        return ok();
      }

      // Only process top-up sessions (those with neurons metadata)
      const userId = session.metadata?.user_id;
      const neurons = parseInt(session.metadata?.neurons || "0");
      const packageKey = session.metadata?.package_key;

      if (!userId || neurons <= 0) {
        log("No top-up metadata, might be subscription checkout — skipping credit add", { userId, neurons });
        return ok();
      }

      if (neurons > 50_000) {
        log("Invalid neuron amount, skipping", { neurons });
        return ok();
      }

      // Idempotency
      const description = `STRIPE TOPUP: +${neurons} NEURONS (${session.id})`;
      const { data: existingTx } = await supabaseAdmin
        .from("credit_transactions")
        .select("id")
        .eq("description", description)
        .maybeSingle();

      if (existingTx) {
        log("Already processed", { sessionId: session.id });
        return ok({ already_processed: true });
      }

      // Add credits
      const { data: added } = await supabaseAdmin.rpc("add_credits", {
        _user_id: userId,
        _amount: neurons,
        _description: description,
        _type: "topup",
      });

      if (!added) {
        log("Failed to add credits", { userId });
        return new Response(JSON.stringify({ error: "Failed to add credits" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notify + XP
      await Promise.all([
        supabaseAdmin.from("notifications").insert({
          user_id: userId,
          type: "credits_added",
          title: `+${neurons} NEURONS adăugați`,
          message: `Plata pentru pachetul ${packageKey || "top-up"} a fost procesată cu succes.`,
          link: "/credits",
          meta: { neurons, session_id: session.id, package_key: packageKey },
        }),
        supabaseAdmin.rpc("award_xp", {
          _user_id: userId,
          _amount: Math.min(Math.floor(neurons / 10), 100),
          _source: "topup",
          _description: `Purchased ${neurons} NEURONS`,
        }),
      ]);

      log(`✅ Top-up: +${neurons} NEURONS for ${userId}`);
    }

    // ═══════════════════════════════════════════
    // 2. INVOICE PAID (Subscription renewals)
    // ═══════════════════════════════════════════
    else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      // Only process subscription invoices
      if (!invoice.subscription || invoice.billing_reason === "manual") {
        log("Not a subscription invoice, skipping");
        return ok();
      }

      const customerEmail = invoice.customer_email;
      if (!customerEmail) {
        log("No customer email on invoice, skipping");
        return ok();
      }

      // Get product from line items
      const lineItem = invoice.lines?.data?.[0];
      const productId = typeof lineItem?.price?.product === "string"
        ? lineItem.price.product
        : (lineItem?.price?.product as any)?.id;

      const productConfig = productId ? PRODUCT_NEURONS[productId] : null;
      if (!productConfig) {
        log("Unknown product, skipping credit allocation", { productId });
        return ok();
      }

      // Find user by email
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users?.find((u) => u.email === customerEmail);
      if (!user) {
        log("User not found for email", { customerEmail });
        return ok();
      }

      // Idempotency
      const description = `SUBSCRIPTION: +${productConfig.neurons} NEURONS — ${productConfig.tierName} (${invoice.id})`;
      const { data: existingTx } = await supabaseAdmin
        .from("credit_transactions")
        .select("id")
        .eq("description", description)
        .maybeSingle();

      if (existingTx) {
        log("Already processed invoice", { invoiceId: invoice.id });
        return ok({ already_processed: true });
      }

      // Credit NEURONS quota
      const { data: added } = await supabaseAdmin.rpc("add_credits", {
        _user_id: user.id,
        _amount: productConfig.neurons,
        _description: description,
        _type: "subscription",
      });

      if (added) {
        await supabaseAdmin.from("notifications").insert({
          user_id: user.id,
          type: "credits_added",
          title: `+${productConfig.neurons.toLocaleString()} NEURONS — ${productConfig.tierName}`,
          message: `Cota ta lunară de NEURONS a fost creditată automat.`,
          link: "/credits",
          meta: { neurons: productConfig.neurons, invoice_id: invoice.id, tier: productConfig.tierName },
        });
        log(`✅ Subscription renewal: +${productConfig.neurons} NEURONS for ${user.id}`);
      }
    }

    // ═══════════════════════════════════════════
    // 3. SUBSCRIPTION DELETED (Cancellation)
    // ═══════════════════════════════════════════
    else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

      // Get customer email
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || (customer as any).deleted) {
        log("Customer deleted or not found", { customerId });
        return ok();
      }

      const email = (customer as Stripe.Customer).email;
      if (!email) {
        log("No email on customer", { customerId });
        return ok();
      }

      // Find user
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users?.find((u) => u.email === email);
      if (!user) {
        log("User not found for cancelled subscription", { email });
        return ok();
      }

      // Notify
      await supabaseAdmin.from("notifications").insert({
        user_id: user.id,
        type: "subscription_cancelled",
        title: "Abonament anulat",
        message: "Abonamentul tău a fost anulat. Poți reînnoi oricând din pagina de credite.",
        link: "/credits",
        meta: { subscription_id: subscription.id },
      });

      log(`⚠️ Subscription cancelled for ${user.id}`);
    }

    // ═══════════════════════════════════════════
    // 4. PAYMENT FAILED
    // ═══════════════════════════════════════════
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerEmail = invoice.customer_email;

      if (customerEmail) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === customerEmail);
        if (user) {
          await supabaseAdmin.from("notifications").insert({
            user_id: user.id,
            type: "payment_failed",
            title: "Plată eșuată",
            message: "Plata pentru abonament nu a putut fi procesată. Verifică metoda de plată.",
            link: "/credits",
            meta: { invoice_id: invoice.id },
          });
          log(`⚠️ Payment failed for ${user.id}`);
        }
      }
    }

    return ok();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("stripe-webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function ok(extra?: Record<string, any>) {
  return new Response(JSON.stringify({ received: true, ...extra }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
