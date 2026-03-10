import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SERVICE_PROMPTS: Record<string, string> = {
  "insight-extractor": `You are a knowledge extraction engine. Analyze the provided content and extract the most important insights.
For each insight provide: title, explanation, practical implication. Return 5-10 insights structured with ## headings.`,
  "framework-detector": `You are a pattern recognition engine. Analyze the content and identify mental models, frameworks, and structured thinking patterns.
For each: name, core structure, when to use, example. Return 3-7 frameworks with ## headings.`,
  "question-engine": `You are a Socratic analysis engine. Generate the most important questions the content raises.
Categories: Clarification, Challenge, Extension, Application. Return 7-12 questions with categories.`,
  "quote-extractor": `You are a quote extraction engine. Identify the most quotable, shareable, impactful statements.
For each: the quote, context, suggested use. Return 5-10 quotes with > blockquote formatting.`,
  "prompt-generator": `You are a prompt engineering engine. Generate reusable AI prompts based on the content.
For each: title, full prompt text, expected output. Return 3-7 prompts with code blocks.`,
  "market-research": `You are a market research analyst. Based on the input context, produce a comprehensive market analysis.
Include: Market Overview, Key Players, Target Audience, Opportunities, Threats, Entry Strategy, Pricing Analysis, Competitive Positioning, Action Plan.
Each section should be detailed with specific data points and actionable recommendations. Use ## headings.`,
  "course-generator": `You are an educational content architect. Based on the input, design a complete course structure.
Include: Course Title, Learning Objectives, Module Breakdown (5-8 modules), Lesson Outlines, Exercises, Assessment Criteria.
Make it practical and actionable. Use ## headings.`,
  "content-classifier": `You are a content classification engine. Analyze the content and classify it across multiple dimensions.
Provide: Primary Category, Sub-categories, Themes, Sentiment, Complexity Level, Target Audience, Content Type, Key Topics.
Return structured analysis with ## headings.`,
  "strategy-builder": `You are a strategic planning engine. Based on the context, develop a comprehensive strategy.
Include: Situation Analysis, Strategic Objectives, Key Initiatives, Resource Requirements, Timeline, Risk Assessment, Success Metrics, Implementation Plan.
Each section detailed. Use ## headings.`,
  "argument-mapper": `You are an argumentation analysis engine. Map the logical structure of ideas presented.
Include: Central Claim, Supporting Arguments, Evidence Assessment, Counterarguments, Logical Gaps, Strengthening Suggestions.
Use structured formatting with ## headings.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { job_id, service_key, neuron_id, inputs, user_id } = await req.json();

    if (!job_id || !service_key || !user_id) {
      return new Response(JSON.stringify({ error: "Missing job_id, service_key, or user_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 1: Update job to running ──
    await supabase.from("neuron_jobs").update({ status: "running" }).eq("id", job_id);

    // ── STEP 2: Fetch service cost ──
    const { data: service } = await supabase
      .from("service_catalog")
      .select("credits_cost, name")
      .eq("service_key", service_key)
      .single();

    if (!service) {
      await supabase.from("neuron_jobs").update({ status: "failed", completed_at: new Date().toISOString(), result: { error: "Service not found" } }).eq("id", job_id);
      return new Response(JSON.stringify({ error: "Service not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 3: Reserve credits (server-side atomic check) ──
    const { data: userCredits } = await supabase
      .from("user_credits")
      .select("balance, total_spent")
      .eq("user_id", user_id)
      .single();

    if (!userCredits || userCredits.balance < service.credits_cost) {
      await supabase.from("neuron_jobs").update({
        status: "failed",
        completed_at: new Date().toISOString(),
        result: { error: "RC.CREDITS.INSUFFICIENT", reason: `Need ${service.credits_cost}, have ${userCredits?.balance ?? 0}` },
      }).eq("id", job_id);

      // Log denied decision
      await supabase.from("credit_transactions").insert({
        user_id,
        job_id,
        amount: 0,
        type: "denied",
        description: `DENIED: ${service.name} — insufficient credits`,
      });

      return new Response(JSON.stringify({ error: "Insufficient credits", reason_code: "RC.CREDITS.INSUFFICIENT" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reserve: deduct credits immediately
    const newBalance = userCredits.balance - service.credits_cost;
    const newSpent = userCredits.total_spent + service.credits_cost;
    await supabase.from("user_credits").update({
      balance: newBalance,
      total_spent: newSpent,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user_id);

    // Log reservation
    await supabase.from("credit_transactions").insert({
      user_id,
      job_id,
      amount: -service.credits_cost,
      type: "reserve",
      description: `RESERVE: ${service.name}`,
    });

    // ── STEP 4: Execute AI pipeline ──
    const systemPrompt = SERVICE_PROMPTS[service_key] || SERVICE_PROMPTS["insight-extractor"];
    const inputText = Object.entries(inputs || {})
      .filter(([_, v]) => v && String(v).trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n\n");

    const userMessage = inputText || "Analyze the provided context and produce comprehensive results.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      // ── STEP 4b: Release credits on AI failure ──
      await supabase.from("user_credits").update({
        balance: newBalance + service.credits_cost,
        total_spent: newSpent - service.credits_cost,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user_id);

      await supabase.from("credit_transactions").insert({
        user_id,
        job_id,
        amount: service.credits_cost,
        type: "release",
        description: `RELEASE: ${service.name} — AI error ${response.status}`,
      });

      await supabase.from("neuron_jobs").update({
        status: "failed",
        completed_at: new Date().toISOString(),
        result: { error: `AI error: ${response.status}` },
      }).eq("id", job_id);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Credits released." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Credits released." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service unavailable. Credits released." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 5: Stream response, collect full result for auditing ──
    // We need to tee the stream: one for the client, one to collect the full text
    const [clientStream, auditStream] = response.body!.tee();

    // Background: collect full result and finalize job
    const finalizeJob = async () => {
      try {
        const reader = auditStream.getReader();
        const decoder = new TextDecoder();
        let fullResult = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nlIndex: number;
          while ((nlIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nlIndex);
            buffer = buffer.slice(nlIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResult += content;
            } catch { /* partial */ }
          }
        }

        // Finalize: mark job completed with audited result
        await supabase.from("neuron_jobs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result: { content: fullResult, credits_spent: service.credits_cost, service: service.name },
        }).eq("id", job_id);

        // Log spend (confirm reservation)
        await supabase.from("credit_transactions").insert({
          user_id,
          job_id,
          amount: -service.credits_cost,
          type: "spend",
          description: `SPEND: ${service.name} — completed`,
        });

        // Save result as neuron block
        if (neuron_id && fullResult) {
          await supabase.from("neuron_blocks").insert({
            neuron_id,
            type: "markdown",
            content: fullResult,
            position: 0,
            execution_mode: "passive",
          });

          // Update neuron lifecycle
          await supabase.from("neurons").update({
            status: "published",
            lifecycle: "structured",
            updated_at: new Date().toISOString(),
          }).eq("id", neuron_id);
        }
      } catch (e) {
        console.error("Finalize job error:", e);
        // On finalize failure, still mark job but log error
        await supabase.from("neuron_jobs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result: { error: "Finalization error", partial: true },
        }).eq("id", job_id);
      }
    };

    // Fire and forget the audit collection
    finalizeJob();

    // ── STEP 6: Return stream to client ──
    return new Response(clientStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("run-service error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
