import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[ADMIN-REVENUE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    // Check admin role
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Admin access required");

    logStep("Admin verified", { userId: userData.user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Parallel fetch from Stripe
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;

    const [balance, subscriptions, charges30d, charges7d, customers] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.subscriptions.list({ status: "active", limit: 100 }),
      stripe.charges.list({ created: { gte: thirtyDaysAgo }, limit: 100 }),
      stripe.charges.list({ created: { gte: sevenDaysAgo }, limit: 100 }),
      stripe.customers.list({ limit: 100 }),
    ]);

    // Calculate MRR from active subscriptions
    let mrr = 0;
    const tierBreakdown: Record<string, number> = {};
    for (const sub of subscriptions.data) {
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      const interval = sub.items.data[0]?.price?.recurring?.interval;
      const monthly = interval === "year" ? amount / 12 : amount;
      mrr += monthly;
      
      const productId = String(sub.items.data[0]?.price?.product || "unknown");
      tierBreakdown[productId] = (tierBreakdown[productId] || 0) + 1;
    }

    // Revenue from charges
    const revenue30d = charges30d.data
      .filter(c => c.status === "succeeded")
      .reduce((s, c) => s + c.amount, 0);
    const revenue7d = charges7d.data
      .filter(c => c.status === "succeeded")
      .reduce((s, c) => s + c.amount, 0);

    // Daily revenue for chart (last 30 days)
    const dailyMap: Record<string, number> = {};
    for (const charge of charges30d.data) {
      if (charge.status !== "succeeded") continue;
      const date = new Date(charge.created * 1000).toISOString().split("T")[0];
      dailyMap[date] = (dailyMap[date] || 0) + charge.amount;
    }

    const dailyRevenue = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount: amount / 100 }));

    // Balance
    const availableBalance = balance.available.reduce((s, b) => s + b.amount, 0);
    const pendingBalance = balance.pending.reduce((s, b) => s + b.amount, 0);

    const result = {
      mrr: mrr / 100,
      activeSubscriptions: subscriptions.data.length,
      totalCustomers: customers.data.length,
      revenue30d: revenue30d / 100,
      revenue7d: revenue7d / 100,
      availableBalance: availableBalance / 100,
      pendingBalance: pendingBalance / 100,
      dailyRevenue,
      tierBreakdown,
      charges30dCount: charges30d.data.filter(c => c.status === "succeeded").length,
      avgChargeAmount: charges30d.data.length > 0
        ? Math.round(revenue30d / charges30d.data.filter(c => c.status === "succeeded").length) / 100
        : 0,
    };

    logStep("Revenue data compiled", { mrr: result.mrr, subs: result.activeSubscriptions });

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: error instanceof Error && msg.includes("Admin") ? 403 : 500,
    });
  }
});
