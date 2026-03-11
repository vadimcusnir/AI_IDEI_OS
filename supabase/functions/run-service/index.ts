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
  "profile-extractor": `You are a personal branding expert and content architect. Given a user's experience, skills, and products, generate:

## Hero Text
A compelling 1-2 sentence hero tagline for their personal page. Bold, memorable, positioning them as an authority.

## Bio
A 3-4 paragraph professional biography that tells their story, highlights key achievements, and builds trust. Write in first person.

## Products & Services
For each product/service they offer, create:
- **Title**: Clear, benefit-driven name
- **Description**: 2-3 sentences explaining value
- **Price suggestion**: Based on market positioning
- **Target audience**: Who benefits most

## Key Neurons
Extract 5-8 atomic knowledge units (neurons) from their experience. Each neuron should be:
- A single, self-contained insight or expertise area
- Titled concisely (3-7 words)
- With a brief explanation (1-2 sentences)

Use the tone specified by the user. Default to professional but approachable.`,
  "prompt-forge": `You are an expert prompt engineer specializing in personal branding and content creation. Based on the user's context and goal, generate:

## Primary Prompt
A detailed, ready-to-use prompt optimized for the specified goal. Include:
- Clear role definition
- Specific instructions
- Output format specification
- Quality constraints

## Variations
3 alternative prompt variations, each with a different approach:
1. **Concise version** — shorter, focused
2. **Detailed version** — comprehensive, with examples
3. **Creative version** — unconventional angle

## Suggested Content Blocks
Recommend 3-5 content blocks (TextBlock, PromptBlock, ListBlock) that would work well with this prompt, including:
- Block type and purpose
- Example content or structure
- How it connects to the overall goal

Format everything with ## headings and clear structure.`,
};

// Map service keys to artifact types
const SERVICE_ARTIFACT_TYPE: Record<string, string> = {
  "insight-extractor": "document",
  "framework-detector": "document",
  "question-engine": "document",
  "quote-extractor": "document",
  "prompt-generator": "prompt",
  "market-research": "report",
  "course-generator": "course",
  "content-classifier": "document",
  "strategy-builder": "strategy",
  "argument-mapper": "document",
  "profile-extractor": "profile",
  "prompt-forge": "prompt",
};

// Valid service keys for input validation
const VALID_SERVICE_KEYS = new Set(Object.keys(SERVICE_PROMPTS));

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // per hour
const RATE_WINDOW = 3600_000; // 1 hour in ms

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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── AUTHENTICATE via JWT — derive user_id from token ──
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
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // CRITICAL: Always derive user_id from JWT, never from request body
    const user_id = caller.id;

    // ── Rate limit check ──
    if (!checkRateLimit(user_id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (20 service runs/hour)" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { job_id, service_key, neuron_id, inputs } = await req.json();

    if (!job_id || typeof job_id !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid job_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!service_key || typeof service_key !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid service_key" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input lengths
    if (inputs && typeof inputs === "object") {
      for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === "string" && value.length > 50_000) {
          return new Response(JSON.stringify({ error: `Input '${key}' exceeds maximum length (50000 chars)` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // ── Update job to running ──
    await supabase.from("neuron_jobs").update({ status: "running" }).eq("id", job_id);

    // ── Fetch service cost ──
    const { data: service } = await supabase
      .from("service_catalog").select("credits_cost, name").eq("service_key", service_key).single();

    if (!service) {
      await supabase.from("neuron_jobs").update({ status: "failed", completed_at: new Date().toISOString(), result: { error: "Service not found" } }).eq("id", job_id);
      return new Response(JSON.stringify({ error: "Service not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Spend credits atomically via SECURITY DEFINER function ──
    const { data: spent } = await supabase.rpc("spend_credits", {
      _user_id: user_id,
      _amount: service.credits_cost,
      _description: `SPEND: ${service.name}`,
      _job_id: job_id,
    });

    if (!spent) {
      await supabase.from("neuron_jobs").update({
        status: "failed", completed_at: new Date().toISOString(),
        result: { error: "RC.CREDITS.INSUFFICIENT", reason: `Need ${service.credits_cost} credits` },
      }).eq("id", job_id);

      return new Response(JSON.stringify({ error: "Insufficient credits", reason_code: "RC.CREDITS.INSUFFICIENT" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Execute AI pipeline ──
    const systemPrompt = SERVICE_PROMPTS[service_key] || SERVICE_PROMPTS["insight-extractor"];
    const inputText = Object.entries(inputs || {})
      .filter(([_, v]) => v && String(v).trim())
      .map(([k, v]) => `${k}: ${v}`).join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: inputText || "Analyze the provided context and produce comprehensive results." },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      // Refund credits on AI failure via atomic function
      await supabase.rpc("add_credits", {
        _user_id: user_id,
        _amount: service.credits_cost,
        _description: `REFUND: ${service.name} — AI error ${response.status}`,
        _type: "refund",
      });

      await supabase.from("neuron_jobs").update({
        status: "failed", completed_at: new Date().toISOString(),
        result: { error: `AI error: ${response.status}` },
      }).eq("id", job_id);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Credits refunded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Credits refunded." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service unavailable. Credits refunded." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Stream response, collect for auditing + artifact generation ──
    const [clientStream, auditStream] = response.body!.tee();

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

        // Mark job completed
        await supabase.from("neuron_jobs").update({
          status: "completed", completed_at: new Date().toISOString(),
          result: { content: fullResult, credits_spent: service.credits_cost, service: service.name },
        }).eq("id", job_id);

        // Save as neuron block
        if (neuron_id && fullResult) {
          await supabase.from("neuron_blocks").insert({
            neuron_id, type: "markdown", content: fullResult.slice(0, 100_000), position: 0, execution_mode: "passive",
          });
          await supabase.from("neurons").update({
            status: "published", lifecycle: "structured", updated_at: new Date().toISOString(),
          }).eq("id", neuron_id);
        }

        // ── AUTO-GENERATE ARTIFACT ──
        if (fullResult && fullResult.length > 50) {
          const artifactType = SERVICE_ARTIFACT_TYPE[service_key] || "document";
          const artifactTitle = `${service.name} — ${new Date().toLocaleDateString("ro-RO")}`;

          const { data: artifact } = await supabase.from("artifacts").insert({
            author_id: user_id,
            title: artifactTitle,
            artifact_type: artifactType,
            content: fullResult.slice(0, 200_000),
            format: "markdown",
            status: "generated",
            service_key,
            job_id,
            tags: [service_key, artifactType],
            metadata: { credits_spent: service.credits_cost, neuron_id },
          }).select("id").single();

          // Link artifact to source neuron
          if (artifact && neuron_id) {
            await supabase.from("artifact_neurons").insert({
              artifact_id: artifact.id,
              neuron_id,
              relation_type: "source",
            });
          }
        }
      } catch (e) {
        console.error("Finalize job error:", e);
        await supabase.from("neuron_jobs").update({
          status: "completed", completed_at: new Date().toISOString(),
          result: { error: "Finalization error", partial: true },
        }).eq("id", job_id);
      }
    };

    finalizeJob();

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
