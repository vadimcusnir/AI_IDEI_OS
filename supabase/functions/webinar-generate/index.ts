import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * Webinar Generation System
 * 12 modules × 4 prompts = 48 prompts total
 * WSE (Structure), SCE (Slides), SSE (Speaker Script), VDE (Visual), QC Gate
 */

interface WebinarModule {
  id: string;
  name: string;
  stage: string;
  prompts: { role: string; prompt: string }[];
}

const WEBINAR_MODULES: WebinarModule[] = [
  {
    id: "wm01_structure", name: "Webinar Structure Engine", stage: "planning",
    prompts: [
      { role: "architect", prompt: `Design a complete webinar structure from this content. Include: Title (3 options), Duration (45/60/90 min), Target Audience, Learning Outcomes (3-5), Segment Breakdown with exact timing:
- Opening Hook (2-3 min)
- Context Setting (5 min)
- Core Content Blocks (3-5 blocks, 8-12 min each)
- Interactive Elements (polls, Q&A) placement
- Transition scripts between segments
- Closing + CTA (5 min)
Return as structured timeline. Use ## headings.` },
      { role: "validator", prompt: `Validate this webinar structure: Check timing adds up, no segment exceeds 15 min, at least 2 interaction points exist, CTA placement is optimal. Flag any issues. Return validation report.` },
      { role: "optimizer", prompt: `Optimize engagement: Add pattern interrupts every 7-8 minutes, suggest poll questions (5), design chat prompts (3), recommend visual transition types. Return optimization plan.` },
      { role: "timing", prompt: `Create precise timing sheet: Start time, End time, Duration, Segment Name, Speaker Action, Slide Range, Notes. Format as a table.` },
    ],
  },
  {
    id: "wm02_slides", name: "Slide Compression Engine", stage: "production",
    prompts: [
      { role: "compressor", prompt: `Create slide content with STRICT rule: MAX 40 words per slide. For each slide: Slide Number, Headline (max 8 words), Body (max 32 words), Visual Direction (describe image/chart/icon). Generate 25-40 slides total. Use ## per slide.` },
      { role: "visual", prompt: `For each slide, specify: Background style (gradient, solid, image), Text layout (centered, left-aligned, split), Color mood (energetic, calm, urgent, trust), Icon/illustration suggestion, Animation type (fade, slide, zoom). Return visual specs per slide.` },
      { role: "flow", prompt: `Design slide transitions and flow: Group slides into sections with transition slides between them. Add progress indicator suggestions. Ensure visual rhythm (content-visual-content pattern). Return flow map.` },
      { role: "qc", prompt: `QC Check: Verify no slide exceeds 40 words. Flag any with >40. Check headline consistency. Verify visual variety (no 3 same-style slides in a row). Return QC report with pass/fail per slide.` },
    ],
  },
  {
    id: "wm03_speaker", name: "Speaker Script Engine", stage: "production",
    prompts: [
      { role: "scriptwriter", prompt: `Write the complete speaker script. Rule: ~130 words per slide (≈1 minute speaking). For each slide: [SLIDE X] marker, full spoken text, [PAUSE] markers, [EMPHASIS] markers, [CLICK] for animations. Natural conversational tone. 3000+ words total.` },
      { role: "hooks", prompt: `Add engagement hooks throughout the script: Opening hook (first 30 seconds), Re-engagement hooks (every 7-8 min), Curiosity loops, Rhetorical questions, Story bridges, Pattern interrupts. Mark with [HOOK] tags.` },
      { role: "transitions", prompt: `Write smooth transitions between all segments. Each transition should: Reference what was just covered, Create anticipation for next part, Include a micro-CTA or engagement prompt. 50-80 words each.` },
      { role: "notes", prompt: `Create presenter notes: Key points to emphasize, Common audience questions at this point, Backup examples if time allows, What to skip if running behind, Energy level guidance (calm/energetic/urgent).` },
    ],
  },
  {
    id: "wm04_opening", name: "Opening Sequence", stage: "content",
    prompts: [
      { role: "hook", prompt: `Write 3 opening hook variations (first 60 seconds each): 1) Story-based hook, 2) Statistic/shock hook, 3) Question-based hook. Each must grab attention and set the promise. 150 words each.` },
      { role: "promise", prompt: `Craft the webinar promise: What they'll learn, What they'll be able to do after, Why this matters now. Create a "By the end of this..." statement. 3 variations.` },
      { role: "credibility", prompt: `Write a 60-second credibility segment: Quick bio, relevant experience/results, why you're qualified. Keep it humble but impressive. Include social proof elements.` },
      { role: "agenda", prompt: `Create the agenda preview slide and script. List 3-5 key takeaways they'll get. Make each one benefit-driven, not topic-driven. Add anticipated questions to address.` },
    ],
  },
  {
    id: "wm05_core1", name: "Core Content Block 1", stage: "content",
    prompts: [
      { role: "content", prompt: `Develop Core Block 1 content (the foundation/context). Include: Key concept explanation, Supporting data/evidence, Real example or case study, Actionable takeaway. 800-1000 words script. 4-6 slides.` },
      { role: "visual", prompt: `Design visuals for Block 1: Diagram/chart for main concept, Before/after visual, Data visualization suggestion, Screenshot/mockup description. Specify for each slide.` },
      { role: "interaction", prompt: `Create interaction point for Block 1: Poll question with 4 options, Chat prompt, Reflection exercise. Include transition from interaction back to content.` },
      { role: "bridge", prompt: `Write bridge from Block 1 to Block 2: Summary of key insight, Teaser for next section, Connecting statement that builds momentum. 80-100 words.` },
    ],
  },
  {
    id: "wm06_core2", name: "Core Content Block 2", stage: "content",
    prompts: [
      { role: "content", prompt: `Develop Core Block 2 (the method/framework). Present the main framework or methodology. Include: Framework name and overview, Step-by-step breakdown, Example application, Common mistakes to avoid. 800-1000 words. 4-6 slides.` },
      { role: "visual", prompt: `Design framework visual: Step diagram, Process flow, Comparison matrix. Make the framework memorable and screenshot-worthy.` },
      { role: "interaction", prompt: `Create interaction for Block 2: "Which step are you stuck on?" poll, Mini-exercise to apply framework, Share-in-chat prompt.` },
      { role: "bridge", prompt: `Bridge from Block 2 to Block 3: Reinforce framework value, Set up the advanced/application section. 80-100 words.` },
    ],
  },
  {
    id: "wm07_core3", name: "Core Content Block 3", stage: "content",
    prompts: [
      { role: "content", prompt: `Develop Core Block 3 (advanced application/results). Show results and advanced tactics. Include: Success stories/case studies, Advanced tips, Implementation roadmap, Common pitfalls and solutions. 800-1000 words. 4-6 slides.` },
      { role: "visual", prompt: `Design results visuals: Before/after metrics, Success story highlight, Implementation timeline, Results dashboard mockup. Specify per slide.` },
      { role: "interaction", prompt: `Create interaction for Block 3: "Rate your confidence" poll, Q&A prompt, Implementation commitment exercise.` },
      { role: "bridge", prompt: `Bridge to closing: Summary of all 3 blocks, Key transformation narrative, Transition to offer/CTA. 100-120 words.` },
    ],
  },
  {
    id: "wm08_closing", name: "Closing & CTA", stage: "conversion",
    prompts: [
      { role: "recap", prompt: `Write the recap section: Summarize 3 key takeaways, Reinforce the transformation, Create "imagine if..." future pacing. 200-250 words.` },
      { role: "offer", prompt: `Design the offer presentation: Offer name, What's included (stack), Bonuses (3), Normal price vs. webinar price, Guarantee, Scarcity element (time/quantity). Full script 300-400 words.` },
      { role: "objections", prompt: `Write objection handling section: Address top 5 objections naturally within the closing. Use story-based or proof-based responses. 200-300 words.` },
      { role: "final_cta", prompt: `Write the final CTA sequence: Last call urgency, Clear next step, What happens after they click, P.S. style closing statement, Sign-off with energy. 150-200 words.` },
    ],
  },
  {
    id: "wm09_qa", name: "Q&A Preparation", stage: "support",
    prompts: [
      { role: "anticipated", prompt: `Generate 15 anticipated questions with answers. Categories: Content clarification (5), Implementation (5), Offer-related (3), Technical/logistics (2). 50-100 word answers each.` },
      { role: "difficult", prompt: `Prepare for difficult questions: "Why is this different?", "What if it doesn't work?", "Is this right for me?", price pushback, competitor comparison. Diplomatic but confident answers.` },
      { role: "pivot", prompt: `Create pivot responses: How to redirect off-topic questions, How to use questions to reinforce key points, How to create engagement from questions. Templates for 5 common scenarios.` },
      { role: "follow_up", prompt: `Design post-Q&A follow-up: Thank you message, Summary email template, Recording access instructions, Next steps for non-buyers, VIP offer for attendees.` },
    ],
  },
  {
    id: "wm10_emails", name: "Email Sequence", stage: "support",
    prompts: [
      { role: "pre_webinar", prompt: `Write pre-webinar email sequence (3 emails): Registration confirmation, 24-hour reminder, 1-hour reminder. Each with: Subject line, body (150-200 words), anticipation builders, calendar add CTA.` },
      { role: "post_webinar", prompt: `Write post-webinar sequence (4 emails): Replay access (immediate), Value recap + soft CTA (day 1), Social proof + urgency (day 2), Final call (day 3). Full body each.` },
      { role: "no_show", prompt: `Write no-show recovery emails (2): "You missed something special" (replay access + key insight), "Last chance" (urgency + testimonial). Full body each.` },
      { role: "registration", prompt: `Write registration page copy: Headline, subheadline, 5 bullet points of what they'll learn, speaker bio snippet, date/time display, urgency element, privacy note. Full copy.` },
    ],
  },
  {
    id: "wm11_visual_deck", name: "Visual Deck Engine", stage: "production",
    prompts: [
      { role: "style_guide", prompt: `Define the visual style guide: Color palette (primary, secondary, accent), Font pairing (heading + body), Slide master layouts (title, content, split, quote, data), Background patterns, Icon style, Photo treatment.` },
      { role: "layouts", prompt: `Design 5 master slide layouts: 1) Title slide, 2) Content + image split, 3) Quote/stat highlight, 4) Process/steps, 5) CTA slide. Describe exact element placement and sizing.` },
      { role: "data_viz", prompt: `Design data visualizations: Chart styles for metrics, Before/after graphics, Process diagrams, Comparison tables. Specify data, labels, colors for each.` },
      { role: "brand", prompt: `Create branding elements: Logo placement rules, Consistent footer design, Social handles display, QR code suggestions, Watermark for screenshots. Return brand usage guide.` },
    ],
  },
  {
    id: "wm12_qc_gate", name: "QC Gate Validation", stage: "validation",
    prompts: [
      { role: "content_qc", prompt: `QC Content Quality: Check for factual consistency, Verify no contradictions between sections, Ensure progressive complexity, Validate CTA alignment with content. Score each section 1-10. Return audit report.` },
      { role: "timing_qc", prompt: `QC Timing: Verify total duration matches target, Check segment pacing, Ensure interaction points are properly spaced, Validate no segment > 15 min without break. Return timing audit.` },
      { role: "engagement_qc", prompt: `QC Engagement: Count interaction points (minimum 5), Verify hook frequency, Check story-to-data ratio, Assess energy curve (should peak, dip, peak). Return engagement score.` },
      { role: "conversion_qc", prompt: `QC Conversion: Verify offer is clearly presented, Check scarcity elements exist, Validate objection handling coverage, Assess CTA strength and clarity. Return conversion optimization score with recommendations.` },
    ],
  },
];

