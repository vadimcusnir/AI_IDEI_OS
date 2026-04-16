/**
 * prompt-broker — AIAS-Enhanced (Phase 10) + P0 Security Fix
 * 
 * SECURITY: JWT auth required. user_id extracted from token, NOT from client.
 * BILLING: Atomic deduction via atomic_deduct_neurons() — no race condition.
 * 
 * Input: { service_unit_id: UUID, user_inputs: object }
 * Output: { artifact_id, content_preview, neurons_spent, aias_compliance, status }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":prompt-broker", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    // ═══ JWT AUTH — extract user_id from token, never trust client ═══
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify JWT via getClaims() — lightweight, no server round-trip
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);

    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = claimsData.claims.sub as string; // Server-verified, not client-supplied

    // Service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { service_unit_id, user_inputs } = body;

    if (!service_unit_id) {
      return new Response(JSON.stringify({ error: "Missing service_unit_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Load service unit
    const { data: unit, error: unitErr } = await supabase
      .from("service_units")
      .select("*")
      .eq("id", service_unit_id)
      .single();

    if (unitErr || !unit) {
      return new Response(JSON.stringify({ error: "Service unit not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Load prompt from vault
    const { data: prompt } = await supabase
      .from("prompt_vault")
      .select("*")
      .eq("service_unit_id", service_unit_id)
      .single();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt not found in vault" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2b. AIAS: Validate input against prompt_vault.input_schema
    const inputSchema = prompt.input_schema as Record<string, any> || {};
    const inputValidation = validateInputSchema(user_inputs, inputSchema);
    if (!inputValidation.valid) {
      return new Response(JSON.stringify({
        error: "INPUT_SCHEMA_VIOLATION",
        missing_fields: inputValidation.missing,
        schema: inputSchema,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Calculate cost
    const costJson = unit.cost_json as any || {};
    const neuronsCost = costJson.neurons_cost || (unit.pricing_json as any)?.root2_price || 29;

    // ═══ ATOMIC DEDUCTION — prevents race condition ═══
    const { data: deductResult, error: deductErr } = await supabase
      .rpc("atomic_deduct_neurons", {
        p_user_id: user_id,
        p_amount: neuronsCost,
        p_description: `prompt-broker: ${unit.name}`,
      });

    if (deductErr) {
      console.error("Atomic deduct error:", deductErr);
      return new Response(JSON.stringify({ error: "Billing system error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deduction = deductResult?.[0];
    if (!deduction?.success) {
      return new Response(JSON.stringify({
        error: deduction?.error_message === "Insufficient balance" ? "INSUFFICIENT_BALANCE" : "BILLING_ERROR",
        required: neuronsCost,
        available: deduction?.new_balance || 0,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. AIAS: Load output contract if exists
    const { data: aiasProfile } = await supabase
      .from("aias_agent_profiles")
      .select("id, output_contract, scoring_dimensions")
      .eq("service_unit_id", service_unit_id)
      .maybeSingle();

    const { data: outputContract } = aiasProfile?.id
      ? await supabase
          .from("aias_output_contracts")
          .select("*")
          .eq("agent_profile_id", aiasProfile.id)
          .maybeSingle()
      : { data: null };

    // 5. Build LLM prompt with AIAS enforcement
    const systemRole = prompt.system_role || "You are an expert business strategist.";
    const purpose = prompt.purpose || unit.single_function || "Generate actionable output";
    const outputSchema = prompt.output_schema as any || {};
    const qualityGate = prompt.quality_gate as any || {};
    const rules = prompt.rules as any || {};

    const userContent = typeof user_inputs === "string"
      ? user_inputs
      : JSON.stringify(user_inputs || {});

    const aiasOutputDirective = outputContract
      ? `\n## OUTPUT STRUCTURE (MANDATORY — AIAS Level 1):
You MUST structure your output in exactly three sections:

### CONTEXT
${(outputContract.context_schema as any)?.required_fields?.map((f: string) => `- ${f}`).join("\n") || "- situation\n- objective\n- constraints"}

### EXECUTION
${(outputContract.execution_schema as any)?.required_fields?.map((f: string) => `- ${f}`).join("\n") || "- analysis\n- methodology\n- findings"}

### VERDICT
${(outputContract.verdict_schema as any)?.required_fields?.map((f: string) => `- ${f}`).join("\n") || "- recommendation\n- confidence\n- next_steps"}
`
      : `\n## OUTPUT STRUCTURE (AIAS Standard):
Structure your output in three sections:
### CONTEXT — Situation, objective, constraints
### EXECUTION — Analysis, methodology, findings  
### VERDICT — Recommendation, confidence level, next steps
`;

    const fullPrompt = [
      `## PURPOSE: ${purpose}`,
      `## SERVICE: ${unit.name}`,
      `## MECHANISM: ${(unit as any).mechanism || "standard"}`,
      `## EXPECTED OUTPUT: ${unit.single_output}`,
      rules.constraints ? `## RULES: ${JSON.stringify(rules.constraints)}` : "",
      outputSchema.format ? `## OUTPUT FORMAT: ${outputSchema.format}` : "",
      qualityGate.min_score ? `## QUALITY THRESHOLD: ${qualityGate.min_score}` : "",
      aiasOutputDirective,
      `\n## USER INPUT:\n${userContent}`,
    ].filter(Boolean).join("\n");

    // 6. Execute LLM via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const llmResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemRole },
          { role: "user", content: fullPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      console.error("LLM error:", llmResponse.status, errText);

      // ═══ COMPENSATING TRANSACTION — refund neurons + compliance log ═══
      const { data: refundResult, error: refundErr } = await supabase.rpc("refund_llm_failure", {
        _user_id: user_id,
        _amount: neuronsCost,
        _reason: `${unit.name} — LLM HTTP ${llmResponse.status}`,
        _service_key: unit.name,
        _job_id: null,
      });
      if (refundErr) {
        console.error("CRITICAL: Refund failed for user", user_id, "amount", neuronsCost, refundErr);
      }

      return new Response(JSON.stringify({
        error: "LLM execution failed",
        refunded: !refundErr,
        refund_id: (refundResult as any)?.refund_id ?? null,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const llmData = await llmResponse.json();
    const generatedContent = llmData.choices?.[0]?.message?.content || "";

    // 7. AIAS: Validate output compliance
    const aiasCompliance = validateOutputCompliance(generatedContent);

    // 8. Save artifact with AIAS metadata
    const { data: artifact, error: artErr } = await supabase
      .from("artifacts")
      .insert({
        author_id: user_id,
        title: `${unit.name} — Output`,
        content: generatedContent,
        artifact_type: "service_output",
        format: "markdown",
        service_key: unit.name,
        status: "completed",
        preview_content: generatedContent.slice(0, 500),
        metadata: {
          service_unit_id,
          prompt_version: prompt.version,
          neurons_cost: neuronsCost,
          aias_level: 1,
          aias_compliance: aiasCompliance,
          output_sections: aiasCompliance.sections_found,
          export_formats: outputContract?.export_formats || ["markdown", "json"],
        },
      })
      .select("id")
      .single();

    if (artErr) {
      return new Response(JSON.stringify({ error: "Failed to save artifact", detail: artErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 9. Update AIAS agent stats if profile exists
    if (aiasProfile?.id) {
      await supabase.from("aias_agent_profiles").update({
        total_executions: (aiasProfile as any).total_executions + 1,
        updated_at: new Date().toISOString(),
      }).eq("id", aiasProfile.id);
    }

    return new Response(JSON.stringify({
      artifact_id: artifact?.id,
      content_preview: generatedContent.slice(0, 300),
      neurons_spent: neuronsCost,
      service_name: unit.name,
      aias_compliance: aiasCompliance,
      export_formats: outputContract?.export_formats || ["markdown", "json"],
      status: "completed",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("prompt-broker error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* ═══ AIAS Helpers ═══ */

