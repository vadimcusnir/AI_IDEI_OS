import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Support single or batch events
    const events = Array.isArray(body) ? body : [body];

    const rows = events.map((e: any) => ({
      source: e.source || "manual",
      source_id: e.source_id || null,
      component: e.component || null,
      file_path: e.file_path || null,
      diff_summary: e.diff_summary || e.message || e.summary || null,
      impact_level: e.impact_level || "user",
      metadata: e.metadata || {},
    }));

    const { data, error } = await supabase.from("changes_raw").insert(rows).select("id");
    if (error) throw error;

    return new Response(JSON.stringify({ ingested: data?.length || 0, ids: data?.map((r: any) => r.id) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("changelog-ingest error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
