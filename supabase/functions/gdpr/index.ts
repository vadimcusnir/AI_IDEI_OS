import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3; // per hour (GDPR ops are sensitive)
const RATE_WINDOW = 3600_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // ── Rate limit check ──
  if (!checkRateLimit(userId)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded (3 GDPR requests/hour)" }), {
      status: 429,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const { action } = body;

  // Validate action
  if (!action || !["export", "delete"].includes(action)) {
    return new Response(JSON.stringify({ error: "Invalid action. Use 'export' or 'delete'." }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  // ─── EXPORT ───
  if (action === "export") {
    const [
      profileRes,
      neuronsRes,
      blocksRes,
      episodesRes,
      artifactsRes,
      creditsRes,
      transactionsRes,
      feedbackRes,
      guestsRes,
      notifPrefsRes,
    ] = await Promise.all([
      adminClient.from("profiles").select("*").eq("user_id", userId),
      adminClient.from("neurons").select("*").eq("author_id", userId),
      adminClient.from("neuron_blocks").select("*, neurons!inner(author_id)").eq("neurons.author_id", userId),
      adminClient.from("episodes").select("*").eq("author_id", userId),
      adminClient.from("artifacts").select("*").eq("author_id", userId),
      adminClient.from("user_credits").select("*").eq("user_id", userId),
      adminClient.from("credit_transactions").select("*").eq("user_id", userId),
      adminClient.from("feedback").select("*").eq("user_id", userId),
      adminClient.from("guest_profiles").select("*").eq("author_id", userId),
      adminClient.from("notification_preferences").select("*").eq("user_id", userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      email: user.email,
      profile: profileRes.data || [],
      neurons: neuronsRes.data || [],
      neuron_blocks: blocksRes.data || [],
      episodes: episodesRes.data || [],
      artifacts: artifactsRes.data || [],
      credits: creditsRes.data || [],
      credit_transactions: transactionsRes.data || [],
      feedback: feedbackRes.data || [],
      guest_profiles: guestsRes.data || [],
      notification_preferences: notifPrefsRes.data || [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { ...getCorsHeaders(req),
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ai-idei-export-${userId.slice(0, 8)}.json"`,
      },
    });
  }

  // ─── DELETE ───
  if (action === "delete") {
    // Delete in dependency order
    const tables = [
      { table: "artifact_neurons", column: null, join: "artifacts" },
      { table: "artifacts", column: "author_id" },
      { table: "neuron_versions", column: null, join: "neurons" },
      { table: "neuron_blocks", column: null, join: "neurons" },
      { table: "neuron_jobs", column: "author_id" },
      { table: "neuron_links", column: null, join_source: "neurons" },
      { table: "neuron_addresses", column: null, join: "neurons" },
      { table: "neuron_clones", column: "cloned_by" },
      { table: "neurons", column: "author_id" },
      { table: "episodes", column: "author_id" },
      { table: "guest_profiles", column: "author_id" },
      { table: "credit_transactions", column: "user_id" },
      { table: "user_credits", column: "user_id" },
      { table: "feedback", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "notification_preferences", column: "user_id" },
      { table: "push_subscriptions", column: "user_id" },
      { table: "user_links", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "profiles", column: "user_id" },
    ];

    const errors: string[] = [];

    for (const t of tables) {
      if (t.column) {
        const { error } = await adminClient
          .from(t.table)
          .delete()
          .eq(t.column, userId);
        if (error) errors.push(`${t.table}: ${error.message}`);
      }
    }

    // Delete auth user last
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) errors.push(`auth: ${authError.message}`);

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ status: "partial", errors }),
        {
          status: 207,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ status: "deleted", message: "All user data has been permanently removed." }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ error: "Invalid action. Use 'export' or 'delete'." }), {
    status: 400,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
});
