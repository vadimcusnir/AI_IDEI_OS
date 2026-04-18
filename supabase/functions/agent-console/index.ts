import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

// ── Types ──
type Intent = "analyze_video" | "extract_knowledge" | "generate_content" | "search_knowledge" |
  "run_service" | "compare_sources" | "profile_analysis" | "build_course" |
  "batch_process" | "check_status" | "manage_workspace" | "topic_explore" | "help" | "general";

interface PlanStep {
  tool: string;
  label: string;
  credits: number;
}

// ── Intent Classification (hybrid: keyword + LLM) ──
function classifyIntentKeyword(text: string): { intent: Intent; confidence: number; params: Record<string, string> } {
  const lower = text.toLowerCase().trim();

  // Slash commands — high confidence
  const slashMap: Record<string, Intent> = {
    "/analyze": "analyze_video", "/extract": "extract_knowledge", "/generate": "generate_content",
    "/search": "search_knowledge", "/summarize": "generate_content", "/compare": "compare_sources",
    "/services": "run_service", "/profile": "profile_analysis", "/course": "build_course",
    "/topics": "topic_explore", "/help": "help", "/status": "check_status",
  };
  for (const [cmd, intent] of Object.entries(slashMap)) {
    if (lower.startsWith(cmd)) return { intent, confidence: 0.95, params: { input: text.slice(cmd.length).trim() } };
  }

  const urlPattern = /(https?:\/\/[^\s]+)/;
  const hasUrl = urlPattern.test(text);

  // Keyword scoring per intent
  const intentKeywords: Record<Intent, string[]> = {
    analyze_video: ["youtube", "video", "url", "analyze", "process", "watch", "link", "analizez"],
    extract_knowledge: ["extract", "extrage", "neuron", "knowledge", "insight", "framework", "pattern"],
    generate_content: ["genereaz", "generate", "scrie", "write", "article", "blog", "linkedin", "tweet", "creeaz"],
    search_knowledge: ["search", "caut", "find", "show", "list", "browse", "găsește", "arată"],
    run_service: ["run", "execute", "service", "pipeline", "avatar33", "webinar", "agent", "swarm", "narrative domination", "viral structure", "influence graph", "offer multiplication", "pricing intelligence", "funnel autogenerator", "stepback", "knowledge arbitrage", "reputation", "behavioral leverage", "identity simulation", "os agent", "rulează agent"],
    compare_sources: ["compare", "compar", "cross-ref", "versus", "diferenț"],
    profile_analysis: ["profil", "speaker", "guest", "who", "person", "expert"],
    build_course: ["course", "curs", "curriculum", "module", "lesson", "lecți"],
    batch_process: ["batch", "bulk", "multiple", "all episodes", "toate"],
    check_status: ["status", "balance", "credit", "job", "progress", "câte", "how many", "balanț"],
    manage_workspace: ["workspace", "settings", "team", "member", "invite"],
    topic_explore: ["topic", "discover", "explore", "trending", "popular"],
    help: ["help", "ajutor", "cum", "how", "what is", "explain", "ghid"],
    general: [],
  };

  let bestIntent: Intent = "general";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (intent === "general") continue;
    const matches = keywords.filter(k => lower.includes(k)).length;
    const score = matches / Math.max(keywords.length, 1);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as Intent;
    }
  }

  if (hasUrl && bestIntent === "general") {
    return { intent: "analyze_video", confidence: 0.8, params: { url: text.match(urlPattern)?.[1] || "", input: text } };
  }

  return {
    intent: bestScore > 0.15 ? bestIntent : "general",
    confidence: Math.min(bestScore * 3, 0.95),
    params: { input: text },
  };
}

// ── LLM Intent Classifier ──
async function classifyIntentLLM(
  text: string, apiKey: string
): Promise<{ intent: Intent; confidence: number }> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `Classify user intent. Return ONLY a JSON: {"intent":"<key>","confidence":<0-1>}
Valid intents: analyze_video, extract_knowledge, generate_content, search_knowledge, run_service, compare_sources, profile_analysis, build_course, batch_process, check_status, manage_workspace, topic_explore, help, general` },
          { role: "user", content: text },
        ],
        temperature: 0,
      }),
    });
    if (!resp.ok) return { intent: "general", confidence: 0 };
    const r = await resp.json();
    const content = r.choices?.[0]?.message?.content || "";
    const match = content.match(/\{[^}]+\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { intent: parsed.intent || "general", confidence: parsed.confidence || 0.5 };
    }
  } catch { /* fall through */ }
  return { intent: "general", confidence: 0 };
}

