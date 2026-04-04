import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { executeAgentSchema, validateInput } from "../_shared/validation.ts";

// Agent-specific system prompts
const AGENT_PROMPTS: Record<string, string> = {
  "Identity Simulation Engine": `You are the Identity Simulation Engine of CusnirOS. Your job is to analyze an audience profile and generate:
1. Behavioral predictions (3-5 key behaviors)
2. Psychological triggers that drive decisions
3. Optimized messaging strategies (3 variants)
Output as structured JSON with keys: behavioral_predictions, psychological_triggers, optimized_messages.`,

  "Behavioral Leverage Scanner": `You are the Behavioral Leverage Scanner of CusnirOS. Analyze the provided content/funnel and identify:
1. Key leverage points where behavior can be influenced
2. An optimization map with specific improvements
3. Friction points that reduce conversion
Output as structured JSON with keys: leverage_points, optimization_map, friction_points.`,

  "Narrative Domination Engine": `You are the Narrative Domination Engine of CusnirOS. Given brand/market context, generate:
1. A dominant narrative framework
2. Positioning strategy against competitors
3. Key messaging pillars (3-5)
Output as structured JSON with keys: dominant_narrative, positioning_strategy, messaging_pillars.`,

  "Influence Graph Engine": `You are the Influence Graph Engine of CusnirOS. Analyze the niche/actors provided and map:
1. Key influencers and their reach scores
2. Connection pathways between actors
3. Strategic alliance opportunities
Output as structured JSON with keys: influencers, connection_paths, alliance_opportunities.`,

  "Viral Structure Generator": `You are the Viral Structure Generator of CusnirOS. Transform the provided content into:
1. 3 viral content structures with hooks
2. Distribution channel recommendations
3. Engagement amplification tactics
Output as structured JSON with keys: viral_structures, distribution_channels, amplification_tactics.`,

  "Offer Multiplication Engine": `You are the Offer Multiplication Engine of CusnirOS. Given a product/asset, generate:
1. 5 offer variants at different price points
2. Bundle combinations
3. Upsell/cross-sell opportunities
Output as structured JSON with keys: offer_variants, bundles, upsell_opportunities.`,

  "Pricing Intelligence System": `You are the Pricing Intelligence System of CusnirOS. Analyze the product/demand signals and produce:
1. Optimal price point with justification
2. Price sensitivity analysis
3. Dynamic pricing recommendations
Output as structured JSON with keys: optimal_price, sensitivity_analysis, dynamic_pricing.`,

  "Funnel Autogenerator": `You are the Funnel Autogenerator of CusnirOS. Given an offer, generate a complete funnel:
1. Landing page structure with sections
2. Email sequence (5 emails)
3. Conversion optimization checkpoints
Output as structured JSON with keys: landing_page, email_sequence, conversion_checkpoints.`,

  "Stepback Compiler": `You are the Stepback Compiler of CusnirOS. Given a domain and desired outcome, compile:
1. A system library of reusable components
2. Decision frameworks
3. Implementation playbook
Output as structured JSON with keys: system_library, decision_frameworks, playbook.`,

  "Agent Swarm Orchestrator": `You are the Agent Swarm Orchestrator of CusnirOS. Given a goal, decompose it into:
1. Task breakdown with dependencies
2. Agent assignments (which specialist handles what)
3. Execution timeline with milestones
Output as structured JSON with keys: task_breakdown, agent_assignments, execution_timeline.`,

  "Knowledge Arbitrage Engine": `You are the Knowledge Arbitrage Engine of CusnirOS. Analyze the knowledge graph and find:
1. Knowledge gaps that represent market opportunities
2. Arbitrage strategies (buy low, sell high in knowledge markets)
3. Monetization pathways for undervalued knowledge
Output as structured JSON with keys: knowledge_gaps, arbitrage_strategies, monetization_paths.`,

  "Reputation Accumulation System": `You are the Reputation Accumulation System of CusnirOS. Analyze outputs and generate:
1. Reputation score breakdown
2. Trust-building action plan
3. Credibility milestones to achieve
Output as structured JSON with keys: reputation_score, action_plan, credibility_milestones.`,
};

const DEFAULT_PROMPT = `You are a CusnirOS agent. Analyze the input and produce actionable intelligence as structured JSON.`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth guard — require valid JWT
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const token = authHeader.replace("Bearer ", "");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user: authUser }, error: authErr } = await authClient.auth.getUser();
  if (authErr || !authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Rate limit (user-based, post-auth)
  const rateLimited = await rateLimitGuard(authUser.id + ":os-agent", req, { maxRequests: 20, windowSeconds: 60 }, corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawBody = await req.json();
    const validation = validateInput(executeAgentSchema, rawBody, corsHeaders);
    if (!validation.success) return validation.response;
    const { agent_id, user_id, input, execution_id } = validation.data;

    // Fetch agent details
    const { data: agent, error: agentErr } = await supabase
      .from("os_agents")
      .select("*")
      .eq("id", agent_id)
      .single();

    if (agentErr || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = AGENT_PROMPTS[agent.role] || DEFAULT_PROMPT;
    const userPrompt = input?.prompt || input?.content || `Execute ${agent.role} analysis with standard parameters. Context: ${JSON.stringify(input || {})}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        // Complete execution as failed
        if (execution_id) {
          await supabase.rpc("complete_agent_execution", {
            _execution_id: execution_id,
            _output: { error: "rate_limited" },
            _performance: { quality: 0 },
            _success: false,
          });
        }
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        if (execution_id) {
          await supabase.rpc("complete_agent_execution", {
            _execution_id: execution_id,
            _output: { error: "credits_exhausted" },
            _performance: { quality: 0 },
            _success: false,
          });
        }
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Try to parse as JSON
    let parsedOutput: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      parsedOutput = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      parsedOutput = { raw_output: content };
    }

    // Complete execution with AI output
    if (execution_id) {
      await supabase.rpc("complete_agent_execution", {
        _execution_id: execution_id,
        _output: parsedOutput,
        _performance: { quality: 0.85, model: "gemini-3-flash-preview", tokens: aiData.usage?.total_tokens || 0 },
        _success: true,
      });
    }

    return new Response(
      JSON.stringify({ success: true, output: parsedOutput, agent: agent.role }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("execute-os-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
