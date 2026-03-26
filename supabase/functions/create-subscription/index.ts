import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    // Rate limit guard
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 3, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;


    const body = await req.json();
    const priceId = body.priceId || body.price_id;
    const mode: "subscription" | "payment" = body.mode || "subscription";

    if (!priceId) throw new Error("price_id is required");
    if (mode !== "subscription" && mode !== "payment") {
      throw new Error("mode must be 'subscription' or 'payment'");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://ai-idei-os.lovable.app";
    const successParam = mode === "subscription" ? "subscription=success" : "topup=success";
    const cancelParam = mode === "subscription" ? "subscription=cancel" : "topup=cancelled";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${origin}/payment/result?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/result?status=cancel`,
      metadata: {
        user_id: user.id,
        mode,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-subscription]", msg);
    return new Response(JSON.stringify({ error: "Subscription creation failed" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