// ── Hybrid Intent Classification ──
async function classifyIntentHybrid(text: string, apiKey: string): Promise<{ intent: Intent; confidence: number; params: Record<string, string> }> {
  const keyword = classifyIntentKeyword(text);
  
  // High-confidence keyword match — skip LLM
  if (keyword.confidence >= 0.8) return keyword;
  
  // Low confidence — use LLM
  const llm = await classifyIntentLLM(text, apiKey);
  
  // Use LLM if higher confidence
  if (llm.confidence > keyword.confidence) {
    return { intent: llm.intent, confidence: llm.confidence, params: keyword.params };
  }
  return keyword;
}

// ── Plan Generator ──
async function generatePlan(
  intent: Intent, confidence: number, userText: string,
  supabaseAdmin: any
): Promise<{ plan: PlanStep[]; totalCredits: number; planTemplateId: string | null; planName: string }> {
  // Fetch best plan template for this intent
  const { data: templates } = await supabaseAdmin
    .from("agent_plan_templates")
    .select("*")
    .eq("intent_key", intent)
    .order("is_default", { ascending: false })
    .order("success_count", { ascending: false });

  if (templates && templates.length > 0) {
    // Pick the one with best success rate, or default
    const best = templates[0];
    const steps = (best.steps as PlanStep[]) || [];
    const totalCredits = steps.reduce((s: number, st: PlanStep) => s + (st.credits || 0), 0);
    return {
      plan: steps,
      totalCredits,
      planTemplateId: best.id,
      planName: best.name,
    };
  }

  // Fallback: single-step general conversation
  return {
    plan: [{ tool: "conversation", label: "AI Conversation", credits: 0 }],
    totalCredits: 0,
    planTemplateId: null,
    planName: "General Conversation",
  };
}

const SYSTEM_PROMPT = `You are the AI-IDEI Agent — a Knowledge Operating System orchestrator.

You transform raw content into structured knowledge assets via a multi-step pipeline.

## Your Capabilities
1. **Analyze Sources**: Process URLs (YouTube, web), audio, video, PDF through full pipeline
2. **Extract Neurons**: Pull insights, frameworks, patterns from transcripts
3. **Generate Assets**: Create articles, frameworks, courses from neurons
4. **Search Knowledge**: Query the knowledge graph
5. **Create Jobs**: Schedule AI service executions
6. **Profile Analysis**: Analyze speaker profiles
7. **Run OS Agents**: Execute specialized Cusnir_OS agents for strategic intelligence:
   - Identity Simulation Engine (behavioral predictions, psychological triggers)
   - Behavioral Leverage Scanner (leverage points, optimization maps)
   - Narrative Domination Engine (dominant narratives, positioning)
   - Influence Graph Engine (influencer mapping, alliances)
   - Viral Structure Generator (viral content, distribution)
   - Offer Multiplication Engine (offer variants, bundles)
   - Pricing Intelligence System (optimal pricing, sensitivity)
   - Funnel Autogenerator (landing pages, email sequences)
   - Stepback Compiler (system libraries, playbooks)
   - Agent Swarm Orchestrator (task decomposition, agent assignments)
   - Knowledge Arbitrage Engine (knowledge gaps, monetization)
   - Reputation Accumulation System (reputation scoring, trust)

## Pipeline: SOURCE → TRANSCRIBE → SEGMENT → EXTRACT → LINK → GENERATE

## Available Tools
- **search_neurons**: Search knowledge base by keyword
- **list_recent_neurons**: Show recently created neurons
- **list_episodes**: Show episodes/transcriptions
- **get_credit_balance**: Check credit balance
- **list_services**: Show AI services and costs
- **create_job**: Create job for AI service execution
- **search_guests**: Search guest profiles
- **get_user_memory**: Get user context and preferences
- **list_os_agents**: List Cusnir_OS agents with their status
- **run_os_agent**: Execute an OS agent with a specific prompt

## Rules
- Use tools for real actions, don't guess data
- Be concise and action-oriented
- Respond in the user's language (Romanian or English)
- When creating jobs, confirm cost first
- When user mentions agent names or asks for strategic analysis, use run_os_agent
- Format agent outputs as structured sections with headers
- Format responses with markdown`;

