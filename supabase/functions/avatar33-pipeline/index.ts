import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * Avatar33 Execution Engine
 * 33 commercial prompts executed in strict order to build a complete client avatar.
 * Deliverables: client passport, pain maps, funnels, email sequences, YAML profile.
 */

const AVATAR33_MODULES = [
  // Phase 1: Discovery (Prompts 1-8)
  { id: "a33_demographics", name: "Demographics & Context", phase: "discovery",
    prompt: `Analyze the input and extract comprehensive demographics: age range, gender distribution, location clusters, income brackets, education levels, profession categories, family status. Return as structured data with ## headings.` },
  { id: "a33_psychographics", name: "Psychographics Profile", phase: "discovery",
    prompt: `Extract deep psychographic profile: core values (top 5), belief systems, worldview orientation (optimist/pragmatist/skeptic), identity labels they use, aspirational identity, fear-based identity. Use ## headings.` },
  { id: "a33_goals", name: "Goals & Aspirations", phase: "discovery",
    prompt: `Identify all goals: immediate goals (next 30 days), short-term (3-6 months), medium-term (1-2 years), long-term (5+ years). For each: goal statement, motivation driver, perceived barrier, urgency level (1-10). Use ## headings.` },
  { id: "a33_pain_map", name: "Pain Map (Surface)", phase: "discovery",
    prompt: `Map all surface-level pain points: functional pains (what doesn't work), emotional pains (how it feels), social pains (how others perceive), financial pains (what it costs). Rate each pain intensity 1-10. Use ## headings.` },
  { id: "a33_deep_pain", name: "Pain Map (Deep/Hidden)", phase: "discovery",
    prompt: `Identify hidden/deep pains the avatar won't openly admit: shame triggers, fear of judgment, impostor syndrome areas, comparison anxiety sources, secret desires they feel guilty about, cognitive dissonances. Use ## headings.` },
  { id: "a33_language", name: "Language Patterns", phase: "discovery",
    prompt: `Extract exact language patterns: phrases they use to describe problems, words they use for solutions, emotional vocabulary, objection phrases, excitement phrases, skepticism phrases. Group by context (casual, professional, emotional). Use ## headings.` },
  { id: "a33_media", name: "Media & Information Diet", phase: "discovery",
    prompt: `Map media consumption: social platforms (ranked by time), content formats preferred, influencers they follow, podcasts/shows, books/publications, communities/groups, news sources, learning platforms. Time allocation per channel. Use ## headings.` },
  { id: "a33_day_in_life", name: "Day-in-the-Life Narrative", phase: "discovery",
    prompt: `Write a detailed day-in-the-life narrative for this avatar. Include: morning routine, work challenges, lunch break thoughts, afternoon struggles, evening wind-down, bedtime anxieties. Highlight moments where your product/service could intervene. 800+ words narrative format.` },

  // Phase 2: Commercial Analysis (Prompts 9-16)
  { id: "a33_jtbd", name: "Jobs-to-be-Done", phase: "commercial",
    prompt: `Extract JTBD framework: For each job (5-8), provide: Job Statement (When I... I want to... So I can...), Functional Job, Emotional Job, Social Job, Current Solution, Switching Cost, Hiring Criteria. Use ## headings.` },
  { id: "a33_purchase_triggers", name: "Purchase Triggers", phase: "commercial",
    prompt: `Identify all purchase triggers: external triggers (life events, seasons, milestones), internal triggers (emotions, frustrations, aspirations), social triggers (peer pressure, FOMO, status), timing triggers (urgency, deadlines). Rate trigger strength 1-10. Use ## headings.` },
  { id: "a33_objections", name: "Objection Registry", phase: "commercial",
    prompt: `Map every possible purchase objection: price objections (5+), trust objections (5+), timing objections (3+), need objections (3+), authority objections (3+). For each: the objection, underlying fear, reframe, response script. Use ## headings.` },
  { id: "a33_decision", name: "Decision Process", phase: "commercial",
    prompt: `Map the complete decision process: awareness stage (how they discover solutions), consideration (how they evaluate), decision (final triggers), post-purchase (validation seeking). Include: decision timeline, influencers, information sources, comparison criteria. Use ## headings.` },
  { id: "a33_competitors", name: "Competitive Landscape", phase: "commercial",
    prompt: `Map the avatar's competitive landscape: direct alternatives (5+), indirect alternatives (5+), DIY alternatives, do-nothing alternative. For each: why they choose it, why they leave it, switching barriers, perceived value. Use ## headings.` },
  { id: "a33_willingness", name: "Willingness to Pay", phase: "commercial",
    prompt: `Analyze willingness to pay: price sensitivity level, anchor prices from competitors, perceived value drivers, premium triggers (what makes them pay more), discount triggers (what makes them wait), payment preference (one-time, subscription, payment plan). Use ## headings.` },
  { id: "a33_blind_spots", name: "Market Blind Spots", phase: "commercial",
    prompt: `Identify market blind spots: problems nobody is solving, needs they don't know they have, emerging desires, underserved segments, missed connection opportunities, innovation gaps. For each: opportunity description, potential value, validation approach. Use ## headings.` },
  { id: "a33_monetization", name: "Monetization Analysis", phase: "commercial",
    prompt: `Score monetization potential: conversion probability (%), average deal value estimate, lifetime value potential, referral probability, upsell receptivity, emotional investment level, urgency score, pain intensity × willingness to pay matrix. Use ## headings with scores.` },

  // Phase 3: Content Strategy (Prompts 17-24)
  { id: "a33_hooks", name: "Hook Library", phase: "content",
    prompt: `Generate 20 scroll-stopping hooks for this avatar. Categories: curiosity (5), controversy (3), statistics (3), story (4), question (5). For each: hook text, platform (LinkedIn/Twitter/YouTube/TikTok), psychological trigger. Use ## headings.` },
  { id: "a33_stories", name: "Story Templates", phase: "content",
    prompt: `Create 10 story templates for this avatar. Types: origin (2), transformation (2), failure-lesson (2), customer-hero (2), vision (2). For each: setup, conflict, resolution, moral, where to use, emotional trigger. Use ## headings.` },
  { id: "a33_email_seq", name: "Email Nurture Sequence", phase: "content",
    prompt: `Design a 7-email nurture sequence for this avatar: Email 1 (Welcome + Identity), Email 2 (Pain Validation), Email 3 (Story + Hope), Email 4 (Social Proof), Email 5 (Objection Handling), Email 6 (Urgency + Scarcity), Email 7 (Final CTA). For each: subject line, preview text, full body (200-300 words), CTA. Use ## headings.` },
  { id: "a33_funnel", name: "Funnel Architecture", phase: "content",
    prompt: `Design the optimal conversion funnel: TOFU content (3 pieces), lead magnet design, MOFU nurture (3 touchpoints), BOFU offer structure, post-purchase upsell. Include copy for each stage's landing page. Use ## headings.` },
  { id: "a33_social", name: "Social Media Templates", phase: "content",
    prompt: `Create 15 social media post templates: LinkedIn (5), Twitter/X (5), Instagram (3), TikTok scripts (2). Each with: hook, body, CTA, hashtags, posting time recommendation. Use ## headings.` },
  { id: "a33_ad_copy", name: "Ad Copy Variations", phase: "content",
    prompt: `Generate ad copy for this avatar: Facebook/Meta (5 variations), Google Ads (5 headlines + descriptions), YouTube pre-roll (15s + 30s scripts), retargeting ads (3). Include audience targeting recommendations. Use ## headings.` },
  { id: "a33_lead_magnets", name: "Lead Magnet Designs", phase: "content",
    prompt: `Design 5 lead magnets for this avatar: checklist, template, mini-course, cheat sheet, quiz. For each: title, description, outline, landing page headline, registration form fields, delivery email copy. Use ## headings.` },
  { id: "a33_content_cal", name: "30-Day Content Calendar", phase: "content",
    prompt: `Create a 30-day content calendar: For each day: platform, content type (post/story/video/thread), topic, hook, key message, CTA, hashtags. Organize by content pillar (3-4 pillars). Use ## headings with a table format.` },

  // Phase 4: Synthesis (Prompts 25-33)
  { id: "a33_tension", name: "Emotional Tension Map", phase: "synthesis",
    prompt: `Map the emotional tension landscape: primary tension (desire vs. fear), secondary tensions (5+), tension resolution points, emotional journey from awareness to purchase, peak emotional moments, trust-building sequence. Use ## headings.` },
  { id: "a33_conversion", name: "Conversion Score Analysis", phase: "synthesis",
    prompt: `Calculate conversion readiness: Pain Intensity (1-100), Solution Awareness (1-100), Trust Level Required (1-100), Urgency Factor (1-100), Price Sensitivity (1-100), Emotional Investment (1-100), Social Proof Need (1-100). Composite Conversion Score formula and result. Use ## headings.` },
  { id: "a33_segments", name: "Micro-Segment Analysis", phase: "synthesis",
    prompt: `Identify 3-5 micro-segments within this avatar. For each: segment name, defining characteristic, size estimate (%), unique pain point, unique messaging angle, optimal channel, conversion difficulty, priority ranking. Use ## headings.` },
  { id: "a33_positioning", name: "Positioning Statement", phase: "synthesis",
    prompt: `Craft the perfect positioning: For [target], who [situation], our [product/service] is the [category] that [unique benefit], unlike [alternative], we [differentiator]. Create 3 variations: rational, emotional, aspirational. Use ## headings.` },
  { id: "a33_messaging", name: "Messaging Matrix", phase: "synthesis",
    prompt: `Build a complete messaging matrix: Primary message, Supporting messages (3), Proof points per message, Tone guidelines, Words to use (20), Words to avoid (20), Tagline variations (5), Elevator pitch (30s, 60s, 2min). Use ## headings.` },
  { id: "a33_risk", name: "Risk & Mitigation Map", phase: "synthesis",
    prompt: `Identify risks in targeting this avatar: market risks (3), messaging risks (3), pricing risks (3), competitive risks (3), timing risks (2). For each: risk description, probability, impact, mitigation strategy. Use ## headings.` },
  { id: "a33_recommendations", name: "Strategic Recommendations", phase: "synthesis",
    prompt: `Provide top 10 strategic recommendations for engaging this avatar. For each: recommendation, rationale, expected impact (1-10), effort required (1-10), priority (P1/P2/P3), timeline, success metric. Use ## headings.` },
  { id: "a33_passport", name: "Client Passport", phase: "synthesis",
    prompt: `Create the final Client Passport — a one-page executive summary: Avatar Name, Tagline, Demographics snapshot, Top 3 Pains, Top 3 Desires, Decision Style, Buying Triggers, Primary Objection, Perfect Message, Recommended Channels, Conversion Score, Revenue Potential. Format as a structured card. Use ## headings.` },
  { id: "a33_yaml", name: "YAML Profile Export", phase: "synthesis",
    prompt: `Generate a complete YAML profile for this avatar. Include all key data points in machine-readable format:
\`\`\`yaml
avatar:
  name: ""
  demographics: { age_range: "", income: "", education: "", location: "" }
  psychographics: { values: [], beliefs: [], identity: "" }
  pains: { surface: [], deep: [], intensity_avg: 0 }
  goals: { immediate: [], short_term: [], long_term: [] }
  jtbd: []
  purchase_triggers: []
  objections: []
  channels: []
  content_preferences: []
  conversion_score: 0
  monetization_score: 0
  priority_segment: ""
\`\`\`
Fill all fields with extracted data. Return valid YAML in a code block.` },
];

