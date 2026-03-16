import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";

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

## Available Tools
You have access to tools that let you perform real actions:
- **search_neurons**: Search the user's knowledge base by keyword
- **list_recent_neurons**: Show recently created neurons
- **list_episodes**: Show user's episodes/transcriptions
- **get_credit_balance**: Check current credit balance
- **list_services**: Show available AI services and costs

When users ask to search, browse, or check things — USE THE TOOLS instead of guessing.

## How You Respond
- When user pastes a URL or mentions content to analyze, describe what the pipeline will do and provide the Extractor link
- When user asks to generate something, outline the plan with estimated credit costs
- For search queries, USE the search_neurons tool to find real results
- Always be concise, action-oriented, and use markdown formatting
- Respond in the same language as the user (Romanian or English)

## Slash Commands
Users may use slash commands like /analyze, /extract, /search, /generate — treat these as intents.

## Economic Context
- Credits (NEURONS) power service execution
- Quick extraction: ~100 credits, Deep extraction: ~500 credits
- Service execution: 100-5000 credits depending on complexity`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_neurons",
      description: "Search user's knowledge neurons by keyword or topic",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keyword or topic" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_neurons",
      description: "List the user's most recently created neurons",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of neurons to return (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_episodes",
      description: "List user's episodes/transcriptions",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of episodes (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_credit_balance",
      description: "Get user's current NEURONS credit balance",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_services",
      description: "List available AI services with their costs",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filter by category (optional)" },
        },
      },
    },
  },
];

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

async function executeTool(
  name: string,
  args: Record<string, any>,
  userId: string,
  workspaceId: string | null,
  supabaseAdmin: any
): Promise<string> {
  switch (name) {
    case "search_neurons": {
      const limit = args.limit || 10;
      const { data } = await supabaseAdmin
        .from("neurons")
        .select("id, title, tags, status, created_at")
        .eq("author_id", userId)
        .ilike("title", `%${args.query}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!data || data.length === 0) {
        // Try tag search
        const { data: tagData } = await supabaseAdmin
          .from("neurons")
          .select("id, title, tags, status, created_at")
          .eq("author_id", userId)
          .contains("tags", [args.query.toLowerCase()])
          .order("created_at", { ascending: false })
          .limit(limit);

        if (!tagData || tagData.length === 0) {
          return JSON.stringify({ results: [], message: "No neurons found matching the query." });
        }
        return JSON.stringify({ results: tagData, count: tagData.length });
      }
      return JSON.stringify({ results: data, count: data.length });
    }

    case "list_recent_neurons": {
      const limit = args.limit || 10;
      const { data } = await supabaseAdmin
        .from("neurons")
        .select("id, title, tags, status, created_at")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return JSON.stringify({ results: data || [], count: data?.length || 0 });
    }

    case "list_episodes": {
      const limit = args.limit || 10;
      const q = supabaseAdmin
        .from("episodes")
        .select("id, title, source_type, status, duration_seconds, created_at")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      const { data } = await q;
      return JSON.stringify({ results: data || [], count: data?.length || 0 });
    }

    case "get_credit_balance": {
      const { data } = await supabaseAdmin
        .from("user_credits")
        .select("balance, total_earned, total_spent")
        .eq("user_id", userId)
        .maybeSingle();
      return JSON.stringify(data || { balance: 0, total_earned: 0, total_spent: 0 });
    }

    case "list_services": {
      let q = supabaseAdmin
        .from("service_catalog")
        .select("service_key, name, credits_cost, category, description")
        .eq("is_active", true)
        .order("credits_cost");
      if (args.category) {
        q = q.eq("category", args.category);
      }
      const { data } = await q;
      return JSON.stringify({ services: data || [], count: data?.length || 0 });
    }

    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Get workspace
    const { data: wsMember } = await supabaseAdmin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("joined_at")
      .limit(1)
      .maybeSingle();
    const workspaceId = wsMember?.workspace_id || null;

    // Build context info
    let contextInfo = "";
    if (context) {
      const parts: string[] = [];
      if (context.neuron_count !== undefined) parts.push(`Neurons: ${context.neuron_count}`);
      if (context.episode_count !== undefined) parts.push(`Episodes: ${context.episode_count}`);
      if (context.credit_balance !== undefined) parts.push(`Credits: ${context.credit_balance} NEURONS`);
      if (parts.length > 0) contextInfo = `\n\n## User's Current State\n${parts.join(" | ")}`;
    }

    const apiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + contextInfo },
      ...messages.slice(-30),
    ];

    // First call — may trigger tool use
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        tools: TOOLS,
        stream: false, // Non-streaming for tool calling
      }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (firstResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await firstResponse.text();
      console.error("AI gateway error:", firstResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstResult = await firstResponse.json();
    const choice = firstResult.choices?.[0];

    // If model wants to call tools
    if (choice?.finish_reason === "tool_calls" || choice?.message?.tool_calls?.length > 0) {
      const toolCalls = choice.message.tool_calls;

      // Add assistant message with tool calls
      apiMessages.push(choice.message);

      // Execute each tool
      for (const tc of toolCalls) {
        const args = typeof tc.function.arguments === "string"
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;

        console.log(`[agent] Executing tool: ${tc.function.name}`, args);
        const result = await executeTool(tc.function.name, args, user.id, workspaceId, supabaseAdmin);

        apiMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }

      // Second call — stream the final response with tool results
      const secondResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!secondResponse.ok) {
        const errText = await secondResponse.text();
        console.error("Second AI call error:", errText);
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(secondResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls — stream directly
    // Re-do the call with streaming since the first was non-streaming
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(streamResponse.body, {
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
