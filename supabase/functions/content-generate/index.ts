import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * Content Generation Services
 * Quick-access content generation from neurons/transcripts.
 * Generates tweet threads, LinkedIn posts, articles, YouTube scripts, etc.
 */

const CONTENT_GENERATORS: Record<string, { name: string; cost: number; prompt: string }> = {
  "tweet-thread": {
    name: "Tweet/X Thread", cost: 30,
    prompt: `Generate a viral Twitter/X thread from this content. Rules:
- 10-15 tweets
- Tweet 1: Hook (must stop scrolling)
- Tweets 2-12: Key insights, each self-contained
- Last tweet: CTA + thread summary
- Each tweet: max 280 chars
- Use thread numbering (1/, 2/, etc.)
- Include 2-3 relevant emojis per tweet
- No hashtags in thread body, only last tweet
Return each tweet on its own line with numbering.`,
  },
  "linkedin-post": {
    name: "LinkedIn Post", cost: 30,
    prompt: `Generate a LinkedIn post from this content. Rules:
- Hook line (first line visible before "see more")
- 1300-2000 characters total
- Short paragraphs (1-2 sentences)
- Include a personal angle/story if possible
- End with engagement question
- Add 3-5 relevant hashtags at the end
- Use line breaks for readability
- Avoid corporate jargon
Return the complete post ready to copy-paste.`,
  },
  "blog-article": {
    name: "Blog Article", cost: 80,
    prompt: `Generate a complete blog article from this content. Include:
- SEO-optimized title (60 chars max)
- Meta description (155 chars max)
- Introduction with hook (150-200 words)
- 5-7 H2 sections with 200-400 words each
- Practical examples or case studies
- Conclusion with CTA
- Total: 2000-3000 words
- Include suggested internal links
- Add FAQ section (5 questions)
Format with ## headings, use bold for key points.`,
  },
  "youtube-script": {
    name: "YouTube Script", cost: 60,
    prompt: `Generate a YouTube video script from this content. Include:
- Title (3 options, click-worthy)
- Thumbnail text suggestion
- Hook (first 15 seconds - CRITICAL)
- Full script with [VISUAL CUE] markers
- B-roll suggestions in [B-ROLL: description] format
- Chapters/timestamps
- End screen CTA
- Target: 8-12 minutes
- Description with keywords
- Tags (15-20)
Format with ## for each section.`,
  },
  "newsletter": {
    name: "Newsletter Edition", cost: 40,
    prompt: `Generate a complete newsletter edition from this content. Include:
- Subject line (3 A/B variations)
- Preview text
- Opening hook (2-3 sentences)
- Main story (500-700 words)
- Key Insights box (3-5 bullets)
- Actionable takeaway section
- Resource recommendations (3)
- CTA
- P.S. line
Format with ## headings, ready to paste into email tool.`,
  },
  "viral-hooks": {
    name: "Viral Hooks Pack", cost: 25,
    prompt: `Generate 25 viral hooks from this content. Categories:
- **Curiosity** (5): "Most people don't know..."
- **Controversy** (5): "Unpopular opinion: ..."
- **Statistics** (3): "X% of people..."
- **Story** (5): "I just discovered..."
- **Question** (4): "What if..."
- **Authority** (3): "After X years of..."
For each: the hook, platform best fit, psychological trigger.
Format with ## per category.`,
  },
  "content-calendar": {
    name: "30-Day Content Calendar", cost: 50,
    prompt: `Generate a 30-day content calendar from this content. For each day:
| Day | Platform | Format | Topic | Hook | CTA |
Include:
- 3-4 content pillars derived from the source
- Mix of platforms (LinkedIn, Twitter, Instagram, YouTube)
- Mix of formats (post, thread, carousel, video, story)
- Recurring series (e.g., "Tuesday Tips")
- Engagement days (polls, questions)
Format as a table with ## headings per week.`,
  },
  "carousel": {
    name: "Social Carousel", cost: 35,
    prompt: `Generate 3 social media carousels from this content. Each carousel:
- 8-10 slides
- Slide 1: Hook/title (max 8 words)
- Slides 2-8: Content (max 30 words per slide)
- Last slide: CTA
- Include visual direction for each slide
- Platform: LinkedIn + Instagram
Format with ## per carousel, ### per slide.`,
  },
};

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
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    if (req.method === "GET") {
      const generators = Object.entries(CONTENT_GENERATORS).map(([key, g]) => ({
        key, name: g.name, cost: g.cost,
      }));
      return new Response(JSON.stringify({ generators, total: generators.length }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { content, generators: selectedKeys, neuron_id, job_id } = await req.json();

    if (!content || content.length < 30) {
      return new Response(JSON.stringify({ error: "Content must be at least 30 characters" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const keys = selectedKeys?.length
      ? selectedKeys.filter((k: string) => CONTENT_GENERATORS[k])
      : Object.keys(CONTENT_GENERATORS);

    const totalCost = keys.reduce((s: number, k: string) => s + (CONTENT_GENERATORS[k]?.cost || 30), 0);

    // RESERVE neurons (atomic wallet)
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: totalCost,
      _description: `RESERVE: Content Generation: ${keys.length} formats`,
    });

    if (reserveErr || !reserved) {
      return new Response(JSON.stringify({ error: "Insufficient credits", needed: totalCost }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let settled = false;

    // Execute in parallel batches of 4
    const results: Record<string, { name: string; content: string }> = {};
    const BATCH = 4;

    for (let i = 0; i < keys.length; i += BATCH) {
      const batch = keys.slice(i, i + BATCH);
      const batchResults = await Promise.all(batch.map(async (key: string) => {
        const gen = CONTENT_GENERATORS[key];
        try {
          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: gen.prompt },
                { role: "user", content: content.slice(0, 25000) },
              ],
            }),
          });
          if (!resp.ok) return { key, name: gen.name, content: `Error: ${resp.status}` };
          const data = await resp.json();
          return { key, name: gen.name, content: data.choices?.[0]?.message?.content || "" };
        } catch (e) {
          return { key, name: gen.name, content: `Error: ${(e as Error).message}` };
        }
      }));

      for (const r of batchResults) results[r.key] = { name: r.name, content: r.content };
    }

    // Save all as single artifact
    const fullContent = Object.entries(results)
      .map(([key, r]) => `# ${r.name}\n\n${r.content}`)
      .join("\n\n---\n\n");

    await supabase.from("artifacts").insert({
      author_id: user.id,
      title: `Content Pack (${keys.length} formats) — ${new Date().toLocaleDateString("ro-RO")}`,
      artifact_type: "document",
      content: fullContent.slice(0, 200_000),
      format: "markdown",
      status: "generated",
      service_key: "content-generate",
      job_id: job_id || null,
      tags: ["content", "generation", ...keys],
      metadata: { formats: keys.length, credits_spent: totalCost, neuron_id },
    });

    if (job_id) {
      await supabase.from("neuron_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        result: { formats: keys.length, credits_spent: totalCost },
      }).eq("id", job_id);
    }

    // SETTLE neurons on success
    await supabase.rpc("settle_neurons", { _user_id: user.id, _amount: totalCost, _description: `SETTLE: Content Generation: ${keys.length} formats` });
    settled = true;

    return new Response(JSON.stringify({ results, formats_completed: keys.length, credits_spent: totalCost }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("content-generate error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
