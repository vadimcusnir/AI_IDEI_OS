import Stripe from "npm:stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

// Product → tier mapping (must match economyConfig.ts SUBSCRIPTION_TIERS)
const PRODUCT_TIERS: Record<string, { tier: string; neurons: number; label: string }> = {
  prod_UGsIVXzAl33sDX: { tier: "starter", neurons: 3000, label: "Starter" },
  prod_UGsI5IhppWlJ1B: { tier: "pro", neurons: 10000, label: "Pro" },
  prod_UGsI4kjBe8Km2J: { tier: "vip", neurons: 30000, label: "VIP" },
  prod_UGsJp3Rln1QfqD: { tier: "enterprise", neurons: 50000, label: "Enterprise" },
};

const log = (step: string, details?: any) => {
  const d = details ? ` — ${JSON.stringify(details)}` : "";
  console.log(`[stripe-webhook] ${step}${d}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });
  const db = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("[stripe-webhook] Signature verification failed:", err instanceof Error ? err.message : err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    log("Event received", { type: event.type, id: event.id });

    // ═══ IDEMPOTENCY ═══
    const { data: existing } = await db
      .from("stripe_processed_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existing) {
      log("Duplicate event, skipping", { eventId: event.id });
      return ok({ already_processed: true, event_id: event.id });
    }

    await db.from("stripe_processed_events").insert({
      event_id: event.id,
      event_type: event.type,
    });
    log("Idempotency record inserted", { eventId: event.id });

    // ════════════════════════════════════════════════════════
    // 1. CHECKOUT SESSION COMPLETED — subscriptions + payments
    // ════════════════════════════════════════════════════════
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        log("Session not paid, skipping", { id: session.id, status: session.payment_status });
        return ok();
      }

      const userId = session.metadata?.user_id;
      const mode = session.mode; // 'subscription' | 'payment'
      log("Checkout completed", { sessionId: session.id, mode, userId });

      if (!userId) {
        // Try to resolve from customer email
        log("No user_id in metadata, attempting email lookup", { customer_email: session.customer_email });
      }

      // ─── MODE: SUBSCRIPTION ───
      if (mode === "subscription") {
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as any)?.id;

        if (!subscriptionId) {
          log("No subscription ID in session, skipping tier update");
          return ok();
        }

        // Fetch the subscription to get product info
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const productId = typeof sub.items.data[0]?.price?.product === "string"
          ? sub.items.data[0].price.product
          : (sub.items.data[0]?.price?.product as any)?.id;

        const tierConfig = productId ? PRODUCT_TIERS[productId] : null;
        log("Subscription product resolved", { productId, tierConfig: tierConfig?.label });

        // Resolve user
        const resolvedUserId = userId || await resolveUserByEmail(db, session.customer_email);
        if (!resolvedUserId) {
          log("Cannot resolve user for subscription", { email: session.customer_email });
          return ok();
        }

        if (tierConfig) {
          // Update token_balances → set access_tier + tier_expires_at
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          const { error: tierErr } = await db
            .from("token_balances")
            .upsert({
              user_id: resolvedUserId,
              access_tier: tierConfig.tier,
              tier_expires_at: periodEnd,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

          if (tierErr) {
            log("Failed to update access_tier", { error: tierErr.message });
          } else {
            log(`✅ Tier set to '${tierConfig.tier}' for user ${resolvedUserId}`, { expires: periodEnd });
          }

          // Credit initial NEURONS quota
          const description = `SUBSCRIPTION: +${tierConfig.neurons} NEURONS — ${tierConfig.label} (${session.id})`;
          const { data: dupTx } = await db
            .from("credit_transactions")
            .select("id")
            .eq("description", description)
            .maybeSingle();

          if (!dupTx) {
            await db.rpc("add_credits", {
              p_user_id: resolvedUserId,
              p_amount: tierConfig.neurons,
              p_description: description,
              p_type: "subscription",
            });
            log(`✅ Credited ${tierConfig.neurons} NEURONS for new subscription`);

            await db.from("notifications").insert({
              user_id: resolvedUserId,
              type: "credits_added",
              title: `Bine ai venit în ${tierConfig.label}! +${tierConfig.neurons.toLocaleString()} NEURONS`,
              message: `Abonamentul ${tierConfig.label} a fost activat. NEURONS creditați automat.`,
              link: "/credits",
              meta: { neurons: tierConfig.neurons, tier: tierConfig.tier, session_id: session.id },
            });
          } else {
            log("Subscription credits already added, skipping duplicate");
          }
        }
      }

      // ─── MODE: PAYMENT (one-time NEURONS purchase) ───
      else if (mode === "payment") {
        const resolvedUserId = userId || await resolveUserByEmail(db, session.customer_email);
        if (!resolvedUserId) {
          log("Cannot resolve user for payment", { email: session.customer_email });
          return ok();
        }

        // Determine NEURONS from line items price
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id;
        const amountPaid = (session.amount_total || 0) / 100; // cents → dollars
        // 1 USD = 500 NEURONS
        const neurons = Math.round(amountPaid * 500);

        if (neurons <= 0) {
          log("Zero neurons calculated, skipping", { amountPaid });
          return ok();
        }

        if (neurons > 100_000) {
          log("Suspiciously high neuron amount, skipping", { neurons, amountPaid });
          return ok();
        }

        const description = `TOPUP: +${neurons} NEURONS — $${amountPaid} (${session.id})`;
        const { data: dupTx } = await db
          .from("credit_transactions")
          .select("id")
          .eq("description", description)
          .maybeSingle();

        if (dupTx) {
          log("Payment credits already added, skipping");
          return ok({ already_processed: true });
        }

        // Insert credit transaction
        const { error: creditErr } = await db.from("credit_transactions").insert({
          user_id: resolvedUserId,
          amount: neurons,
          type: "purchase",
          description,
        });
        if (creditErr) {
          log("Failed to insert credit_transaction", { error: creditErr.message });
        } else {
          log(`✅ credit_transactions: +${neurons} NEURONS (purchase)`);
        }

        // Update token_balances.balance
        const { data: currentBalance } = await db
          .from("token_balances")
          .select("balance")
          .eq("user_id", resolvedUserId)
          .maybeSingle();

        const newBalance = (currentBalance?.balance || 0) + neurons;
        const { error: balErr } = await db
          .from("token_balances")
          .upsert({
            user_id: resolvedUserId,
            balance: newBalance,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (balErr) {
          log("Failed to update token_balances", { error: balErr.message });
        } else {
          log(`✅ token_balances updated: balance=${newBalance} for ${resolvedUserId}`);
        }

        // Notify
        await db.from("notifications").insert({
          user_id: resolvedUserId,
          type: "credits_added",
          title: `+${neurons.toLocaleString()} NEURONS adăugați`,
          message: `Plata de $${amountPaid} a fost procesată. Credite disponibile imediat.`,
          link: "/credits",
          meta: { neurons, amount_usd: amountPaid, session_id: session.id },
        });

        // XP reward
        await db.rpc("award_xp", {
          _user_id: resolvedUserId,
          _amount: Math.min(Math.floor(neurons / 10), 100),
          _source: "topup",
          _description: `Purchased ${neurons} NEURONS ($${amountPaid})`,
        }).catch(() => {}); // non-critical

        log(`✅ Payment complete: +${neurons} NEURONS for ${resolvedUserId}`);
      }
    }

    // ════════════════════════════════════════════════════════
    // 2. INVOICE PAID — subscription renewals
    // ════════════════════════════════════════════════════════
    else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      if (!invoice.subscription || invoice.billing_reason === "manual") {
        log("Not a subscription invoice, skipping");
        return ok();
      }

      // Skip initial invoice (already handled in checkout.session.completed)
      if (invoice.billing_reason === "subscription_create") {
        log("Initial subscription invoice — already credited in checkout, skipping");
        return ok();
      }

      const customerEmail = invoice.customer_email;
      if (!customerEmail) {
        log("No customer email on invoice");
        return ok();
      }

      const lineItem = invoice.lines?.data?.[0];
      const productId = typeof lineItem?.price?.product === "string"
        ? lineItem.price.product
        : (lineItem?.price?.product as any)?.id;
      const tierConfig = productId ? PRODUCT_TIERS[productId] : null;

      if (!tierConfig) {
        log("Unknown product on invoice, skipping", { productId });
        return ok();
      }

      const resolvedUserId = await resolveUserByEmail(db, customerEmail);
      if (!resolvedUserId) {
        log("User not found for renewal", { customerEmail });
        return ok();
      }

      const description = `RENEWAL: +${tierConfig.neurons} NEURONS — ${tierConfig.label} (${invoice.id})`;
      const { data: dupTx } = await db
        .from("credit_transactions")
        .select("id")
        .eq("description", description)
        .maybeSingle();

      if (dupTx) {
        log("Renewal already processed", { invoiceId: invoice.id });
        return ok({ already_processed: true });
      }

      // Credit neurons
      await db.rpc("add_credits", {
        _user_id: resolvedUserId,
        _amount: tierConfig.neurons,
        _description: description,
        _type: "subscription",
      });

      // Extend tier expiry
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : (invoice.subscription as any)?.id;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await db.from("token_balances").upsert({
          user_id: resolvedUserId,
          access_tier: tierConfig.tier,
          tier_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }

      await db.from("notifications").insert({
        user_id: resolvedUserId,
        type: "credits_added",
        title: `+${tierConfig.neurons.toLocaleString()} NEURONS — ${tierConfig.label}`,
        message: `Cota lunară ${tierConfig.label} a fost creditată automat.`,
        link: "/credits",
        meta: { neurons: tierConfig.neurons, invoice_id: invoice.id, tier: tierConfig.tier },
      });

      log(`✅ Renewal: +${tierConfig.neurons} NEURONS for ${resolvedUserId} (${tierConfig.label})`);
    }

    // ════════════════════════════════════════════════════════
    // 3. SUBSCRIPTION DELETED — cancellation
    // ════════════════════════════════════════════════════════
    else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer : subscription.customer.id;

      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || (customer as any).deleted) {
        log("Customer deleted", { customerId });
        return ok();
      }

      const email = (customer as Stripe.Customer).email;
      const resolvedUserId = email ? await resolveUserByEmail(db, email) : null;

      if (resolvedUserId) {
        // Downgrade tier to 'free'
        await db.from("token_balances").upsert({
          user_id: resolvedUserId,
          access_tier: "free",
          tier_expires_at: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        await db.from("notifications").insert({
          user_id: resolvedUserId,
          type: "subscription_cancelled",
          title: "Abonament anulat",
          message: "Abonamentul tău a fost anulat. Tier-ul a fost resetat la Free. Poți reînnoi oricând.",
          link: "/credits",
          meta: { subscription_id: subscription.id },
        });

        log(`⚠️ Subscription cancelled → tier reset to 'free' for ${resolvedUserId}`);
      }
    }

    // ════════════════════════════════════════════════════════
    // 4. PAYMENT FAILED
    // ════════════════════════════════════════════════════════
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerEmail = invoice.customer_email;

      if (customerEmail) {
        const resolvedUserId = await resolveUserByEmail(db, customerEmail);
        if (resolvedUserId) {
          await db.from("notifications").insert({
            user_id: resolvedUserId,
            type: "payment_failed",
            title: "Plată eșuată",
            message: "Plata nu a putut fi procesată. Verifică metoda de plată sau contactează suportul.",
            link: "/credits",
            meta: { invoice_id: invoice.id },
          });
          log(`⚠️ Payment failed for ${resolvedUserId}`);
        }
      }
    }

    else {
      log("Unhandled event type", { type: event.type });
    }

    return ok();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[stripe-webhook] Unhandled error:", msg);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

/** Resolve Supabase user ID by email — uses stripe_customers table for O(1) lookup */
async function resolveUserByEmail(db: any, email: string | null | undefined): Promise<string | null> {
  if (!email) return null;

  // 1. Try stripe_customers table first (O(1) indexed lookup)
  const { data: customer } = await db
    .from("stripe_customers")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();
  if (customer?.user_id) return customer.user_id;

  // 2. Try profiles table (has user_id + email)
  const { data: profile } = await db
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();
  if (profile?.user_id) return profile.user_id;

  // 3. Fallback to admin API (single user lookup, not listUsers)
  try {
    const { data: userData } = await db.auth.admin.listUsers({ 
      filter: `email.eq.${email}`,
      perPage: 1 
    });
    return userData?.users?.[0]?.id || null;
  } catch {
    return null;
  }
}

function ok(extra?: Record<string, any>) {
  return new Response(JSON.stringify({ received: true, ...extra }), {
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}
