import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Root2 pricing: digit sum = 2 | 1N = $0.002 → $1 = 500N
const PACKAGES: Record<string, { neurons: number; priceId: string }> = {
  micro: { neurons: 1000, priceId: "price_1TEDhPIK7fwtty4oChZnMfTa" },
  starter: { neurons: 5500, priceId: "price_1T9TkpIK7fwtty4oS9ZysNfZ" },
  standard: { neurons: 10000, priceId: "price_1T9TlFIK7fwtty4oo4iKY1DC" },
  growth: { neurons: 23500, priceId: "price_1T9TlPIK7fwtty4o7VRrMObq" },
  scale: { neurons: 46000, priceId: "price_1TEDhQIK7fwtty4oCYUtYjqB" },
};

Deno.serve(async (req) => {
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
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 5, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;


    const { package_key } = await req.json();
    const pkg = PACKAGES[package_key];
    if (!pkg) throw new Error("Invalid package");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or reference existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://ai-idei-os.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: pkg.priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/payment/result?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/result?status=cancel`,
      metadata: {
        user_id: user.id,
        neurons: String(pkg.neurons),
        package_key,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-topup-checkout]", msg);
    return new Response(JSON.stringify({ error: "Checkout creation failed" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