const BATCH_SIZE = 3;

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
      // Return module list
      const modules = AVATAR33_MODULES.map(m => ({ id: m.id, name: m.name, phase: m.phase }));
      const phases = ["discovery", "commercial", "content", "synthesis"];
      return new Response(JSON.stringify({ modules, phases, total: modules.length, estimated_credits: 33 * 50 }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { content, selected_modules, job_id } = body;

    if (!content || content.length < 50) {
      return new Response(JSON.stringify({ error: "Content must be at least 50 characters" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const modulesToRun = selected_modules?.length
      ? AVATAR33_MODULES.filter(m => selected_modules.includes(m.id))
      : AVATAR33_MODULES;

    const totalCost = modulesToRun.length * 50;

    // RESERVE neurons (atomic wallet)
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: totalCost,
      _description: `RESERVE: Avatar33 Pipeline: ${modulesToRun.length} modules`,
    });

    if (reserveErr || !reserved) {
      return new Response(JSON.stringify({ error: "Insufficient credits", needed: totalCost }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let settled = false;

    // Execute in batches
    const results: Record<string, { name: string; phase: string; content: string }> = {};
    let completedCount = 0;

    for (let i = 0; i < modulesToRun.length; i += BATCH_SIZE) {
      const batch = modulesToRun.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (mod) => {
        try {
          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: mod.prompt },
                { role: "user", content: content.slice(0, 30000) },
              ],
            }),
          });

          if (!resp.ok) return { id: mod.id, name: mod.name, phase: mod.phase, content: `Error: ${resp.status}` };

          const data = await resp.json();
          return { id: mod.id, name: mod.name, phase: mod.phase, content: data.choices?.[0]?.message?.content || "" };
        } catch (e) {
          return { id: mod.id, name: mod.name, phase: mod.phase, content: `Error: ${(e as Error).message}` };
        }
      }));

      for (const r of batchResults) {
        results[r.id] = { name: r.name, phase: r.phase, content: r.content };
        completedCount++;
      }

      // Update job progress
      if (job_id) {
        await supabase.from("neuron_jobs").update({
          result: { progress: completedCount, total: modulesToRun.length, phase: batch[0]?.phase },
        }).eq("id", job_id);
      }
    }

    // Save as artifact
    const fullContent = Object.entries(results)
      .map(([id, r]) => `# ${r.name}\n_Phase: ${r.phase}_\n\n${r.content}`)
      .join("\n\n---\n\n");

    await supabase.from("artifacts").insert({
      author_id: user.id,
      title: `Avatar33 — Client Profile — ${new Date().toLocaleDateString("ro-RO")}`,
      artifact_type: "profile",
      content: fullContent.slice(0, 200_000),
      format: "markdown",
      status: "generated",
      service_key: "avatar33-pipeline",
      job_id: job_id || null,
      tags: ["avatar33", "client-profile", "commercial"],
      metadata: { modules_run: modulesToRun.length, credits_spent: totalCost },
    });

    if (job_id) {
      await supabase.from("neuron_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        result: { modules: modulesToRun.length, credits_spent: totalCost },
      }).eq("id", job_id);
    }

    // SETTLE neurons on success
    await supabase.rpc("settle_neurons", { _user_id: user.id, _amount: totalCost, _description: `SETTLE: Avatar33 Pipeline` });
    settled = true;

    return new Response(JSON.stringify({ results, modules_completed: completedCount, credits_spent: totalCost }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("avatar33-pipeline error:", e);
    if (typeof settled !== "undefined" && !settled && user?.id && typeof totalCost !== "undefined") {
      await supabase.rpc("release_neurons", { _user_id: user.id, _amount: totalCost, _description: `RELEASE: Avatar33 — error` }).catch(() => {});
    }
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
