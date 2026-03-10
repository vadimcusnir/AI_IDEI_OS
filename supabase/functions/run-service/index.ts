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

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { job_id, service_key, neuron_id, inputs, user_id } = await req.json();

    if (!job_id || !service_key) {
      return new Response(JSON.stringify({ error: "Missing job_id or service_key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = SERVICE_PROMPTS[service_key] || SERVICE_PROMPTS["insight-extractor"];

    // Build user message from inputs
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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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
