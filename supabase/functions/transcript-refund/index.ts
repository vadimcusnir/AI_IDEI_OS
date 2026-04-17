// transcript-refund — Server-side credit refund for failed transcript downloads.
// Replaces the old client-side `supabase.rpc("add_credits", ...)` path that
// allowed any logged-in user to grant themselves credits (F-014 exploit).
//
// Auth: requires user JWT. Refund is always made to the *caller's* account,
// never to an arbitrary user_id passed by the client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_REFUND = 500; // hard cap so a compromised page can't drain the till

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const reason = String(body?.reason ?? "Refund — transcript download failed").slice(0, 200);

    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_REFUND) {
      return new Response(JSON.stringify({ error: "Invalid refund amount" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: ok, error } = await admin.rpc("add_credits", {
      p_user_id: user.id,
      p_amount: Math.floor(amount),
      p_description: reason,
      p_type: "refund",
    });
    if (error || !ok) throw new Error(error?.message ?? "Refund failed");

    return new Response(JSON.stringify({ success: true, refunded: Math.floor(amount) }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
