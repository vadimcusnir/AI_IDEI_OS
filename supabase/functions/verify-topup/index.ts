import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const supabaseClient = createClient(supabaseUrl, anonKey);

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    if (!session_id || typeof session_id !== "string") throw new Error("Missing or invalid session_id");
    if (session_id.length > 200) throw new Error("Invalid session_id format");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify user matches
    const metaUserId = session.metadata?.user_id;
    if (metaUserId !== user.id) {
      return new Response(JSON.stringify({ error: "User mismatch" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 403,
      });
    }

    const neurons = parseInt(session.metadata?.neurons || "0");
    if (neurons <= 0 || neurons > 50_000) throw new Error("Invalid neuron amount");

    // Check if already processed (idempotency)
    const { data: existingTx } = await supabaseAdmin
      .from("credit_transactions")
      .select("id")
      .eq("description", `STRIPE TOPUP: +${neurons} NEURONS (${session_id})`)
      .maybeSingle();

    if (existingTx) {
      return new Response(JSON.stringify({ success: true, already_processed: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Add credits atomically via SECURITY DEFINER function
    const { data: added } = await supabaseAdmin.rpc("add_credits", {
      p_user_id: user.id,
      p_amount: neurons,
      p_description: `STRIPE TOPUP: +${neurons} NEURONS (${session_id})`,
      p_type: "topup",
    });

    if (!added) {
      throw new Error("Failed to add credits");
    }

    return new Response(JSON.stringify({ success: true, neurons_added: neurons }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("verify-topup error:", msg);
    return new Response(JSON.stringify({ error: "Verification failed" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
