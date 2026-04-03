/**
 * aias-gate — AIAS Router Enforcement Gate (T10.4)
 * Validates agents before routing: checks schema, score, certification.
 * Blocks invalid agents and logs routing metadata.
 * 
 * Actions:
 *   "validate" — check if agent/service is AIAS compliant for routing
 *   "wrap" — wrap an existing service_unit into AIAS Level 1 profile
 *   "audit" — run compliance audit across all agents
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Auth
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":aias-gate", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "validate": {
        const { service_unit_id, intent } = body;
        if (!service_unit_id) {
          return new Response(JSON.stringify({ error: "service_unit_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Load AIAS profile
        const { data: profile } = await supabase
          .from("aias_agent_profiles")
          .select("*")
          .eq("service_unit_id", service_unit_id)
          .maybeSingle();

        // Load service unit for fallback checks
        const { data: unit } = await supabase
          .from("service_units")
          .select("*")
          .eq("id", service_unit_id)
          .single();

        if (!unit) {
          return new Response(JSON.stringify({ error: "Service unit not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Validation checks
        const schemaValid = !!(profile?.canonical_schema && Object.keys(profile.canonical_schema as object).length > 0)
          || !!(unit.single_output && unit.single_function);

        const scoreJson = unit.score_json as any || {};
        const totalScore = scoreJson.total_score || 0;
        const scoreCheckPassed = totalScore >= 0.65;

        const certificationCheck = profile?.is_certified || false;
        const complianceScore = profile?.compliance_score || (scoreCheckPassed ? 0.7 : 0.3);

        // Block decision
        const blocked = !schemaValid || !scoreCheckPassed;
        const blockReason = !schemaValid
          ? "Missing canonical schema or service definition"
          : !scoreCheckPassed
          ? `Score ${totalScore} below minimum 0.65`
          : null;

        // Log routing metadata
        await supabase.from("aias_routing_metadata").insert({
          agent_profile_id: profile?.id || null,
          service_unit_id,
          user_id: user.id,
          request_intent: intent || null,
          schema_valid: schemaValid,
          score_check_passed: scoreCheckPassed,
          certification_check: certificationCheck,
          blocked,
          block_reason: blockReason,
          routing_confidence: complianceScore,
        });

        return new Response(JSON.stringify({
          service_unit_id,
          allowed: !blocked,
          schema_valid: schemaValid,
          score_check: scoreCheckPassed,
          certified: certificationCheck,
          compliance_score: complianceScore,
          block_reason: blockReason,
          aias_level: profile?.certification_level || 0,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "wrap": {
        const { service_unit_id } = body;
        if (!service_unit_id) {
          return new Response(JSON.stringify({ error: "service_unit_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Load service unit
        const { data: unit } = await supabase
          .from("service_units")
          .select("*")
          .eq("id", service_unit_id)
          .single();

        if (!unit) {
          return new Response(JSON.stringify({ error: "Service unit not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Load prompt vault
        const { data: prompt } = await supabase
          .from("prompt_vault")
          .select("input_schema, output_schema, quality_gate")
          .eq("service_unit_id", service_unit_id)
          .maybeSingle();

        // Check existing
        const { data: existing } = await supabase
          .from("aias_agent_profiles")
          .select("id")
          .eq("service_unit_id", service_unit_id)
          .maybeSingle();

        if (existing) {
          return new Response(JSON.stringify({ error: "Profile already exists", profile_id: existing.id }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const agentKey = unit.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+/g, "_");
        const scoreJson = unit.score_json as any || {};

        // Create AIAS Level 1 profile
        const { data: profile, error: profErr } = await supabase
          .from("aias_agent_profiles")
          .insert({
            service_unit_id,
            agent_key: agentKey,
            display_name: unit.name,
            certification_level: 1,
            compliance_score: scoreJson.total_score || 0,
            canonical_schema: {
              service_unit_id,
              name: unit.name,
              level: unit.level,
              single_output: unit.single_output,
              single_function: unit.single_function,
              single_decision: unit.single_decision,
              mechanism: (unit as any).mechanism,
            },
            input_contract: prompt?.input_schema || {},
            output_contract: prompt?.output_schema || {},
            artifact_model: {
              type: "service_output",
              format: "markdown",
              auto_save: true,
              export_formats: ["markdown", "json", "pdf"],
            },
            scoring_dimensions: scoreJson,
            status: "active",
          })
          .select("id")
          .single();

        if (profErr) throw profErr;

        // Create output contract
        await supabase.from("aias_output_contracts").insert({
          agent_profile_id: profile!.id,
          context_schema: { required_fields: ["situation", "objective", "constraints"] },
          execution_schema: { required_fields: ["analysis", "methodology", "findings"] },
          verdict_schema: { required_fields: ["recommendation", "confidence", "next_steps"] },
          export_formats: ["markdown", "json", "pdf"],
          auto_library: true,
          quality_gate: prompt?.quality_gate || { min_score: 0.65, required_sections: 3 },
        });

        return new Response(JSON.stringify({
          profile_id: profile!.id,
          agent_key: agentKey,
          aias_level: 1,
          status: "wrapped",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "audit": {
        // Audit all active service units for AIAS compliance
        const { data: units } = await supabase
          .from("service_units")
          .select("id, name, single_output, single_function, single_decision, score_json, status")
          .eq("status", "active")
          .limit(200);

        const { data: profiles } = await supabase
          .from("aias_agent_profiles")
          .select("service_unit_id, is_certified, compliance_score")
          .limit(200);

        const profileMap = new Map((profiles || []).map(p => [p.service_unit_id, p]));
        const results = {
          total: (units || []).length,
          wrapped: 0,
          certified: 0,
          missing_schema: 0,
          low_score: 0,
          compliant: 0,
        };

        for (const u of units || []) {
          const profile = profileMap.get(u.id);
          if (profile) results.wrapped++;
          if (profile?.is_certified) results.certified++;

          const hasSchema = !!(u.single_output && u.single_function);
          if (!hasSchema) results.missing_schema++;

          const score = (u.score_json as any)?.total_score || 0;
          if (score < 0.65) results.low_score++;
          if (hasSchema && score >= 0.65) results.compliant++;
        }

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action. Use: validate, wrap, audit" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("aias-gate error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
