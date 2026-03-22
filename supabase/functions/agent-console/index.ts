import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";

// ── Intent Classification ──
type Intent = "analyze" | "extract" | "generate" | "search" | "summarize" | "compare" | "services" | "profile" | "course" | "topics" | "general";

function classifyIntent(text: string): { intent: Intent; params: Record<string, string> } {
  const lower = text.toLowerCase().trim();
  
  // Slash command detection
  if (lower.startsWith("/analyze")) return { intent: "analyze", params: { input: text.slice(8).trim() } };
  if (lower.startsWith("/extract")) return { intent: "extract", params: { input: text.slice(8).trim() } };
  if (lower.startsWith("/generate")) return { intent: "generate", params: { input: text.slice(9).trim() } };
  if (lower.startsWith("/search")) return { intent: "search", params: { query: text.slice(7).trim() } };
  if (lower.startsWith("/summarize")) return { intent: "summarize", params: { input: text.slice(10).trim() } };
  if (lower.startsWith("/compare")) return { intent: "compare", params: { input: text.slice(8).trim() } };
  if (lower.startsWith("/services")) return { intent: "services", params: { category: text.slice(9).trim() } };
  if (lower.startsWith("/profile")) return { intent: "profile", params: { name: text.slice(8).trim() } };
  if (lower.startsWith("/course")) return { intent: "course", params: { input: text.slice(7).trim() } };
  if (lower.startsWith("/topics")) return { intent: "topics", params: { input: text.slice(7).trim() } };

  // Natural language intent detection
  const urlPattern = /(https?:\/\/[^\s]+)/;
  const hasUrl = urlPattern.test(text);
  
  if (hasUrl && (lower.includes("analiz") || lower.includes("process") || lower.includes("extrage"))) {
    return { intent: "analyze", params: { url: text.match(urlPattern)?.[1] || "", input: text } };
  }
  if (lower.includes("extract") || lower.includes("extrage") || lower.includes("neuron")) {
    return { intent: "extract", params: { input: text } };
  }
  if (lower.includes("genereaz") || lower.includes("generate") || lower.includes("scrie") || lower.includes("write") || lower.includes("create article") || lower.includes("creează")) {
    return { intent: "generate", params: { input: text } };
  }
  if (lower.includes("search") || lower.includes("caut") || lower.includes("find") || lower.includes("găsește") || lower.includes("show all")) {
    return { intent: "search", params: { query: text } };
  }
  if (lower.includes("sumariz") || lower.includes("summarize") || lower.includes("rezumat") || lower.includes("summary")) {
    return { intent: "summarize", params: { input: text } };
  }
  if (lower.includes("compar") || lower.includes("cross-ref")) {
    return { intent: "compare", params: { input: text } };
  }
  if (lower.includes("servic") || lower.includes("cost") || lower.includes("run ")) {
    return { intent: "services", params: { input: text } };
  }
  if (lower.includes("profil") || lower.includes("guest") || lower.includes("speaker")) {
    return { intent: "profile", params: { name: text } };
  }
  if (hasUrl) {
    return { intent: "analyze", params: { url: text.match(urlPattern)?.[1] || "", input: text } };
  }
  
  return { intent: "general", params: { input: text } };
}

