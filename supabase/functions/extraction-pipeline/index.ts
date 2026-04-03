import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * 12-Level Extraction Pipeline
 * Orchestrates multi-level knowledge extraction from content.
 * L0: Input → L12: Content Production
 */

interface PipelineLevel {
  level: number;
  id: string;
  name: string;
  description: string;
  prompt: string;
  depends_on: number[];
  cost_multiplier: number;
}

const PIPELINE_LEVELS: PipelineLevel[] = [
  {
    level: 0, id: "input", name: "Input Layer", description: "Validate and normalize input",
    depends_on: [], cost_multiplier: 0.5,
    prompt: `Analyze this raw content input. Return: 1) Content type (transcript/article/notes/interview), 2) Language detected, 3) Word count, 4) Estimated quality score (1-10), 5) Key topics overview (5-10), 6) Speaker/author identification, 7) Content structure analysis. Format as structured JSON-like output with ## headings.`,
  },
  {
    level: 1, id: "segmentation", name: "Transcript Segmentation", description: "Semantic chunking into coherent segments",
    depends_on: [0], cost_multiplier: 0.8,
    prompt: `Segment this content into coherent semantic chunks. For each segment: 1) Segment number, 2) Topic/theme, 3) Key speaker (if applicable), 4) Summary (2-3 sentences), 5) Token estimate, 6) Density rating (information-rich vs conversational). Target: 10-20 segments of 200-800 tokens each. Use ## per segment.`,
  },
  {
    level: 2, id: "atomic", name: "Atomic Extraction", description: "Extract statements, definitions, principles",
    depends_on: [1], cost_multiplier: 1.0,
    prompt: `Extract all atomic knowledge units from this content. Categories:
- **Statements**: Definitive claims or assertions (10-15)
- **Definitions**: Terms defined or explained (5-10)
- **Principles**: Universal rules or guidelines stated (5-8)
- **Data Points**: Statistics, numbers, metrics mentioned (3-8)
- **Examples**: Specific cases or illustrations (5-10)
For each: exact quote or paraphrase, category, confidence (1-10), source segment. Use ## headings per category.`,
  },
  {
    level: 3, id: "entity", name: "Entity Extraction", description: "People, organizations, concepts, tools",
    depends_on: [1], cost_multiplier: 1.0,
    prompt: `Extract all entities from this content:
- **People**: Names, roles, expertise areas (include speakers/guests)
- **Organizations**: Companies, institutions, brands mentioned
- **Concepts**: Abstract ideas, theories, methodologies
- **Tools**: Software, platforms, technologies
- **Places**: Locations, markets, geographies
- **Events**: Conferences, milestones, historical events
For each: name, type, context of mention, importance (1-10), relationships to other entities. Use ## per category.`,
  },
  {
    level: 4, id: "structural", name: "Structural Extraction", description: "Frameworks, mental models, taxonomies",
    depends_on: [2], cost_multiplier: 1.2,
    prompt: `Extract structural knowledge patterns:
- **Frameworks**: Named or implied structured thinking models (5-8)
- **Mental Models**: Decision-making lenses used (3-5)
- **Taxonomies**: Classification systems presented (2-4)
- **Processes**: Step-by-step methodologies (3-5)
- **Matrices**: 2×2 or multi-dimensional analyses (2-3)
For each: name, structure description, application context, components, example usage. Use ## headings.`,
  },
  {
    level: 5, id: "psychological", name: "Psychological Extraction", description: "Cognitive patterns, biases, emotional drivers",
    depends_on: [2, 3], cost_multiplier: 1.3,
    prompt: `Extract psychological patterns:
- **Cognitive Biases**: Biases mentioned or demonstrated (5-8)
- **Decision Heuristics**: Shortcuts in reasoning (3-5)
- **Emotional Drivers**: Motivations, fears, desires expressed (5-8)
- **Persuasion Techniques**: Influence patterns used (5-8)
- **Behavioral Patterns**: Habitual or recommended behaviors (3-5)
For each: pattern name, description, evidence from text, psychological mechanism, practical application. Use ## headings.`,
  },
  {
    level: 6, id: "narrative", name: "Narrative Extraction", description: "Stories, metaphors, pivot phrases",
    depends_on: [2], cost_multiplier: 1.1,
    prompt: `Extract narrative elements:
- **Anchor Stories**: Key stories told with full structure (setup, conflict, resolution) (3-5)
- **Metaphors**: Analogies and comparisons used (5-8)
- **Pivot Phrases**: Transitional statements that shift perspective (5-8)
- **Rhetorical Devices**: Repetition, contrast, triads used (5-8)
- **Opening Hooks**: Attention-grabbing statements (3-5)
- **Closing Statements**: Memorable conclusions or calls to action (3-5)
For each: the element, type, context, effectiveness rating, reuse potential. Use ## headings.`,
  },
  {
    level: 7, id: "commercial", name: "Commercial Extraction", description: "JTBD, purchase triggers, blind spots",
    depends_on: [2, 3, 5], cost_multiplier: 1.3,
    prompt: `Extract commercial intelligence:
- **Jobs-to-be-Done**: Functional, emotional, social jobs (5-8)
- **Purchase Triggers**: Events/emotions that trigger buying (5-8)
- **Value Propositions**: Stated or implied value offers (3-5)
- **Pricing Signals**: Price anchors, willingness indicators (3-5)
- **Market Blind Spots**: Unaddressed needs or opportunities (3-5)
- **Competitive Insights**: Differentiators and positioning (3-5)
For each: description, evidence, commercial significance (1-10), actionability. Use ## headings.`,
  },
  {
    level: 8, id: "pattern", name: "Pattern Detection", description: "Decision, persuasion, influence patterns",
    depends_on: [4, 5, 6], cost_multiplier: 1.4,
    prompt: `Detect cross-cutting patterns:
- **Decision Patterns**: How decisions are framed and made (3-5)
- **Persuasion Patterns**: Recurring influence structures (5-8)
- **Communication Patterns**: Recurring speech/writing structures (3-5)
- **Success Patterns**: Common elements in successful outcomes (3-5)
- **Failure Patterns**: Recurring mistakes or anti-patterns (3-5)
For each: pattern name, structure, frequency, reliability score, template for reuse. Use ## headings.`,
  },
  {
    level: 9, id: "synthesis", name: "Insight Synthesis", description: "Cross-level insight generation",
    depends_on: [4, 5, 6, 7, 8], cost_multiplier: 1.5,
    prompt: `Synthesize cross-level insights from all previous extractions. Generate:
- **Meta-Insights**: Insights that emerge from combining multiple extraction levels (5-8)
- **Contradiction Analysis**: Where different levels reveal tensions (2-3)
- **Novelty Assessment**: Which insights are genuinely new vs. common knowledge (rank all)
- **Composite Score**: For each insight: novelty × information_density × utility × demand (formula)
- **Tier Classification**: Premium (>70), Standard (40-70), Discard (<40)
- **Connection Map**: How insights relate to each other (graph description)
Use ## headings. Score each insight numerically.`,
  },
  {
    level: 10, id: "profile", name: "Profile Generation", description: "Speaker/author expertise profile",
    depends_on: [3, 5, 9], cost_multiplier: 1.2,
    prompt: `Generate comprehensive profiles for each identified speaker/author:
- **Expertise Map**: Areas of knowledge with percentage confidence
- **Communication Style**: Tone, vocabulary level, persuasion approach
- **Cognitive Fingerprint**: Dominant thinking styles, biases, decision patterns
- **Value System**: Core values expressed through content
- **Authority Score**: Evidence-based assessment of expertise depth
- **Network Map**: Referenced people, influences, intellectual lineage
Use ## headings per person.`,
  },
  {
    level: 11, id: "knowledge_graph", name: "Knowledge Graph Update", description: "Entity-relation mapping for graph",
    depends_on: [3, 4, 9], cost_multiplier: 1.0,
    prompt: `Generate Knowledge Graph update instructions:
- **New Entities**: List entities to create with type, title, description, slug
- **Relations**: Entity pairs with relation type (SUPPORTS, EXTENDS, CONTRADICTS, DERIVED_FROM, APPLIES_TO, PART_OF)
- **Scores**: importance_score, confidence_score, evidence_count for each entity
- **Clusters**: Group related entities into insight_families
- **Merge Candidates**: Entities that might duplicate existing graph nodes
Format as structured instructions ready for database insertion. Use ## headings.`,
  },
  {
    level: 12, id: "content_production", name: "Content Production", description: "Generate ready-to-publish content",
    depends_on: [9, 10], cost_multiplier: 1.5,
    prompt: `Generate ready-to-publish content from synthesized insights:
1. **Twitter/X Thread**: 10-tweet thread with hooks and insights
2. **LinkedIn Post**: 1500-word thought leadership post
3. **Newsletter**: Complete edition (500-700 words)
4. **Blog Article Outline**: H1, H2s, key points per section
5. **YouTube Script**: 5-minute script with visual cues
6. **Podcast Notes**: Episode summary, timestamps, key takeaways
7. **Carousel**: 8-slide carousel with headline + body per slide
Each piece should reference specific insights from the extraction. Use ## headings per format.`,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  try {
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
        levels: PIPELINE_LEVELS.map(l => ({
          level: l.level, id: l.id, name: l.name, description: l.description,
          depends_on: l.depends_on, cost_multiplier: l.cost_multiplier,
        })),
        total_levels: PIPELINE_LEVELS.length,
        estimated_credits: Math.round(PIPELINE_LEVELS.reduce((s, l) => s + 50 * l.cost_multiplier, 0)),
      }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const { content, start_level = 0, end_level = 12, job_id, episode_id } = await req.json();

    if (!content || content.length < 100) {
      return new Response(JSON.stringify({ error: "Content must be at least 100 characters" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const levelsToRun = PIPELINE_LEVELS.filter(l => l.level >= start_level && l.level <= end_level);
    const totalCost = Math.round(levelsToRun.reduce((s, l) => s + 50 * l.cost_multiplier, 0));

    // RESERVE neurons (atomic wallet)
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: totalCost,
      _description: `RESERVE: Pipeline L${start_level}-L${end_level}: ${levelsToRun.length} levels`,
    });

    if (reserveErr || !reserved) {
      return new Response(JSON.stringify({ error: "Insufficient credits", needed: totalCost }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let settled = false;

    // Execute levels in dependency order
    const levelOutputs: Record<number, string> = {};

    for (const level of levelsToRun) {
      // Gather dependency outputs as context
      const depContext = level.depends_on
        .filter(d => levelOutputs[d])
        .map(d => `[L${d} Output]\n${levelOutputs[d]?.slice(0, 5000)}`)
        .join("\n\n");

      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: level.prompt },
              { role: "user", content: `Source Content:\n${content.slice(0, 25000)}\n\n${depContext ? `Previous Level Outputs:\n${depContext}` : ""}` },
            ],
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          levelOutputs[level.level] = data.choices?.[0]?.message?.content || "";
        } else {
          levelOutputs[level.level] = `Error at level ${level.level}: ${resp.status}`;
        }
      } catch (e) {
        levelOutputs[level.level] = `Error at level ${level.level}: ${(e as Error).message}`;
      }

      if (job_id) {
        await supabase.from("neuron_jobs").update({
          result: { current_level: level.level, level_name: level.name, progress: level.level - start_level + 1, total: levelsToRun.length },
        }).eq("id", job_id);
      }
    }

    // Save complete pipeline output
    const fullContent = Object.entries(levelOutputs)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([lvl, output]) => {
        const level = PIPELINE_LEVELS.find(l => l.level === Number(lvl));
        return `# L${lvl}: ${level?.name || "Unknown"}\n_${level?.description}_\n\n${output}`;
      })
      .join("\n\n---\n\n");

    await supabase.from("artifacts").insert({
      author_id: user.id,
      title: `Extraction Pipeline L${start_level}-L${end_level} — ${new Date().toLocaleDateString("ro-RO")}`,
      artifact_type: "report",
      content: fullContent.slice(0, 200_000),
      format: "markdown",
      status: "generated",
      service_key: "extraction-pipeline",
      job_id: job_id || null,
      tags: ["extraction", "pipeline", "multi-level"],
      metadata: { levels_run: levelsToRun.length, start_level, end_level, credits_spent: totalCost, episode_id },
    });

    if (job_id) {
      await supabase.from("neuron_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        result: { levels: levelsToRun.length, credits_spent: totalCost },
      }).eq("id", job_id);
    }

    const results = Object.fromEntries(
      Object.entries(levelOutputs).map(([lvl, output]) => {
        const level = PIPELINE_LEVELS.find(l => l.level === Number(lvl));
        return [level?.id || lvl, { level: Number(lvl), name: level?.name, output }];
      })
    );

    // SETTLE neurons on success
    await supabase.rpc("settle_neurons", { _user_id: user.id, _amount: totalCost, _description: `SETTLE: Pipeline L${start_level}-L${end_level}` });
    settled = true;

    return new Response(JSON.stringify({ results, levels_completed: levelsToRun.length, credits_spent: totalCost }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("extraction-pipeline error:", e);
    if (typeof settled !== "undefined" && !settled && user?.id && typeof totalCost !== "undefined") {
      await supabase.rpc("release_neurons", { _user_id: user.id, _amount: totalCost, _description: `RELEASE: Pipeline — error` }).catch(() => {});
    }
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
