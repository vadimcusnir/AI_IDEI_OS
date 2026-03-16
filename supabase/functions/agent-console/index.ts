import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";

const INTENTS = [
  "analyze_source",
  "extract_neurons",
  "generate_summary",
  "generate_framework",
  "generate_article",
  "compare_sources",
  "build_topic_map",
  "create_course",
  "search_knowledge",
  "general_chat",
] as const;

const INTENT_DESCRIPTIONS: Record<string, string> = {
  analyze_source: "User wants to process a URL, file, or text through the full extraction pipeline",
  extract_neurons: "User wants to extract knowledge neurons from existing content",
  generate_summary: "User wants a summary of content or neurons",
  generate_framework: "User wants to generate a structured framework",
  generate_article: "User wants to generate an article from neurons",
  compare_sources: "User wants to compare two or more sources/episodes",
  build_topic_map: "User wants to visualize or build a topic map",
  create_course: "User wants to create a course from neurons",
  search_knowledge: "User wants to search the knowledge graph",
  general_chat: "General conversation or platform help",
};

const SYSTEM_PROMPT = `You are the AI-IDEI Agent — a Knowledge Operating System command interface.

You orchestrate a pipeline that transforms raw content into structured knowledge assets.

## Your Capabilities
1. **Analyze Sources**: Process URLs (YouTube, web), audio, video, PDF, or text through the full pipeline
2. **Extract Neurons**: Pull insights, frameworks, patterns from transcripts
3. **Generate Assets**: Create articles, frameworks, courses, summaries from neurons
4. **Search Knowledge**: Query the knowledge graph for specific topics/patterns
5. **Compare Sources**: Cross-reference multiple episodes or content pieces

## Pipeline Stages
SOURCE → TRANSCRIBE → SEGMENT → EXTRACT NEURONS → LINK KNOWLEDGE → GENERATE ASSETS

## How You Respond
- When user pastes a URL or mentions content to analyze, describe what the pipeline will do and confirm
- When user asks to generate something, outline the plan with estimated credit costs
- For search queries, help them navigate their knowledge base
- Always be concise, action-oriented, and use markdown formatting
- Respond in the same language as the user (Romanian or English)
- When suggesting actions, format them as clear next steps

## Economic Context
- Credits (NEURONS) power service execution
- Quick extraction: ~100 credits, Deep extraction: ~500 credits
- Service execution: 100-5000 credits depending on complexity

## Available Services (reference when relevant)
- summary: Generate comprehensive summary
- personality-intelligence: Psychological profile analysis
- avatar33: Speaker profile extraction
- podcast-intelligence: Full podcast analysis
- framework-extraction: Extract structured frameworks
- pattern-analysis: Identify recurring patterns`;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

const InputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().max(30_000),
  })).min(1).max(50),
  context: z.object({
    neuron_count: z.number().optional(),
    episode_count: z.number().optional(),
    credit_balance: z.number().optional(),
  }).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, context } = parsed.data;

    // Add context to system prompt
    let contextInfo = "";
    if (context) {
      const parts: string[] = [];
      if (context.neuron_count !== undefined) parts.push(`Neurons: ${context.neuron_count}`);
      if (context.episode_count !== undefined) parts.push(`Episodes: ${context.episode_count}`);
      if (context.credit_balance !== undefined) parts.push(`Credits: ${context.credit_balance} NEURONS`);
      if (parts.length > 0) contextInfo = `\n\n## User's Current State\n${parts.join(" | ")}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextInfo },
          ...messages.slice(-30),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
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
    console.error("agent-console error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