const TOOLS = [
  { type: "function", function: { name: "search_neurons", description: "Search user's knowledge neurons by keyword or topic", parameters: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } }, required: ["query"] } } },
  { type: "function", function: { name: "list_recent_neurons", description: "List recently created neurons", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_episodes", description: "List user's episodes/transcriptions", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "get_credit_balance", description: "Get NEURONS credit balance", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_services", description: "List AI services with costs", parameters: { type: "object", properties: { category: { type: "string" } } } } },
  { type: "function", function: { name: "create_job", description: "Create a job to execute an AI service", parameters: { type: "object", properties: { service_key: { type: "string" }, neuron_id: { type: "number" }, episode_id: { type: "string" }, params: { type: "object" } }, required: ["service_key"] } } },
  { type: "function", function: { name: "search_guests", description: "Search guest profiles", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "get_user_memory", description: "Get persistent user context", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_os_agents", description: "List available Cusnir_OS agents with their roles and status", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "run_os_agent", description: "Execute a Cusnir_OS agent (e.g. Narrative Domination Engine, Viral Structure Generator) with a prompt. Returns structured intelligence.", parameters: { type: "object", properties: { agent_role: { type: "string", description: "The role/name of the OS agent to run (e.g. 'Narrative Domination Engine')" }, prompt: { type: "string", description: "The input prompt or context for the agent" } }, required: ["agent_role", "prompt"] } } },
];


const InputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string().max(150_000) })).min(1).max(50),
  context: z.object({
    neuron_count: z.number().optional(),
    episode_count: z.number().optional(),
    credit_balance: z.number().optional(),
    top_categories: z.record(z.number()).optional(),
    recent_services: z.record(z.number()).optional(),
    total_completed_jobs: z.number().optional(),
    knowledge_summary: z.string().optional(),
  }).optional(),
});

