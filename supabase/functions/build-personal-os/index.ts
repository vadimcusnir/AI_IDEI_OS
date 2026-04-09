import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch identity profile
    const { data: profile } = await serviceClient
      .from("user_identity_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.extraction_status !== "completed") {
      return new Response(JSON.stringify({ error: "Extract identity first" }), { status: 400, headers: corsHeaders });
    }

    // Build OS from identity layers
    const osConfig = {
      user_id: user.id,
      os_version: "1.0",
      identity_layer: {
        tone: profile.tone_of_voice,
        cognition: profile.cognitive_logic,
        values: profile.operational_identity?.value_drivers || [],
        archetype: profile.operational_identity?.role_archetype || "",
      },
      knowledge_layer: {
        domains: profile.knowledge_signature?.domains || [],
        frameworks: profile.cognitive_logic?.preferred_frameworks || [],
        depth_profile: profile.knowledge_signature?.depth_vs_breadth || "",
        unique_combinations: profile.knowledge_signature?.unique_combinations || [],
      },
      execution_layer: {
        problem_solving: profile.problem_solving_model,
        decision_style: profile.cognitive_logic?.decision_patterns || [],
        output_preference: profile.operational_identity?.output_preference || "",
      },
      adaptation_layer: {
        learning_style: profile.cognitive_logic?.reasoning_style || "",
        blind_spots: profile.dark_patterns?.blind_spots || [],
        biases: profile.dark_patterns?.biases || [],
      },
      monetization_layer: {
        expertise_signals: profile.knowledge_signature?.expertise_signals || [],
        collaboration_style: profile.operational_identity?.collaboration_style || "",
        risk_tolerance: profile.problem_solving_model?.risk_tolerance || "",
      },
      is_active: true,
    };

    // Deactivate old configs
    await serviceClient
      .from("personal_os_configs")
      .update({ is_active: false })
      .eq("user_id", user.id);

    // Insert new
    const { error: insertError } = await serviceClient
      .from("personal_os_configs")
      .insert(osConfig);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to build OS" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, version: "1.0" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Build OS error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
