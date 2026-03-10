import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PACKAGE_NEURONS: Record<string, number> = {
  starter: 500,
  standard: 1000,
  pro: 5000,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify user matches
    const metaUserId = session.metadata?.user_id;
    if (metaUserId !== user.id) {
      return new Response(JSON.stringify({ error: "User mismatch" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const neurons = parseInt(session.metadata?.neurons || "0");
    if (neurons <= 0) throw new Error("Invalid neuron amount");

    // Check if already processed (idempotency)
    const { data: existingTx } = await supabaseAdmin
      .from("credit_transactions")
      .select("id")
      .eq("description", `STRIPE TOPUP: +${neurons} NEURONS (${session_id})`)
      .maybeSingle();

    if (existingTx) {
      return new Response(JSON.stringify({ success: true, already_processed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update credits
    const { data: current } = await supabaseAdmin
      .from("user_credits")
      .select("balance, total_earned")
      .eq("user_id", user.id)
      .maybeSingle();

    if (current) {
      await supabaseAdmin.from("user_credits").update({
        balance: current.balance + neurons,
        total_earned: current.total_earned + neurons,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    } else {
      await supabaseAdmin.from("user_credits").insert({
        user_id: user.id,
        balance: neurons,
        total_earned: neurons,
      });
    }

    // Log transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: user.id,
      amount: neurons,
      type: "topup",
      description: `STRIPE TOPUP: +${neurons} NEURONS (${session_id})`,
    });

    return new Response(JSON.stringify({ success: true, neurons_added: neurons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("verify-topup error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
