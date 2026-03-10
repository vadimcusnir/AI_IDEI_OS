import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── Authenticate via JWT ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Check admin role ──
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Support single or batch events
    const events = Array.isArray(body) ? body : [body];

    // Validate input
    if (events.length > 100) {
      return new Response(JSON.stringify({ error: "Maximum 100 events per batch" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = events.map((e: any) => ({
      source: String(e.source || "manual").slice(0, 50),
      source_id: e.source_id ? String(e.source_id).slice(0, 200) : null,
      component: e.component ? String(e.component).slice(0, 100) : null,
      file_path: e.file_path ? String(e.file_path).slice(0, 500) : null,
      diff_summary: String(e.diff_summary || e.message || e.summary || "").slice(0, 2000) || null,
      impact_level: ["user", "internal", "infrastructure"].includes(e.impact_level) ? e.impact_level : "user",
      metadata: e.metadata || {},
      created_by: user.id,
    }));

    const { data, error } = await supabase.from("changes_raw").insert(rows).select("id");
    if (error) throw error;

    return new Response(JSON.stringify({ ingested: data?.length || 0, ids: data?.map((r: any) => r.id) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("changelog-ingest error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
