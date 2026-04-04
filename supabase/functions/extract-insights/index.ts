import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { loadPrompts } from "../_shared/prompt-loader.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

// Valid actions enum
const VALID_ACTIONS = new Set([
  "extract_insights", "extract_frameworks", "extract_questions",
  "extract_quotes", "extract_prompts", "debug_code", "optimize_code",
  "generate_tests", "explain_code", "transform_article", "transform_twitter",
  "transform_script", "transform_slide", "find_related", "idea_clusters",
  "influence_score", "run_pipeline", "simulate", "schedule", "validate_schema",
]);

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 3600_000;

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
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    // ── Authenticate via JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Rate limit check ──
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (30 insight extractions/hour)" }), {
        status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Regime enforcement ──
    const activeAction = (await req.clone().json()).action || "extract_insights";
    const regime = await getRegimeConfig(activeAction);
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: "Service blocked", reason: blockReason, regime: regime.regime }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const isDryRun = regime.dryRun || regime.regime === "simulation";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const InsightsSchema = z.object({
      blocks: z.array(z.object({
        type: z.string().max(50),
        content: z.string().max(50_000, "Block content too long"),
      })).min(1, "No blocks provided").max(100, "Too many blocks (max 100)"),
      neuron_title: z.string().max(500).optional(),
      action: z.string().max(50).optional(),
    });
    const parsed = InsightsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { blocks, neuron_title, action } = parsed.data;

    // Validate action
    if (action && !VALID_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Build content from blocks with length limits
    const content = blocks
      .filter((b: any) => b.content && typeof b.content === "string" && b.content.trim())
      .map((b: any) => `[${String(b.type || "text").slice(0, 20)}] ${b.content.slice(0, 10_000)}`)
      .join("\n\n")
      .slice(0, 50_000);

    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "No content to analyze" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Hardcoded fallbacks — overridden by prompt_registry if entries exist
    const fallbackPrompts: Record<string, string> = {
      extract_insights: `You are a knowledge extraction engine. Analyze the content and extract 3-7 key insights. For each: a clear title, explanation (2-3 sentences), and "**Why it matters:**" line. Use ## headings.`,
      extract_frameworks: `You are a pattern recognition engine. Extract 2-5 mental models or frameworks. For each: name, core structure, when to use, example application. Use ## headings.`,
      extract_questions: `You are a Socratic analysis engine. Generate 5-10 important questions the content raises. Categories: Clarification, Challenge, Extension, Application. Use markdown formatting.`,
      extract_quotes: `You are a quote extraction engine. Identify 3-7 quotable, impactful statements. For each: the quote, context, and suggested use. Use > blockquote formatting.`,
      extract_prompts: `You are a prompt engineering engine. Generate 3-5 reusable AI prompts to explore ideas further, generate related content, or apply frameworks. Include title, full prompt text, and expected output type. Use ## headings and code blocks.`,
      debug_code: `You are a code debugger. Analyze the code and identify bugs, errors, and potential issues. For each issue: description, location, fix suggestion, and corrected code. Use markdown with code blocks.`,
      optimize_code: `You are a code optimization expert. Analyze the code and suggest performance improvements. For each: what to optimize, why, before/after comparison. Use markdown with code blocks.`,
      generate_tests: `You are a test engineer. Generate comprehensive test cases for the code. Include unit tests, edge cases, and integration tests. Output ready-to-use test code. Use markdown with code blocks.`,
      explain_code: `You are a code explainer. Provide a clear, line-by-line explanation of the code. Cover: purpose, logic flow, key functions, dependencies, and potential gotchas. Use markdown formatting.`,
      transform_article: `You are a content transformer. Convert the following content into a well-structured article. Include: compelling headline, introduction, body sections with subheadings, conclusion with call-to-action. Professional editorial tone. Use markdown formatting.`,
      transform_twitter: `You are a Twitter thread creator. Convert the content into a compelling 5-10 tweet thread. Each tweet under 280 chars. Include hooks, insights, and a strong closing tweet. Number each tweet.`,
      transform_script: `You are a video script writer. Convert the content into a professional video/podcast script. Include: hook, main segments with timestamps, key talking points, transitions, and outro. Use markdown formatting.`,
      transform_slide: `You are a presentation designer. Convert the content into slide-ready material. For each slide: title, 3-5 bullet points, speaker notes. Aim for 5-10 slides. Use markdown formatting.`,
      find_related: `You are a knowledge graph analyzer. Based on this content, suggest 5-8 related topics, concepts, or domains that would create valuable connections. For each: topic, relationship type (supports, extends, contradicts), and why it's relevant.`,
      idea_clusters: `You are a thematic clustering engine. Group the ideas in this content into 3-5 thematic clusters. For each cluster: name, key ideas within it, and connections between them. Visualize as a text-based concept map.`,
      influence_score: `You are an impact analysis engine. Evaluate this content's potential influence across dimensions: originality (1-10), actionability (1-10), depth (1-10), breadth of application (1-10). Provide detailed justification for each score and an overall influence assessment.`,
    };

    // Load from prompt_registry (DB) with hardcoded fallback
    const activeAction = action || "extract_insights";
    const loadedPrompts = await loadPrompts([activeAction], fallbackPrompts);
    const systemPrompt = loadedPrompts[activeAction]?.prompt || fallbackPrompts[activeAction] || fallbackPrompts.extract_insights;

    const safeTitle = neuron_title ? String(neuron_title).slice(0, 200) : "";
    const userMessage = safeTitle
      ? `Neuron: "${safeTitle}"\n\nContent:\n${content}`
      : `Content:\n${content}`;

    // ── Dry-run check ──
    if (isDryRun) {
      return new Response(JSON.stringify({ dry_run: true, regime: regime.regime, message: "Simulation mode — no AI call made" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Stream back the response
    return new Response(response.body, {
      headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("extract-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
