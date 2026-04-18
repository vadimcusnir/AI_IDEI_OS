/**
 * execute-service — Full execution engine for L3/L2/L1 services.
 * 1. Authenticates user via JWT
 * 2. Validates input (service_slug + service_level + user_input)
 * 3. Creates purchase record, deducts credits
 * 4. Looks up execution_prompts server-side (never exposed to client)
 * 5. Executes AI generation via Lovable AI Gateway
 * 6. Stores deliverable, updates purchase status
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { reportError } from "../_shared/error-reporter.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { buildBoundedMessages } from "../_shared/prompt-boundary.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const inputSchema = z.object({
  service_slug: z.string().trim().min(1).max(200),
  service_level: z.enum(["L1", "L2", "L3"]),
  user_input: z.string().trim().min(1).max(50000),
  neuron_ids: z.array(z.number()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const corsHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    // ── Auth ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // ── Rate limit ──
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    // ── Validate input ──
    const rawBody = await req.json();
    const parsed = inputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.issues }), { status: 400, headers: corsHeaders });
    }
    const { service_slug, service_level, user_input, neuron_ids } = parsed.data;

    // ── Lookup service ──
    const tableName = service_level === "L1" ? "services_level_1" : service_level === "L2" ? "services_level_2" : "services_level_3";
    const { data: service, error: svcErr } = await adminClient
      .from(tableName)
      .select("*")
      .eq("service_slug", service_slug)
      .eq("status", "active")
      .maybeSingle();

    if (svcErr || !service) {
      return new Response(JSON.stringify({ error: "Service not found" }), { status: 404, headers: corsHeaders });
    }

    // ── Check credits ──
    const creditCost = service.internal_credit_cost || 0;
    const { data: creditData } = await adminClient
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const balance = creditData?.balance ?? 0;
    if (balance < creditCost) {
      return new Response(JSON.stringify({ error: "Insufficient credits", required: creditCost, balance }), { status: 402, headers: corsHeaders });
    }

    // ── Create purchase ──
    const { data: purchase, error: purchaseErr } = await adminClient
      .from("service_purchases")
      .insert({
        user_id: user.id,
        service_id: service.id,
        service_level,
        service_name: service.service_name,
        price_usd_snapshot: service.price_usd,
        neuroni_cost_snapshot: creditCost,
        payment_method: "credits",
        payment_status: "completed",
        execution_status: "running",
        execution_started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (purchaseErr || !purchase) {
      console.error("Purchase creation failed:", purchaseErr);
      return new Response(JSON.stringify({ error: "Failed to create purchase" }), { status: 500, headers: corsHeaders });
    }

    // ── Deduct credits ──
    await adminClient.rpc("deduct_credits", { p_user_id: user.id, p_amount: creditCost });

    // ── Lookup execution prompt (server-side only) ──
    let systemPrompt = `You are an expert AI execution engine for the AI-IDEI platform.
Service: "${service.service_name}" (Level: ${service_level}, Category: ${service.category})
Deliverable: ${service.deliverable_name} (${service.deliverable_type})

Your task:
- Analyze the user's input thoroughly
- Generate a high-quality, professional ${service.deliverable_type} based on the service specification
- Be specific, actionable, and creative
- Format output clearly with headers and sections
- Match the user's input language`;

    if (service.execution_prompt_id) {
      const { data: promptData } = await adminClient
        .from("execution_prompts")
        .select("prompt_text_encrypted, quality_rules")
        .eq("id", service.execution_prompt_id)
        .maybeSingle();

      if (promptData?.prompt_text_encrypted) {
        systemPrompt = promptData.prompt_text_encrypted;
        if (promptData.quality_rules) {
          systemPrompt += `\n\nQuality Rules: ${JSON.stringify(promptData.quality_rules)}`;
        }
      }
    }

    // ── Formation framework (for L2/L1 assembly) ──
    if (service.formation_framework_id) {
      const { data: fwData } = await adminClient
        .from("formation_frameworks")
        .select("framework_logic_encrypted, assembly_rules")
        .eq("id", service.formation_framework_id)
        .maybeSingle();

      if (fwData?.framework_logic_encrypted) {
        systemPrompt += `\n\nAssembly Framework:\n${fwData.framework_logic_encrypted}`;
      }
      if (fwData?.assembly_rules) {
        systemPrompt += `\n\nAssembly Rules: ${JSON.stringify(fwData.assembly_rules)}`;
      }
    }

    // ── Neuron context injection ──
    let neuronContext = "";
    if (neuron_ids && neuron_ids.length > 0) {
      const { data: neurons } = await adminClient
        .from("neurons")
        .select("title, core_content, content_type")
        .in("id", neuron_ids.slice(0, 20));

      if (neurons && neurons.length > 0) {
        neuronContext = "\n\n--- USER KNOWLEDGE BASE ---\n" +
          neurons.map((n: any) => `[${n.content_type}] ${n.title}: ${n.core_content}`).join("\n\n");
      }
    }

    // ── Execute AI ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiModel = service_level === "L1" ? "google/gemini-2.5-pro" :
                    service_level === "L2" ? "google/gemini-3-flash-preview" :
                    "google/gemini-2.5-flash";

    const { messages: boundedMessages } = buildBoundedMessages({
      system: systemPrompt,
      userParts: [
        { label: "user_input", content: user_input, maxLen: 20000 },
        ...(neuronContext ? [{ label: "neuron_context", content: neuronContext, maxLen: 30000 }] : []),
      ],
      alertSourceFn: "execute-service",
      userId: user.id,
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: boundedMessages,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      console.error("AI error:", status, body);

      // Refund credits on AI failure
      await adminClient.rpc("add_credits", { p_user_id: user.id, p_amount: creditCost });
      await adminClient.from("service_purchases").update({
        execution_status: "failed",
        execution_completed_at: new Date().toISOString(),
        metadata: { error: `AI error ${status}` },
      }).eq("id", purchase.id);

      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited by AI provider" }), { status: 429, headers: corsHeaders });
      if (status === 402) return new Response(JSON.stringify({ error: "AI payment required" }), { status: 402, headers: corsHeaders });
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // ── Store deliverable ──
    const { data: deliverable, error: delErr } = await adminClient
      .from("service_deliverables")
      .insert({
        purchase_id: purchase.id,
        service_id: service.id,
        service_level,
        user_id: user.id,
        deliverable_name: service.deliverable_name || service.service_name,
        deliverable_type: service.deliverable_type || "document",
        content,
        format: "markdown",
        status: "completed",
        classification_tags: [service.category, service_level],
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (delErr) {
      console.error("Deliverable storage failed:", delErr);
    }

    // ── Update purchase status ──
    await adminClient.from("service_purchases").update({
      execution_status: "completed",
      execution_completed_at: new Date().toISOString(),
    }).eq("id", purchase.id);

    return new Response(JSON.stringify({
      success: true,
      purchase_id: purchase.id,
      deliverable_id: deliverable?.id,
      content,
      service_name: service.service_name,
      credits_spent: creditCost,
    }), { headers: corsHeaders });

  } catch (e) {
    console.error("execute-service error:", e);
    await reportError(e, {
      functionName: "execute-service",
      alert: { severity: "high", serviceKey: "service-execution", impactScope: "L1/L2/L3 service deliverables", recommendedAction: "Check execution_prompts integrity, AI gateway quota, purchase rollback." },
    });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: corsHeaders });
  }
});