const SYSTEM_PROMPT = `You are the AI-IDEI Agent — a Knowledge Operating System command interface.

You orchestrate a pipeline that transforms raw content into structured knowledge assets.

## Your Capabilities
1. **Analyze Sources**: Process URLs (YouTube, web), audio, video, PDF, or text through the full pipeline
2. **Extract Neurons**: Pull insights, frameworks, patterns from transcripts
3. **Generate Assets**: Create articles, frameworks, courses, summaries from neurons
4. **Search Knowledge**: Query the knowledge graph for specific topics/patterns
5. **Compare Sources**: Cross-reference multiple episodes or content pieces
6. **Create Jobs**: Schedule AI service executions that produce deliverables
7. **Profile Analysis**: Analyze speaker profiles from transcripts

## Pipeline Stages
SOURCE → TRANSCRIBE → SEGMENT → EXTRACT NEURONS → LINK KNOWLEDGE → GENERATE ASSETS

## Available Tools
You have access to tools that let you perform real actions:
- **search_neurons**: Search the user's knowledge base by keyword
- **list_recent_neurons**: Show recently created neurons
- **list_episodes**: Show user's episodes/transcriptions
- **get_credit_balance**: Check current credit balance
- **list_services**: Show available AI services and costs
- **create_job**: Create a new job for AI service execution
- **search_guests**: Search guest profiles
- **get_user_memory**: Retrieve persistent user preferences and context

When users ask to search, browse, or check things — USE THE TOOLS instead of guessing.
When users ask to generate/create/run something — use create_job to schedule it.

## Memory Levels
1. **Session**: Current conversation context (automatic)
2. **User**: Persistent preferences, frequently used patterns (via get_user_memory tool)
3. **Knowledge**: Global knowledge graph accessible via search tools

## How You Respond
- When user pastes a URL, IMMEDIATELY suggest analyzing it and provide cost estimate
- When user asks to generate, use create_job to schedule execution
- For search queries, USE the search_neurons tool to find real results
- Always be concise, action-oriented, and use markdown formatting
- Respond in the same language as the user (Romanian or English)
- When creating jobs, confirm the cost and what will be produced

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
  {
    type: "function",
    function: {
      name: "create_job",
      description: "Create a job to execute an AI service. Returns job ID and estimated cost. Use when user wants to generate, analyze, or process something.",
      parameters: {
        type: "object",
        properties: {
          service_key: { type: "string", description: "Service key from service_catalog (e.g. 'deep-extract', 'generate-article', 'analyze-psychology')" },
          neuron_id: { type: "number", description: "Target neuron ID (if applicable)" },
          episode_id: { type: "string", description: "Target episode ID (if applicable)" },
          params: { type: "object", description: "Additional parameters for the service" },
        },
        required: ["service_key"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_guests",
      description: "Search guest profiles by name or expertise",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name or expertise keyword" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_memory",
      description: "Get persistent user context: preferences, frequently used services, recent activity summary",
      parameters: { type: "object", properties: {} },
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
        .select("id, title, tags, status, created_at, score, content_category")
        .eq("author_id", userId)
        .ilike("title", `%${args.query}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!data || data.length === 0) {
        const { data: tagData } = await supabaseAdmin
          .from("neurons")
          .select("id, title, tags, status, created_at, score")
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
        .select("id, title, tags, status, created_at, score, content_category")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return JSON.stringify({ results: data || [], count: data?.length || 0 });
    }

    case "list_episodes": {
      const limit = args.limit || 10;
      const { data } = await supabaseAdmin
        .from("episodes")
        .select("id, title, source_type, status, duration_seconds, created_at")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return JSON.stringify({ results: data || [], count: data?.length || 0 });
    }

    case "get_credit_balance": {
      const { data } = await supabaseAdmin
        .from("user_credits")
        .select("balance, total_earned, total_spent, daily_spent, daily_spend_cap")
        .eq("user_id", userId)
        .maybeSingle();
      return JSON.stringify(data || { balance: 0, total_earned: 0, total_spent: 0 });
    }

    case "list_services": {
      let q = supabaseAdmin
        .from("service_catalog")
        .select("service_key, name, credits_cost, category, description, service_class")
        .eq("is_active", true)
        .order("credits_cost");
      if (args.category) {
        q = q.eq("category", args.category);
      }
      const { data } = await q;
      return JSON.stringify({ services: data || [], count: data?.length || 0 });
    }

    case "create_job": {
      // Lookup service cost
      const { data: svc } = await supabaseAdmin
        .from("service_catalog")
        .select("id, service_key, name, credits_cost")
        .eq("service_key", args.service_key)
        .eq("is_active", true)
        .maybeSingle();

      if (!svc) {
        return JSON.stringify({ error: `Service '${args.service_key}' not found or inactive` });
      }

      // Check credits
      const { data: credits } = await supabaseAdmin
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (!credits || credits.balance < svc.credits_cost) {
        return JSON.stringify({
          error: "INSUFFICIENT_CREDITS",
          required: svc.credits_cost,
          available: credits?.balance || 0,
          service: svc.name,
        });
      }

      // Create job
      const jobPayload: any = {
        author_id: userId,
        worker_type: args.service_key,
        status: "pending",
        params: args.params || {},
        workspace_id: workspaceId,
      };
      if (args.neuron_id) jobPayload.neuron_id = args.neuron_id;

      const { data: job, error: jobErr } = await supabaseAdmin
        .from("neuron_jobs")
        .insert(jobPayload)
        .select("id, worker_type, status")
        .single();

      if (jobErr) {
        return JSON.stringify({ error: `Job creation failed: ${jobErr.message}` });
      }

      // Reserve credits
      await supabaseAdmin.rpc("reserve_credits", {
        _user_id: userId,
        _amount: svc.credits_cost,
        _job_id: job.id,
      });

      return JSON.stringify({
        success: true,
        job_id: job.id,
        service: svc.name,
        credits_reserved: svc.credits_cost,
        status: "pending",
        message: `Job created! ${svc.credits_cost} NEURONS reserved. The job will process in background.`,
      });
    }

    case "search_guests": {
      const { data } = await supabaseAdmin
        .from("guest_profiles")
        .select("id, full_name, role, slug, expertise_areas, is_public")
        .eq("author_id", userId)
        .or(`full_name.ilike.%${args.query}%,role.ilike.%${args.query}%`)
        .limit(10);
      return JSON.stringify({ results: data || [], count: data?.length || 0 });
    }

    case "get_user_memory": {
      // Aggregate user context from multiple sources
      const [recentJobs, recentNeurons, prefs] = await Promise.all([
        supabaseAdmin
          .from("neuron_jobs")
          .select("worker_type, status, created_at")
          .eq("author_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabaseAdmin
          .from("neurons")
          .select("content_category, tags")
          .eq("author_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabaseAdmin
          .from("notification_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      // Derive frequently used services
      const serviceCounts: Record<string, number> = {};
      (recentJobs.data || []).forEach((j: any) => {
        serviceCounts[j.worker_type] = (serviceCounts[j.worker_type] || 0) + 1;
      });

      // Derive top categories and tags
      const tagCounts: Record<string, number> = {};
      (recentNeurons.data || []).forEach((n: any) => {
        (n.tags || []).forEach((t: string) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      return JSON.stringify({
        frequent_services: Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        top_tags: topTags,
        recent_jobs: (recentJobs.data || []).slice(0, 3),
      });
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

    // ── Intent classification on last user message ──
    const lastUserMsg = messages.filter(m => m.role === "user").pop();
    const { intent } = lastUserMsg ? classifyIntent(lastUserMsg.content) : { intent: "general" as Intent };

    // Build context info
    let contextInfo = "";
    if (context) {
      const parts: string[] = [];
      if (context.neuron_count !== undefined) parts.push(`Neurons: ${context.neuron_count}`);
      if (context.episode_count !== undefined) parts.push(`Episodes: ${context.episode_count}`);
      if (context.credit_balance !== undefined) parts.push(`Credits: ${context.credit_balance} NEURONS`);
      if (parts.length > 0) contextInfo = `\n\n## User's Current State\n${parts.join(" | ")}`;
    }

    const intentHint = intent !== "general"
      ? `\n\n## Detected Intent: ${intent.toUpperCase()}\nThe user's message was classified as "${intent}". Prioritize using the appropriate tools for this intent.`
      : "";

    const apiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + contextInfo + intentHint },
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
        stream: false,
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
      apiMessages.push(choice.message);

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

      // Second call with streaming
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