const BATCH_SIZE = 3;

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
      const modules = WEBINAR_MODULES.map(m => ({
        id: m.id, name: m.name, stage: m.stage, prompt_count: m.prompts.length,
      }));
      return new Response(JSON.stringify({
        modules, stages: ["planning", "content", "production", "conversion", "support", "validation"],
        total_prompts: WEBINAR_MODULES.reduce((s, m) => s + m.prompts.length, 0),
        estimated_credits: 48 * 40,
      }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const { content, selected_modules, job_id, webinar_config } = await req.json();

    if (!content || content.length < 50) {
      return new Response(JSON.stringify({ error: "Content must be at least 50 characters" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const modulesToRun = selected_modules?.length
      ? WEBINAR_MODULES.filter(m => selected_modules.includes(m.id))
      : WEBINAR_MODULES;

    const totalPrompts = modulesToRun.reduce((s, m) => s + m.prompts.length, 0);
    const totalCost = totalPrompts * 40;

    // RESERVE neurons (atomic wallet)
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: totalCost,
      _description: `RESERVE: Webinar Generation: ${modulesToRun.length} modules, ${totalPrompts} prompts`,
    });

    if (reserveErr || !reserved) {
      return new Response(JSON.stringify({ error: "Insufficient credits", needed: totalCost }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let settled = false;

    const configContext = webinar_config
      ? `\n\nWebinar Config: Duration=${webinar_config.duration || 60}min, Topic="${webinar_config.topic || ""}", Audience="${webinar_config.audience || ""}"`
      : "";

    const results: Record<string, { name: string; stage: string; outputs: Record<string, string> }> = {};
    let completedPrompts = 0;

    for (const mod of modulesToRun) {
      const moduleResult: Record<string, string> = {};

      // Process prompts in batches within each module
      for (let i = 0; i < mod.prompts.length; i += BATCH_SIZE) {
        const batch = mod.prompts.slice(i, i + BATCH_SIZE);
        // Pass previous module outputs as context for later modules
        const previousContext = Object.entries(results)
          .map(([_, r]) => Object.values(r.outputs).join("\n\n"))
          .join("\n---\n").slice(0, 15000);

        const batchResults = await Promise.all(batch.map(async (p) => {
          try {
            const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: p.prompt },
                  { role: "user", content: content.slice(0, 20000) + configContext + (previousContext ? `\n\nPrevious outputs:\n${previousContext.slice(0, 10000)}` : "") },
                ],
              }),
            });
            if (!resp.ok) return { role: p.role, content: `Error: ${resp.status}` };
            const data = await resp.json();
            return { role: p.role, content: data.choices?.[0]?.message?.content || "" };
          } catch (e) {
            return { role: p.role, content: `Error: ${e instanceof Error ? e.message : String(e)}` };
          }
        }));

        for (const r of batchResults) {
          moduleResult[r.role] = r.content;
          completedPrompts++;
        }
      }

      results[mod.id] = { name: mod.name, stage: mod.stage, outputs: moduleResult };

      if (job_id) {
        await supabase.from("neuron_jobs").update({
          result: { progress: completedPrompts, total: totalPrompts, current_module: mod.name },
        }).eq("id", job_id);
      }
    }

    // Save complete webinar as artifact
    const fullContent = Object.entries(results)
      .map(([_, r]) => {
        const outputs = Object.entries(r.outputs)
          .map(([role, content]) => `### ${role}\n${content}`)
          .join("\n\n");
        return `# ${r.name}\n_Stage: ${r.stage}_\n\n${outputs}`;
      })
      .join("\n\n---\n\n");

    await supabase.from("artifacts").insert({
      author_id: user.id,
      title: `Webinar Package — ${new Date().toLocaleDateString("ro-RO")}`,
      artifact_type: "document",
      content: fullContent.slice(0, 200_000),
      format: "markdown",
      status: "generated",
      service_key: "webinar-generate",
      job_id: job_id || null,
      tags: ["webinar", "presentation", "content-production"],
      metadata: { modules_run: modulesToRun.length, prompts_executed: totalPrompts, credits_spent: totalCost },
    });

    if (job_id) {
      await supabase.from("neuron_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        result: { modules: modulesToRun.length, prompts: totalPrompts, credits_spent: totalCost },
      }).eq("id", job_id);
    }

    // SETTLE neurons on success
    await supabase.rpc("settle_neurons", { _user_id: user.id, _amount: totalCost, _description: `SETTLE: Webinar Generation` });
    settled = true;

    return new Response(JSON.stringify({ results, prompts_completed: completedPrompts, credits_spent: totalCost }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("webinar-generate error:", e);
    if (typeof settled !== "undefined" && !settled && user?.id && typeof totalCost !== "undefined") {
      await supabase.rpc("release_neurons", { _user_id: user.id, _amount: totalCost, _description: `RELEASE: Webinar — error` }).catch(() => {});
    }
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
