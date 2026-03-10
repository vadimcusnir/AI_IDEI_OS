import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { blocks, neuron_title, action } = await req.json();

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return new Response(JSON.stringify({ error: "No blocks provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build content from blocks
    const content = blocks
      .filter((b: any) => b.content && b.content.trim())
      .map((b: any) => `[${b.type}] ${b.content}`)
      .join("\n\n");

    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "No content to analyze" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Select prompt based on action
    const prompts: Record<string, string> = {
      extract_insights: `You are a knowledge extraction engine for a Knowledge Operating System.

Analyze the following neuron content and extract the most important insights.

For each insight provide:
- A clear, concise title (max 10 words)
- A detailed explanation (2-3 sentences)
- Why it matters (practical implication)

Return between 3-7 insights, ordered by importance.

Format your response as a structured list. Use markdown formatting with ## for each insight title, followed by the explanation and a "**Why it matters:**" line.`,

      extract_frameworks: `You are a pattern recognition engine for a Knowledge Operating System.

Analyze the following content and extract any mental models, frameworks, or structured thinking patterns.

For each framework provide:
- Framework name
- Core structure (steps, components, or layers)
- When to use it
- Example application

Return between 2-5 frameworks. Use markdown with ## for each framework name.`,

      extract_questions: `You are a Socratic analysis engine for a Knowledge Operating System.

Analyze the following content and generate the most important questions it raises — both answered and unanswered.

Categories:
- **Clarification questions** — what needs more detail?
- **Challenge questions** — what assumptions can be questioned?
- **Extension questions** — where can this idea go further?
- **Application questions** — how can this be used practically?

Return 5-10 questions with their category. Use markdown formatting.`,

      extract_quotes: `You are a quote extraction engine for a Knowledge Operating System.

Analyze the following content and identify the most quotable, shareable, and impactful statements.

For each quote provide:
- The exact quote or a refined version
- Context of why it's powerful
- Suggested use (social media, presentation, article opener, etc.)

Return 3-7 quotes. Use markdown with > blockquote formatting.`,

      extract_prompts: `You are a prompt engineering engine for a Knowledge Operating System.

Analyze the following content and generate reusable AI prompts that could be used to:
- Explore the ideas further
- Generate related content
- Apply the frameworks mentioned
- Create derivative works

For each prompt provide:
- Prompt title
- The full prompt text (ready to use)
- Expected output type

Return 3-5 prompts. Use markdown with ## for each prompt title and \`\`\` code blocks for the prompt text.`,
    };

    const systemPrompt = prompts[action] || prompts.extract_insights;

    const userMessage = neuron_title
      ? `Neuron: "${neuron_title}"\n\nContent:\n${content}`
      : `Content:\n${content}`;

    // Call Lovable AI Gateway with streaming
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream back the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("extract-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