function validateInputSchema(
  inputs: any,
  schema: Record<string, any>,
): { valid: boolean; missing: string[] } {
  if (!schema.required_fields || !Array.isArray(schema.required_fields)) {
    return { valid: true, missing: [] };
  }

  const inputObj = typeof inputs === "object" && inputs !== null ? inputs : {};
  const missing: string[] = [];

  for (const field of schema.required_fields) {
    if (!(field in inputObj) || inputObj[field] === "" || inputObj[field] === null) {
      missing.push(field);
    }
  }

  return { valid: missing.length === 0, missing };
}

function validateOutputCompliance(content: string): {
  compliant: boolean;
  has_context: boolean;
  has_execution: boolean;
  has_verdict: boolean;
  sections_found: string[];
  score: number;
} {
  const has_context = /###?\s*context/i.test(content);
  const has_execution = /###?\s*execution/i.test(content);
  const has_verdict = /###?\s*verdict/i.test(content);

  const sections_found: string[] = [];
  if (has_context) sections_found.push("context");
  if (has_execution) sections_found.push("execution");
  if (has_verdict) sections_found.push("verdict");

  const score = sections_found.length / 3;

  return {
    compliant: sections_found.length === 3,
    has_context,
    has_execution,
    has_verdict,
    sections_found,
    score,
  };
}
