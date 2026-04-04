import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * Market Research Engine — Class C Orchestrated Pipeline
 * Runs 8 sequential research sections with DAG dependencies.
 * Total cost: ~3500 credits
 */

interface ResearchSection {
  id: string;
  name: string;
  prompt: string;
  depends_on: string[];
  cost: number;
}

const SECTIONS: ResearchSection[] = [
  {
    id: "market_overview", name: "Market Overview & Sizing",
    depends_on: [], cost: 400,
    prompt: `You are a market research analyst. Based on the provided industry context, produce:
## Market Overview
- Market definition and scope
- Total Addressable Market (TAM) estimate with methodology
- Serviceable Addressable Market (SAM)  
- Serviceable Obtainable Market (SOM)
- Growth rate (CAGR) and trajectory
- Market maturity stage (emerging/growth/mature/declining)
- Key market drivers (5-8)
- Key market restraints (3-5)
Use data-driven analysis. Cite reasoning for all estimates.`,
  },
  {
    id: "competitive_landscape", name: "Competitive Landscape",
    depends_on: ["market_overview"], cost: 450,
    prompt: `You are a competitive intelligence analyst. Based on the market context, produce:
## Competitive Landscape
- Direct competitors (5-8): positioning, strengths, weaknesses, pricing, market share estimate
- Indirect competitors (3-5)
- Substitute products/services
- Barriers to entry analysis
- Competitive advantage sources
- Porter's Five Forces analysis
- Strategic group mapping
- White space opportunities (unserved segments)
Use tables for comparisons.`,
  },
  {
    id: "consumer_psychology", name: "Consumer Psychology Deep Dive",
    depends_on: ["market_overview"], cost: 500,
    prompt: `You are a consumer psychologist. Analyze:
## Consumer Psychology
- Buyer personas (3 detailed profiles with demographics, psychographics, behaviors)
- Jobs-to-be-Done analysis (functional, emotional, social jobs)
- Purchase decision journey mapping (awareness → consideration → decision → retention)
- Psychological triggers that drive purchase (top 10 ranked)
- Objections and fear barriers
- Trust-building requirements per segment
- Emotional vs rational decision split
- Price sensitivity analysis per persona`,
  },
  {
    id: "pricing_architecture", name: "Pricing Strategy & Architecture",
    depends_on: ["competitive_landscape", "consumer_psychology"], cost: 400,
    prompt: `You are a pricing strategist. Design:
## Pricing Architecture
- Value metric analysis (what customers pay for)
- Pricing model recommendation (subscription/usage/tiered/freemium) with rationale
- Tier structure (3-4 tiers with features and prices)
- Price points following Root2 principle (digit sum = 2)
- Anchor pricing strategy
- Penetration vs skimming analysis
- Discount and promotion framework
- Revenue projections (3 scenarios: conservative, base, optimistic)
All prices must have digital root = 2.`,
  },
  {
    id: "channel_strategy", name: "Distribution & Channel Strategy",
    depends_on: ["consumer_psychology"], cost: 350,
    prompt: `You are a distribution strategist. Analyze:
## Channel Strategy
- Channel identification (digital, physical, hybrid)
- Channel economics (CAC, conversion rate, LTV per channel)
- Channel priority matrix (effort vs impact)
- Partnership/affiliate opportunities
- Content distribution plan
- Paid acquisition strategy
- Organic growth levers
- Multi-channel integration plan
Rank channels by ROI potential.`,
  },
  {
    id: "risk_analysis", name: "Risk & Opportunity Analysis",
    depends_on: ["market_overview", "competitive_landscape"], cost: 350,
    prompt: `You are a strategic risk analyst. Produce:
## Risk & Opportunity Matrix
- SWOT analysis (detailed, 5+ items per quadrant)
- PESTEL analysis (Political, Economic, Social, Technological, Environmental, Legal)
- Risk register (top 15 risks: probability, impact, mitigation)
- Opportunity register (top 10: potential, effort, timeline)
- Scenario planning (best case, base case, worst case)
- Early warning indicators (5-8 signals to monitor)
- Contingency triggers and responses`,
  },
  {
    id: "go_to_market", name: "Go-to-Market Blueprint",
    depends_on: ["pricing_architecture", "channel_strategy"], cost: 500,
    prompt: `You are a GTM strategist. Create:
## Go-to-Market Blueprint
- Positioning statement (For/Who/Is/That/Unlike format)
- Key messages (primary + 3 supporting)
- Launch phases (pre-launch, soft launch, scale)
- 90-day execution timeline with milestones
- Content strategy (topics, formats, frequency)
- Sales enablement materials list
- Partnership activation plan
- Budget allocation framework (% per category)
Make everything specific and time-bound.`,
  },
  {
    id: "synthesis", name: "Executive Synthesis & Action Plan",
    depends_on: ["go_to_market", "risk_analysis"], cost: 550,
    prompt: `You are a strategic consultant synthesizing all research into executive-level recommendations. Using all previous sections:
## Executive Synthesis
- Executive Summary (300 words)
- Top 5 Strategic Insights (non-obvious findings)
- Recommended Strategy (one-paragraph thesis)
- Priority Action Plan (next 30/60/90 days)
- Resource requirements (team, budget, tools)
- Success metrics and KPIs (10 key metrics)
- Kill criteria (when to pivot or stop)
- Bibliography and data sources
- Confidence assessment per recommendation (high/medium/low)
Be direct, actionable, and honest about uncertainty.`,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    // Rate limit (user-based, post-auth)
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 5, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    if (req.method === "GET") {
      return new Response(JSON.stringify({
        sections: SECTIONS.map(s => ({ id: s.id, name: s.name, depends_on: s.depends_on, cost: s.cost })),
        total_cost: SECTIONS.reduce((s, sec) => s + sec.cost, 0),
      }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const { industry, country, market_phase, context, job_id } = await req.json();

    if (!industry || industry.length < 3) {
      return new Response(JSON.stringify({ error: "Industry is required (min 3 chars)" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const totalCost = SECTIONS.reduce((s, sec) => s + sec.cost, 0);

    // RESERVE neurons (atomic wallet)
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: totalCost,
      _description: `RESERVE: Market Research: ${industry}`,
    });

    if (reserveErr || !reserved) {
      return new Response(JSON.stringify({ error: "Insufficient credits", needed: totalCost }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let settled = false;

    const userContext = `Industry: ${industry}\nCountry/Region: ${country || "Global"}\nMarket Phase: ${market_phase || "Growth"}\n${context ? `Additional Context:\n${context}` : ""}`;

    // Execute sections in dependency order
    const sectionOutputs: Record<string, string> = {};
    const completed: Set<string> = new Set();

    // Topological execution
    const remaining = [...SECTIONS];
    while (remaining.length > 0) {
      const ready = remaining.filter(s => s.depends_on.every(d => completed.has(d)));
      if (ready.length === 0) break; // safety

      // Run ready sections in parallel
      const results = await Promise.all(ready.map(async (section) => {
        const depContext = section.depends_on
          .filter(d => sectionOutputs[d])
          .map(d => `[${d} Output]\n${sectionOutputs[d]?.slice(0, 6000)}`)
          .join("\n\n");

        try {
          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: section.prompt },
                { role: "user", content: `${userContext}\n\n${depContext ? `Previous Research:\n${depContext}` : ""}` },
              ],
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            return { id: section.id, output: data.choices?.[0]?.message?.content || "" };
          }
          return { id: section.id, output: `Error: ${resp.status}` };
        } catch (e) {
          return { id: section.id, output: `Error: ${e.message}` };
        }
      }));

      for (const r of results) {
        sectionOutputs[r.id] = r.output;
        completed.add(r.id);
        remaining.splice(remaining.findIndex(s => s.id === r.id), 1);
      }

      // Update job progress
      if (job_id) {
        await supabase.from("neuron_jobs").update({
          result: { completed: completed.size, total: SECTIONS.length, current: ready.map(r => r.name).join(", ") },
        }).eq("id", job_id);
      }
    }

    // Build final report
    const fullContent = SECTIONS
      .map(s => `# ${s.name}\n\n${sectionOutputs[s.id] || "Not completed"}`)
      .join("\n\n---\n\n");

    // Save artifact
    await supabase.from("artifacts").insert({
      author_id: user.id,
      title: `Market Research: ${industry} — ${new Date().toLocaleDateString("ro-RO")}`,
      artifact_type: "report",
      content: fullContent.slice(0, 200_000),
      format: "markdown",
      status: "generated",
      service_key: "market-research-engine",
      job_id: job_id || null,
      tags: ["market-research", "pipeline", industry.toLowerCase()],
      metadata: { industry, country, market_phase, sections_completed: completed.size, credits_spent: totalCost },
    });

    if (job_id) {
      await supabase.from("neuron_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        result: { sections: completed.size, credits_spent: totalCost },
      }).eq("id", job_id);
    }

    // SETTLE neurons on success
    await supabase.rpc("settle_neurons", { _user_id: user.id, _amount: totalCost, _description: `SETTLE: Market Research: ${industry}` });
    settled = true;

    return new Response(JSON.stringify({
      sections: Object.fromEntries(
        SECTIONS.map(s => [s.id, { name: s.name, output: sectionOutputs[s.id] || "" }])
      ),
      sections_completed: completed.size,
      credits_spent: totalCost,
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

  } catch (e) {
    console.error("market-research-engine error:", e);
    if (typeof settled !== "undefined" && !settled && user?.id && typeof totalCost !== "undefined") {
      await supabase.rpc("release_neurons", { _user_id: user.id, _amount: totalCost, _description: `RELEASE: Market Research — error` }).catch(() => {});
    }
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