async function executeTool(name: string, args: Record<string, any>, userId: string, workspaceId: string | null, supabaseAdmin: any): Promise<string> {
  switch (name) {
    case "search_neurons": {
      const limit = args.limit || 10;
      const { data } = await supabaseAdmin.from("neurons").select("id, title, tags, status, created_at, score, content_category").eq("author_id", userId).ilike("title", `%${args.query}%`).order("created_at", { ascending: false }).limit(limit);
      if (!data || data.length === 0) {
        const { data: tagData } = await supabaseAdmin.from("neurons").select("id, title, tags, status, created_at, score").eq("author_id", userId).contains("tags", [args.query.toLowerCase()]).order("created_at", { ascending: false }).limit(limit);
        return JSON.stringify({ results: tagData || [], count: tagData?.length || 0 });
      }
      return JSON.stringify({ results: data, count: data.length });
    }
    case "list_recent_neurons": {
      const { data } = await supabaseAdmin.from("neurons").select("id, title, tags, status, created_at, score, content_category").eq("author_id", userId).order("created_at", { ascending: false }).limit(args.limit || 10);
      return JSON.stringify({ results: data || [], count: data?.length || 0 });
    }
    case "list_episodes": {
      const { data } = await supabaseAdmin.from("episodes").select("id, title, source_type, status, duration_seconds, created_at").eq("author_id", userId).order("created_at", { ascending: false }).limit(args.limit || 10);
      return JSON.stringify({ results: data || [], count: data?.length || 0 });
    }
    case "get_credit_balance": {
      const { data } = await supabaseAdmin.from("user_credits").select("balance, total_earned, total_spent, daily_spent, daily_spend_cap").eq("user_id", userId).maybeSingle();
      return JSON.stringify(data || { balance: 0, total_earned: 0, total_spent: 0 });
    }
    case "list_services": {
      let q = supabaseAdmin.from("service_catalog").select("service_key, name, credits_cost, category, description, service_class").eq("is_active", true).order("credits_cost");
      if (args.category) q = q.eq("category", args.category);
      const { data } = await q;
      return JSON.stringify({ services: data || [], count: data?.length || 0 });
    }
    case "create_job": {
      const { data: svc } = await supabaseAdmin.from("service_catalog").select("id, service_key, name, credits_cost").eq("service_key", args.service_key).eq("is_active", true).maybeSingle();
      if (!svc) return JSON.stringify({ error: `Service '${args.service_key}' not found` });
      const { data: credits } = await supabaseAdmin.from("user_credits").select("balance").eq("user_id", userId).maybeSingle();
      if (!credits || credits.balance < svc.credits_cost) return JSON.stringify({ error: "INSUFFICIENT_CREDITS", required: svc.credits_cost, available: credits?.balance || 0 });
      const jobPayload: any = { author_id: userId, worker_type: args.service_key, status: "pending", params: args.params || {}, workspace_id: workspaceId };
      if (args.neuron_id) jobPayload.neuron_id = args.neuron_id;
      const { data: job, error: jobErr } = await supabaseAdmin.from("neuron_jobs").insert(jobPayload).select("id, worker_type, status").single();
      if (jobErr) return JSON.stringify({ error: `Job creation failed: ${jobErr.message}` });
      await supabaseAdmin.rpc("reserve_credits", { _user_id: userId, _amount: svc.credits_cost, _job_id: job.id });
      return JSON.stringify({ success: true, job_id: job.id, service: svc.name, credits_reserved: svc.credits_cost, status: "pending" });
    }
    case "search_guests": {
      const { data } = await supabaseAdmin.from("guest_profiles").select("id, full_name, role, slug, expertise_areas, is_public").eq("author_id", userId).or(`full_name.ilike.%${args.query}%,role.ilike.%${args.query}%`).limit(10);
      return JSON.stringify({ results: data || [], count: data?.length || 0 });
    }
    case "get_user_memory": {
      const [recentJobs, recentNeurons] = await Promise.all([
        supabaseAdmin.from("neuron_jobs").select("worker_type, status, created_at").eq("author_id", userId).order("created_at", { ascending: false }).limit(5),
        supabaseAdmin.from("neurons").select("content_category, tags").eq("author_id", userId).order("created_at", { ascending: false }).limit(20),
      ]);
      const serviceCounts: Record<string, number> = {};
      (recentJobs.data || []).forEach((j: any) => { serviceCounts[j.worker_type] = (serviceCounts[j.worker_type] || 0) + 1; });
      const tagCounts: Record<string, number> = {};
      (recentNeurons.data || []).forEach((n: any) => { (n.tags || []).forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }); });
      const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag);
      // Task memory: success rates by intent
      const { data: history } = await supabaseAdmin.from("agent_action_history").select("intent_key, success").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      const intentStats: Record<string, { total: number; success: number }> = {};
      (history || []).forEach((h: any) => {
        if (!intentStats[h.intent_key]) intentStats[h.intent_key] = { total: 0, success: 0 };
        intentStats[h.intent_key].total++;
        if (h.success) intentStats[h.intent_key].success++;
      });
      return JSON.stringify({ frequent_services: Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5), top_tags: topTags, intent_history: intentStats });
    }
    case "list_os_agents": {
      const { data } = await supabaseAdmin.from("os_agents").select("id, role, agent_type, status, capabilities, performance_score").order("role");
      return JSON.stringify({ agents: data || [], count: data?.length || 0 });
    }
    case "run_os_agent": {
      // Find agent by role
      const { data: agents } = await supabaseAdmin.from("os_agents").select("id, role, agent_type, status, capabilities, metadata").ilike("role", `%${args.agent_role}%`).limit(1);
      if (!agents || agents.length === 0) return JSON.stringify({ error: `Agent '${args.agent_role}' not found. Use list_os_agents to see available agents.` });
      const agent = agents[0];
      if (agent.status !== "active") return JSON.stringify({ error: `Agent '${agent.role}' is in ${agent.status} mode. Activate it via Power Unlocks first.` });

      // Check credits
      const costMap: Record<string, number> = { cognitive: 15, social: 12, commercial: 18, infrastructure: 20 };
      const cost = costMap[agent.agent_type] || 10;
      const { data: creditData } = await supabaseAdmin.from("user_credits").select("balance").eq("user_id", userId).maybeSingle();
      if (!creditData || creditData.balance < cost) return JSON.stringify({ error: "INSUFFICIENT_CREDITS", required: cost, available: creditData?.balance || 0 });

      // Reserve credits and create execution
      const { data: execResult } = await supabaseAdmin.rpc("start_agent_execution", {
        _user_id: userId, _agent_id: agent.id,
        _input: { prompt: args.prompt },
        _estimated_credits: cost,
      });
      if (!execResult?.success) return JSON.stringify({ error: execResult?.error || "Failed to start execution" });

      // Call execute-os-agent edge function
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      try {
        const agentResp = await fetch(`${supabaseUrl}/functions/v1/execute-os-agent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: JSON.stringify({ agent_id: agent.id, user_id: userId, input: { prompt: args.prompt }, execution_id: execResult.execution_id }),
        });
        const agentData = await agentResp.json();
        return JSON.stringify({
          success: true, agent: agent.role, agent_type: agent.agent_type,
          credits_spent: cost, execution_id: execResult.execution_id,
          output: agentData.output || agentData.error || "No output",
        });
      } catch (e) {
        return JSON.stringify({ success: false, error: `Agent execution failed: ${e instanceof Error ? e.message : "unknown"}` });
      }
    }
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

    // DB-backed rate limiting (60 req/hour)
    const rateLimited = await rateLimitGuard(
      `${user.id}:agent-console`,
      req,
      { maxRequests: 60, windowSeconds: 3600 },
      getCorsHeaders(req)
    );
    if (rateLimited) return rateLimited;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const { messages, context } = parsed.data;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: wsMember } = await supabaseAdmin.from("workspace_members").select("workspace_id").eq("user_id", user.id).order("joined_at").limit(1).maybeSingle();
    const workspaceId = wsMember?.workspace_id || null;

    // ── Hybrid Intent Classification ──
    const lastUserMsg = messages.filter(m => m.role === "user").pop();
    const userText = lastUserMsg?.content || "";
    const { intent, confidence } = await classifyIntentHybrid(userText, LOVABLE_API_KEY);

    // ── Generate Execution Plan ──
    const { plan, totalCredits, planTemplateId, planName } = await generatePlan(intent, confidence, userText, supabaseAdmin);

    // ── Create Agent Action for tracking ──
    let actionId: string | null = null;
    if (intent !== "general" && intent !== "help" && intent !== "check_status") {
      const { data: action } = await supabaseAdmin.from("agent_actions").insert({
        user_id: user.id,
        session_id: "",
        intent_key: intent,
        intent_confidence: confidence,
        plan_template_id: planTemplateId,
        status: plan.length > 1 ? "planning" : "running",
        total_credits_estimated: totalCredits,
        input_summary: userText.slice(0, 500),
        workspace_id: workspaceId,
      }).select("id").single();
      actionId = action?.id || null;

      // Create steps
      if (actionId && plan.length > 0) {
        const steps = plan.map((s, i) => ({
          action_id: actionId!,
          step_order: i,
          tool_name: s.tool,
          label: s.label,
          credits_cost: s.credits,
          status: "pending",
        }));
        await supabaseAdmin.from("agent_steps").insert(steps);
      }
    }

    // Build context info for system prompt
    let contextInfo = "";
    if (context) {
      const parts: string[] = [];
      if (context.neuron_count !== undefined) parts.push(`Neurons: ${context.neuron_count}`);
      if (context.episode_count !== undefined) parts.push(`Episodes: ${context.episode_count}`);
      if (context.credit_balance !== undefined) parts.push(`Credits: ${context.credit_balance} NEURONS`);
      if (context.knowledge_summary) parts.push(`Knowledge: ${context.knowledge_summary}`);
      if (parts.length > 0) contextInfo = `\n\n## User State\n${parts.join(" | ")}`;
    }

    const intentHint = intent !== "general"
      ? `\n\n## Intent: ${intent.toUpperCase()} (confidence: ${(confidence * 100).toFixed(0)}%)\nPlan: "${planName}" with ${plan.length} steps, ~${totalCredits} NEURONS total cost.${actionId ? `\nAction ID: ${actionId}` : ""}\nSteps: ${plan.map((s, i) => `${i + 1}. ${s.label} (${s.credits} credits)`).join(", ")}`
      : "";

    const truncate = (s: string, max = 100_000) => s.length > max ? s.slice(0, max) + "\n\n[...truncated]" : s;
    const apiMessages: any[] = [
      { role: "system", content: truncate(SYSTEM_PROMPT + contextInfo + intentHint, 80_000) },
      ...messages.slice(-30).map(m => ({ ...m, content: truncate(m.content) })),
    ];

    // First call — may trigger tool use
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: apiMessages, tools: TOOLS, stream: false }),
    });

    if (!firstResponse.ok) {
      const status = firstResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      console.error("AI gateway error:", status, await firstResponse.text());
      return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const firstResult = await firstResponse.json();
    const choice = firstResult.choices?.[0];

    // If model wants tools
    if (choice?.finish_reason === "tool_calls" || choice?.message?.tool_calls?.length > 0) {
      // ─── F-008: cap tool execution to prevent unbounded drain ───
      const MAX_TOOL_CALLS_PER_REQUEST = 8;
      const toolCallsRaw = choice.message.tool_calls || [];
      if (toolCallsRaw.length > MAX_TOOL_CALLS_PER_REQUEST) {
        console.warn(`[agent] F-008 cap: model requested ${toolCallsRaw.length} tools, capped to ${MAX_TOOL_CALLS_PER_REQUEST}`);
      }
      const toolCalls = toolCallsRaw.slice(0, MAX_TOOL_CALLS_PER_REQUEST);
      apiMessages.push(choice.message);

      for (const tc of toolCalls) {
        const args = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        console.log(`[agent] Tool: ${tc.function.name}`, args);

        // Update step status if tracking
        if (actionId) {
          await supabaseAdmin.from("agent_steps").update({ status: "running", started_at: new Date().toISOString() })
            .eq("action_id", actionId).eq("tool_name", tc.function.name).eq("status", "pending").limit(1);
        }

        const result = await executeTool(tc.function.name, args, user.id, workspaceId, supabaseAdmin);

        // Mark step complete
        if (actionId) {
          await supabaseAdmin.from("agent_steps").update({ status: "completed", completed_at: new Date().toISOString(), output_data: JSON.parse(result) })
            .eq("action_id", actionId).eq("tool_name", tc.function.name).eq("status", "running").limit(1);
        }

        apiMessages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }

      // Mark action running/completed
      if (actionId) {
        await supabaseAdmin.from("agent_actions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", actionId);
        // Log to action history
        await supabaseAdmin.from("agent_action_history").insert({
          user_id: user.id, intent_key: intent, plan_template_id: planTemplateId,
          success: true, total_steps: plan.length, completed_steps: toolCalls.length,
          total_credits: totalCredits,
        });
      }

      // Stream final response
      const secondResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: apiMessages, stream: true }),
      });

      if (!secondResponse.ok) {
        console.error("Second AI call error:", await secondResponse.text());
        return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      }

      // Prepend action metadata as SSE
      const metaEvent = `data: ${JSON.stringify({ choices: [{ delta: { content: "" }, index: 0 }], agent_meta: { action_id: actionId, intent, confidence, plan_name: planName, total_credits: totalCredits, steps: plan } })}\n\n`;
      const metaStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(metaEvent));
          const reader = secondResponse.body!.getReader();
          function pump(): Promise<void> {
            return reader.read().then(({ done, value }) => {
              if (done) { controller.close(); return; }
              controller.enqueue(value);
              return pump();
            });
          }
          pump();
        },
      });

      return new Response(metaStream, { headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream" } });
    }

    // No tool calls — mark action completed
    if (actionId) {
      await supabaseAdmin.from("agent_actions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", actionId);
      await supabaseAdmin.from("agent_action_history").insert({
        user_id: user.id, intent_key: intent, plan_template_id: planTemplateId,
        success: true, total_steps: 1, completed_steps: 1, total_credits: 0,
      });
    }

    // Stream directly
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: apiMessages, stream: true }),
    });

    if (!streamResponse.ok) {
      return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    return new Response(streamResponse.body, { headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("agent-console error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
