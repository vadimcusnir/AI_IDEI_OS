/**
 * prompt-broker — Loads prompt from vault, executes via LLM, saves artifact, settles neurons.
 * Input: { service_unit_id: UUID, user_inputs: object, user_id: UUID }
 * Output: { artifact_id, content_preview, neurons_spent, status }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { service_unit_id, user_inputs, user_id } = await req.json();

    if (!service_unit_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing service_unit_id or user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    // 3. Check wallet balance
    const costJson = unit.cost_json as any || {};
    const neuronsCost = costJson.neurons_cost || (unit.pricing_json as any)?.root2_price || 29;

    const { data: wallet } = await supabase
      .from("wallet_state")
      .select("available")
      .eq("user_id", user_id)
      .maybeSingle();

    const balance = wallet?.available || 0;
    if (balance < neuronsCost) {
      return new Response(JSON.stringify({
        error: "INSUFFICIENT_BALANCE",
        required: neuronsCost,
        available: balance,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Build LLM prompt from vault data
    const systemRole = prompt.system_role || "You are an expert business strategist.";
    const purpose = prompt.purpose || unit.single_function || "Generate actionable output";
    const inputSchema = prompt.input_schema as any || {};
    const outputSchema = prompt.output_schema as any || {};
    const qualityGate = prompt.quality_gate as any || {};
    const rules = prompt.rules as any || {};

    const userContent = typeof user_inputs === "string" 
      ? user_inputs 
      : JSON.stringify(user_inputs || {});

    const fullPrompt = [
      `## PURPOSE: ${purpose}`,
      `## SERVICE: ${unit.name}`,
      `## MECHANISM: ${(unit as any).mechanism || "standard"}`,
      `## EXPECTED OUTPUT: ${unit.single_output}`,
      rules.constraints ? `## RULES: ${JSON.stringify(rules.constraints)}` : "",
      outputSchema.format ? `## OUTPUT FORMAT: ${outputSchema.format}` : "",
      qualityGate.min_score ? `## QUALITY THRESHOLD: ${qualityGate.min_score}` : "",
      `\n## USER INPUT:\n${userContent}`,
    ].filter(Boolean).join("\n");

    // 5. Execute LLM via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    const llmResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
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
      return new Response(JSON.stringify({ error: "LLM execution failed", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const llmData = await llmResponse.json();
    const generatedContent = llmData.choices?.[0]?.message?.content || "";

    // 6. Save artifact
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

    // 7. Settle neurons (debit wallet)
    await supabase.from("credit_transactions").insert({
      user_id,
      amount: -neuronsCost,
      type: "service_execution",
      description: `prompt-broker: ${unit.name}`,
    });

    // Update wallet
    await supabase
      .from("wallet_state")
      .update({ available: balance - neuronsCost })
      .eq("user_id", user_id);

    return new Response(JSON.stringify({
      artifact_id: artifact?.id,
      content_preview: generatedContent.slice(0, 300),
      neurons_spent: neuronsCost,
      service_name: unit.name,
      status: "completed",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
