import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SERVICE_PROMPTS: Record<string, string> = {
  "insight-extractor": `You are a knowledge extraction engine. Analyze the provided content and extract the most important insights.
For each insight provide: title, explanation, practical implication. Return 5-10 insights structured with ## headings.`,
  "framework-detector": `You are a pattern recognition engine. Analyze the content and identify mental models, frameworks, and structured thinking patterns.
For each: name, core structure, when to use, example. Return 3-7 frameworks with ## headings.`,
  "question-engine": `You are a Socratic analysis engine. Generate the most important questions the content raises.
Categories: Clarification, Challenge, Extension, Application. Return 7-12 questions with categories.`,
  "quote-extractor": `You are a quote extraction engine. Identify the most quotable, shareable, impactful statements.
For each: the quote, context, suggested use. Return 5-10 quotes with > blockquote formatting.`,
  "prompt-generator": `You are a prompt engineering engine. Generate reusable AI prompts based on the content.
For each: title, full prompt text, expected output. Return 3-7 prompts with code blocks.`,
  "market-research": `You are a market research analyst. Based on the input context, produce a comprehensive market analysis.
Include: Market Overview, Key Players, Target Audience, Opportunities, Threats, Entry Strategy, Pricing Analysis, Competitive Positioning, Action Plan.
Each section should be detailed with specific data points and actionable recommendations. Use ## headings.`,
  "course-generator": `You are an educational content architect. Based on the input, design a complete course structure.
Include: Course Title, Learning Objectives, Module Breakdown (5-8 modules), Lesson Outlines, Exercises, Assessment Criteria.
Make it practical and actionable. Use ## headings.`,
  "content-classifier": `You are a content classification engine. Analyze the content and classify it across multiple dimensions.
Provide: Primary Category, Sub-categories, Themes, Sentiment, Complexity Level, Target Audience, Content Type, Key Topics.
Return structured analysis with ## headings.`,
  "strategy-builder": `You are a strategic planning engine. Based on the context, develop a comprehensive strategy.
Include: Situation Analysis, Strategic Objectives, Key Initiatives, Resource Requirements, Timeline, Risk Assessment, Success Metrics, Implementation Plan.
Each section detailed. Use ## headings.`,
  "argument-mapper": `You are an argumentation analysis engine. Map the logical structure of ideas presented.
Include: Central Claim, Supporting Arguments, Evidence Assessment, Counterarguments, Logical Gaps, Strengthening Suggestions.
Use structured formatting with ## headings.`,
  "profile-extractor": `You are a personal branding expert and content architect. Given a user's experience, skills, and products, generate:

## Hero Text
A compelling 1-2 sentence hero tagline for their personal page. Bold, memorable, positioning them as an authority.

## Bio
A 3-4 paragraph professional biography that tells their story, highlights key achievements, and builds trust. Write in first person.

## Products & Services
For each product/service they offer, create:
- **Title**: Clear, benefit-driven name
- **Description**: 2-3 sentences explaining value
- **Price suggestion**: Based on market positioning
- **Target audience**: Who benefits most

## Key Neurons
Extract 5-8 atomic knowledge units (neurons) from their experience. Each neuron should be:
- A single, self-contained insight or expertise area
- Titled concisely (3-7 words)
- With a brief explanation (1-2 sentences)

Use the tone specified by the user. Default to professional but approachable.`,
  "prompt-forge": `You are an expert prompt engineer specializing in personal branding and content creation. Based on the user's context and goal, generate:

## Primary Prompt
A detailed, ready-to-use prompt optimized for the specified goal. Include:
- Clear role definition
- Specific instructions
- Output format specification
- Quality constraints

## Variations
3 alternative prompt variations, each with a different approach:
1. **Concise version** — shorter, focused
2. **Detailed version** — comprehensive, with examples
3. **Creative version** — unconventional angle

## Suggested Content Blocks
Recommend 3-5 content blocks (TextBlock, PromptBlock, ListBlock) that would work well with this prompt, including:
- Block type and purpose
- Example content or structure
- How it connects to the overall goal

Format everything with ## headings and clear structure.`,

  // ── Sprint D: 20 Specialized Extractors ──

  "hook-generator": `You are a viral content hook specialist. Analyze the content and generate scroll-stopping hooks.
For each hook provide: the hook text, hook type (curiosity, controversy, statistic, story, question), platform recommendation (LinkedIn, Twitter/X, YouTube, TikTok), and why it works psychologically.
Return 10-15 hooks organized by platform. Use ## headings.`,

  "objection-handler": `You are a sales objection analysis engine. From the content, identify every possible customer objection and create handling scripts.
For each objection: the objection, underlying fear, reframe technique, response script (2-3 sentences), proof element to include.
Return 8-12 objections with ## headings.`,

  "email-sequence": `You are an email marketing architect. Based on the content, design a complete email nurture sequence.
Include: Sequence Goal, 7-email sequence with Subject Line, Preview Text, Email Body (150-300 words each), CTA, Send Timing.
Types: Welcome, Value, Story, Social Proof, Objection Handler, Urgency, Close.
Use ## headings for each email.`,

  "social-carousel": `You are a social media carousel designer. Transform the content into slide-by-slide carousel scripts.
Generate 3 carousels (8-10 slides each). For each slide: Slide Number, Headline (max 8 words), Body Text (max 30 words), Visual Direction.
Include: Hook slide, content slides, CTA slide. Optimize for LinkedIn and Instagram. Use ## headings.`,

  "seo-article": `You are an SEO content strategist. Transform the content into a fully optimized long-form article.
Include: SEO Title (60 chars), Meta Description (155 chars), URL Slug, Primary Keyword, Secondary Keywords (5-8), Article Structure with H2/H3 headings, Introduction (hook + thesis), 5-7 Sections (300-500 words each), Conclusion with CTA, Internal Linking Suggestions, Schema Markup Recommendations.
Write the full article (2000+ words). Use ## headings.`,

  "podcast-shownotes": `You are a podcast production assistant. Generate comprehensive show notes from the content.
Include: Episode Title (3 variations), One-Line Summary, Key Takeaways (5-7 bullets), Timestamps with Topics, Guest Bio (if applicable), Resources Mentioned, Quotable Moments (3-5), Social Media Snippets (Twitter, LinkedIn), Related Episodes Suggestions.
Use ## headings.`,

  "video-script": `You are a video scriptwriter. Transform the content into a YouTube/video script.
Include: Title (3 variations), Thumbnail Text Suggestion, Hook (first 30 seconds), Script with [VISUAL DIRECTION] cues, B-Roll Suggestions, Chapters/Timestamps, End Screen CTA, Description with Keywords, Tags (15-20).
Target length: 8-12 minutes. Use ## headings.`,

  "lead-magnet": `You are a lead generation specialist. Design a complete lead magnet based on the content.
Include: Lead Magnet Type (checklist, template, mini-course, cheat sheet), Title (benefit-driven), Subtitle, Table of Contents, Full Content (3000+ words), Design Suggestions, Landing Page Copy (headline, subheadline, 3 bullets, CTA), Thank You Page Copy.
Use ## headings.`,

  "swipe-file": `You are a copywriting swipe file curator. Extract and create reusable copy patterns from the content.
Categories: Headlines (10), Subheadlines (5), CTAs (8), Value Propositions (5), Testimonial Templates (3), Email Subject Lines (10), Social Posts (8), Ad Copy Variations (5).
For each: the copy, pattern name, when to use, customization notes.
Use ## headings.`,

  "competitor-analysis": `You are a competitive intelligence analyst. Based on the content context, produce a detailed competitive analysis.
Include: Market Positioning Map, Direct Competitors (5-8) with Strengths/Weaknesses, Indirect Competitors (3-5), Differentiation Opportunities, Pricing Comparison Matrix, Feature Gap Analysis, Messaging Comparison, Strategic Recommendations.
Use ## headings with tables where appropriate.`,

  "jtbd-extractor": `You are a Jobs-to-Be-Done researcher. Analyze the content and extract JTBD patterns.
For each job: Job Statement (When I... I want to... So I can...), Functional Job, Emotional Job, Social Job, Current Solutions, Pain Points, Desired Outcomes, Hiring Criteria, Firing Triggers.
Extract 5-8 distinct jobs. Use ## headings.`,

  "persuasion-map": `You are a persuasion psychology expert. Map all persuasion techniques and influence patterns in the content.
Categories: Cialdini Principles (reciprocity, commitment, social proof, authority, liking, scarcity), Cognitive Biases Used, Emotional Triggers, Logical Arguments, Narrative Techniques, Call-to-Action Patterns.
For each: technique name, example from text, effectiveness rating, ethical considerations.
Use ## headings.`,

  "newsletter-generator": `You are a newsletter content architect. Transform the content into a ready-to-send newsletter edition.
Include: Subject Line (3 variations), Preview Text, Newsletter Title, Opening Hook (2-3 sentences), Main Story (500-700 words), Key Insights Box (3-5 bullets), Actionable Takeaway, Resource Recommendations (3), Reader Question/Poll, CTA, P.S. Line.
Use ## headings.`,

  "workshop-designer": `You are a workshop/webinar designer. Create a complete workshop plan from the content.
Include: Workshop Title, Learning Outcomes (3-5), Duration & Format, Agenda with Timings, Facilitator Notes per Section, Interactive Exercises (3-5), Discussion Questions, Handout Content, Pre-Workshop Survey, Post-Workshop Evaluation, Follow-Up Sequence.
Use ## headings.`,

  "case-study-builder": `You are a case study writer. Transform the content into a compelling case study.
Structure: Title (Result-Driven), Executive Summary, Client/Subject Profile, Challenge/Problem Statement, Solution Approach, Implementation Steps, Results (with metrics/data), Key Learnings, Testimonial Suggestions, Visual Layout Recommendations.
Write in third person, data-driven narrative. 1500-2000 words. Use ## headings.`,

  "brand-voice": `You are a brand voice analyst. Analyze the content and define a complete brand voice guide.
Include: Voice Archetype (from 12 archetypes), Tone Dimensions (formal-casual, serious-playful, etc.), Vocabulary Preferences (words to use/avoid), Sentence Structure Patterns, Content Pillars (3-5), Brand Personality Traits, Dos and Don'ts (10 each), Example Rewrites (before/after), Platform-Specific Adjustments.
Use ## headings.`,

  "pricing-strategy": `You are a pricing strategist. Based on the content, design a complete pricing architecture.
Include: Value Metric Analysis, Pricing Model Recommendation (subscription, tiered, usage, freemium), Tier Structure (3-4 tiers with features), Price Points (using Root2 principle: digit sum = 2), Anchor Pricing Strategy, Discount Policy, Upsell/Cross-sell Matrix, Revenue Projections, Competitor Price Positioning.
Use ## headings with tables.`,

  "funnel-architect": `You are a marketing funnel architect. Design a complete conversion funnel from the content.
Include: Funnel Type (webinar, challenge, tripwire, etc.), TOFU Content (3 pieces), MOFU Lead Magnets (2), BOFU Offers, Landing Page Copy for Each Stage, Email Sequences Between Stages, Retargeting Ad Copy, Conversion Metrics to Track, A/B Test Suggestions.
Use ## headings.`,

  "thought-leadership": `You are a thought leadership content strategist. Extract and amplify thought leadership positioning from the content.
Include: Core Thesis Statement, Contrarian Takes (3-5), Industry Predictions (3), Signature Frameworks (name and visualize), Speaking Topics (5), Book Chapter Outline, Keynote Abstract, Media Pitch Angles (3), LinkedIn Article Series Plan (5 articles).
Use ## headings.`,

  "audience-avatar": `You are a customer research specialist. Build detailed audience avatars from the content.
For each avatar (create 2-3): Name & Demographics, Psychographics (values, beliefs, fears, desires), Day-in-the-Life Narrative, Media Consumption Habits, Purchase Decision Process, Objections & Concerns, Messaging that Resonates, Channels to Reach Them, Content Preferences, Trigger Events.
Use ## headings.`,

  // ── Sprint E: 20 Specialized Extractors (Batch 2) ──

  "webinar-script": `You are a webinar scriptwriter. Create a complete 45-60 minute webinar script from the content.
Include: Webinar Title (3 options), Registration Page Copy, Pre-Webinar Email Sequence (3 emails), Full Script with Speaker Notes and Slide Directions, Q&A Preparation (10 anticipated questions with answers), Post-Webinar Follow-Up Sequence (3 emails), Replay Page Copy.
Use ## headings.`,

  "linkedin-strategy": `You are a LinkedIn growth strategist. Transform the content into a 30-day LinkedIn content strategy.
Include: Profile Optimization Suggestions, Content Pillars (3-5), 30-Day Content Calendar (post type, hook, key message per day), 5 Full LinkedIn Posts (hook + body + CTA), Comment Strategy Templates (5), Connection Request Templates (3), Engagement Routine Checklist, Hashtag Strategy, Performance Metrics to Track.
Use ## headings.`,

  "sales-page": `You are a direct response copywriter. Create a complete long-form sales page from the content.
Include: Pre-Headline, Headline (3 variations), Sub-Headline, Opening Story/Hook, Problem Agitation, Solution Introduction, Feature-to-Benefit Mapping, Social Proof Section, Bonuses (3-5), Price Presentation, Guarantee, FAQ (8-10), Final CTA, P.S. Lines (3). Write 3000+ words.
Use ## headings.`,

  "coaching-framework": `You are a coaching methodology designer. Extract and structure coaching frameworks from the content.
Include: Framework Name, Core Philosophy, Assessment Model (intake questions), Phase Structure (3-5 phases with milestones), Session Templates (for each phase), Exercises & Worksheets (5-8), Progress Metrics, Client Transformation Map (before/after), Certification Criteria, Scaling Plan.
Use ## headings.`,

  "podcast-pitch": `You are a podcast booking strategist. Create a complete podcast guesting kit from the content.
Include: Speaker One-Sheet, 3 Episode Angle Pitches (title, description, 3 talking points each), Bio Variations (50-word, 100-word, 250-word), 5 Unique Stories/Anecdotes to Share, Media Kit Highlights, Sample Interview Questions (10), Pitch Email Template (3 variations for different show sizes), Follow-Up Templates.
Use ## headings.`,

  "micro-course": `You are an online course creator. Design a micro-course (5-7 lessons) from the content.
Include: Course Title & Subtitle, Ideal Student Profile, Learning Outcomes (5), Curriculum Outline (5-7 lessons with objectives, content outline 500+ words each, exercises, assignments), Welcome Module Script, Completion Certificate Copy, Course Sales Description, Pricing Recommendation (Root2 compliant).
Use ## headings.`,

  "storytelling-vault": `You are a narrative strategist. Extract and craft reusable stories from the content.
For each story (extract 8-12): Story Title, Story Type (origin, transformation, failure, customer, vision, analogy), The Setup (context), The Conflict (tension), The Resolution (payoff), Moral/Lesson, Where to Use It (pitch, keynote, post, sales call), Emotional Trigger, Suggested Opening Line.
Use ## headings.`,

  "ad-copy-suite": `You are a performance marketing copywriter. Generate a complete ad copy suite from the content.
Include: Facebook/Meta Ads (5 variations: long, short, story, testimonial, listicle), Google Ads (5 headlines + 3 descriptions), LinkedIn Ads (3 sponsored content + 2 message ads), YouTube Pre-Roll Scripts (15s, 30s, 60s), TikTok/Reels Scripts (3), Retargeting Ad Variations (3), Audience Targeting Recommendations per Platform.
Use ## headings.`,

  "community-playbook": `You are a community building strategist. Design a community launch and growth playbook from the content.
Include: Community Vision & Mission, Platform Recommendation (with pros/cons), Founding Members Strategy (first 100), Content Calendar Template (weekly rhythm), Engagement Rituals (5 recurring events), Onboarding Flow, Moderation Guidelines, Gamification System, Growth Milestones (100, 500, 1000, 5000), Monetization Strategy.
Use ## headings.`,

  "sop-generator": `You are a process documentation specialist. Transform the content into Standard Operating Procedures.
For each SOP (create 3-5): SOP Title, Purpose & Scope, Roles & Responsibilities, Prerequisites, Step-by-Step Procedure (numbered with sub-steps), Decision Points (if/then), Quality Checkpoints, Troubleshooting Guide, Time Estimates, Tools Required, Version History Template.
Use ## headings.`,

  "content-repurposer": `You are a content multiplication engine. Take the content and repurpose it into 15+ formats.
Generate: Twitter/X Thread (10 tweets), LinkedIn Post, Instagram Caption, Blog Post Outline, Email Newsletter, YouTube Short Script, Podcast Episode Notes, Infographic Text Layout, Pinterest Pin Descriptions (3), Reddit Post, Quora Answer, Medium Article Intro, SlideShare Outline, Press Release, Quote Graphics Text (5).
Use ## headings per format.`,

  "negotiation-playbook": `You are a negotiation strategy expert. Extract negotiation principles and create actionable playbooks from the content.
Include: Key Negotiation Principles (5-8), BATNA Analysis Framework, Opening Position Strategies, Concession Patterns, Objection Response Scripts (10), Power Dynamics Assessment, Body Language Cues to Watch, Email Negotiation Templates (3), Closing Techniques (5), Post-Negotiation Follow-Up Protocol.
Use ## headings.`,

  "onboarding-sequence": `You are a customer success architect. Design a complete onboarding flow from the content.
Include: Onboarding Goals & Success Metrics, Welcome Email Sequence (5 emails over 14 days), In-App Checklist (8-10 steps), Tutorial Script for Key Features, Milestone Celebrations, Day 1/3/7/14/30 Touchpoints, Health Score Criteria, At-Risk Intervention Triggers, Expansion Opportunities, Feedback Collection Points.
Use ## headings.`,

  "investor-deck": `You are a startup pitch consultant. Transform the content into investor pitch deck content.
Include: Title Slide Copy, Problem Statement (with data), Solution Overview, Market Size (TAM/SAM/SOM framework), Business Model, Traction & Metrics, Competitive Landscape, Team Slide Talking Points, Financial Projections Narrative, The Ask, Appendix Topics. Write speaker notes for each slide.
Use ## headings.`,

  "book-outline": `You are a non-fiction book architect. Transform the content into a complete book outline.
Include: Book Title (3 options), Subtitle, Back Cover Copy, Author Bio, Table of Contents (12-15 chapters), Chapter Summaries (200-300 words each), Key Stories per Chapter, Research Notes Needed, Introduction Draft (1000 words), Conclusion Draft (800 words), Book Proposal Summary.
Use ## headings.`,

  "crisis-playbook": `You are a crisis communication specialist. Create a crisis response playbook from the content.
Include: Risk Assessment Matrix (likelihood × impact), Scenario Plans (5 crisis types), Response Templates (internal + external), Spokesperson Briefing Notes, Social Media Response Protocols, Press Statement Templates (3), Stakeholder Communication Plan, Recovery Timeline, Reputation Monitoring Checklist, Post-Crisis Review Framework.
Use ## headings.`,

  "partnership-brief": `You are a strategic partnership consultant. Create partnership opportunity briefs from the content.
Include: Partnership Vision, Ideal Partner Profile (3 types), Value Proposition for Partners, Partnership Models (affiliate, JV, co-create, licensing), Outreach Templates (cold email, warm intro, LinkedIn message), Pitch Deck Talking Points, Revenue Split Frameworks, Success Metrics, Partnership Agreement Checklist, Case Study Template.
Use ## headings.`,

  "retention-engine": `You are a customer retention strategist. Design a retention and loyalty system from the content.
Include: Churn Risk Indicators (8-10), Retention Metrics Dashboard Design, Win-Back Email Sequences (3-email for each segment), Loyalty Program Structure (tiers, rewards, gamification), NPS Survey Design, Customer Advisory Board Plan, Re-Engagement Campaigns (3), Upsell/Cross-Sell Triggers, Annual Review Template, Referral Program Design.
Use ## headings.`,

  "speaking-kit": `You are a professional speaking consultant. Create a complete speaker kit from the content.
Include: Speaker Brand Positioning, 5 Signature Talk Topics (title, description, key takeaways, target audience, duration), Keynote Abstract (3 lengths: 50, 150, 500 words), Speaker Bio (3 lengths), Technical Requirements Rider, Fee Structure Recommendations, Event Organizer Pitch Template, Stage Presence Notes, Q&A Preparation (15 questions), Post-Event Follow-Up Sequence.
Use ## headings.`,

  "assessment-builder": `You are a psychometric assessment designer. Create a self-assessment tool from the content.
Include: Assessment Title & Purpose, 25-30 Questions (Likert scale, multiple choice mix), Scoring Methodology, 4-5 Result Profiles/Archetypes (name, description, strengths, growth areas, recommended resources), Results Interpretation Guide, Follow-Up Action Plan per Profile, Lead Magnet Integration Strategy, Email Sequence per Profile (3 emails).
Use ## headings.`,
};


// Map service keys to artifact types
const SERVICE_ARTIFACT_TYPE: Record<string, string> = {
  "insight-extractor": "document",
  "framework-detector": "document",
  "question-engine": "document",
  "quote-extractor": "document",
  "prompt-generator": "prompt",
  "market-research": "report",
  "course-generator": "course",
  "content-classifier": "document",
  "strategy-builder": "strategy",
  "argument-mapper": "document",
  "profile-extractor": "profile",
  "prompt-forge": "prompt",
  "hook-generator": "document",
  "objection-handler": "document",
  "email-sequence": "document",
  "social-carousel": "document",
  "seo-article": "document",
  "podcast-shownotes": "document",
  "video-script": "document",
  "lead-magnet": "document",
  "swipe-file": "document",
  "competitor-analysis": "report",
  "jtbd-extractor": "document",
  "persuasion-map": "document",
  "newsletter-generator": "document",
  "workshop-designer": "document",
  "case-study-builder": "document",
  "brand-voice": "document",
  "pricing-strategy": "report",
  "funnel-architect": "strategy",
  "thought-leadership": "document",
  "audience-avatar": "document",
  // Batch 2
  "webinar-script": "document",
  "linkedin-strategy": "strategy",
  "sales-page": "document",
  "coaching-framework": "document",
  "podcast-pitch": "document",
  "micro-course": "course",
  "storytelling-vault": "document",
  "ad-copy-suite": "document",
  "community-playbook": "strategy",
  "sop-generator": "document",
  "content-repurposer": "document",
  "negotiation-playbook": "document",
  "onboarding-sequence": "strategy",
  "investor-deck": "document",
  "book-outline": "document",
  "crisis-playbook": "strategy",
  "partnership-brief": "document",
  "retention-engine": "strategy",
  "speaking-kit": "document",
  "assessment-builder": "document",
};

// Valid service keys for input validation
const VALID_SERVICE_KEYS = new Set(Object.keys(SERVICE_PROMPTS));

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // per hour
const RATE_WINDOW = 3600_000; // 1 hour in ms

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── AUTHENTICATE via JWT — derive user_id from token ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // CRITICAL: Always derive user_id from JWT, never from request body
    const user_id = caller.id;

    // ── Rate limit check ──
    if (!checkRateLimit(user_id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (20 service runs/hour)" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const InputSchema = z.object({
      job_id: z.string().uuid("Invalid job_id"),
      service_key: z.string().min(1, "Missing service_key").max(100),
      neuron_id: z.number().int().optional(),
      inputs: z.record(z.string().max(50_000, "Input value too long")).optional(),
    });

    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { job_id, service_key, neuron_id, inputs } = parsed.data;

    // ── Update job to running, track retry count ──
    const { data: currentJob } = await supabase
      .from("neuron_jobs")
      .select("retry_count, max_retries, dead_letter")
      .eq("id", job_id)
      .single();

    if (currentJob?.dead_letter) {
      return new Response(JSON.stringify({ error: "Job is in dead letter queue" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("neuron_jobs").update({ 
      status: "running",
      scheduled_at: new Date().toISOString(),
    }).eq("id", job_id);

    // ── Fetch service cost ──
    const { data: service } = await supabase
      .from("service_catalog").select("credits_cost, name").eq("service_key", service_key).single();

    if (!service) {
      await supabase.from("neuron_jobs").update({ status: "failed", completed_at: new Date().toISOString(), result: { error: "Service not found" } }).eq("id", job_id);
      return new Response(JSON.stringify({ error: "Service not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Spend credits atomically via SECURITY DEFINER function ──
    const { data: spent } = await supabase.rpc("spend_credits", {
      _user_id: user_id,
      _amount: service.credits_cost,
      _description: `SPEND: ${service.name}`,
      _job_id: job_id,
    });

    if (!spent) {
      await supabase.from("neuron_jobs").update({
        status: "failed", completed_at: new Date().toISOString(),
        result: { error: "RC.CREDITS.INSUFFICIENT", reason: `Need ${service.credits_cost} credits` },
      }).eq("id", job_id);

      return new Response(JSON.stringify({ error: "Insufficient credits", reason_code: "RC.CREDITS.INSUFFICIENT" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Execute AI pipeline ──
    const systemPrompt = SERVICE_PROMPTS[service_key] || SERVICE_PROMPTS["insight-extractor"];
    const inputText = Object.entries(inputs || {})
      .filter(([_, v]) => v && String(v).trim())
      .map(([k, v]) => `${k}: ${v}`).join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: inputText || "Analyze the provided context and produce comprehensive results." },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      // Refund credits on AI failure via atomic function
      await supabase.rpc("add_credits", {
        _user_id: user_id,
        _amount: service.credits_cost,
        _description: `REFUND: ${service.name} — AI error ${response.status}`,
        _type: "refund",
      });

      // Mark failed with error message for retry system
      const retryCount = currentJob?.retry_count || 0;
      const maxRetries = currentJob?.max_retries || 3;
      const shouldRetry = retryCount < maxRetries && response.status >= 500;

      await supabase.from("neuron_jobs").update({
        status: "failed", 
        completed_at: shouldRetry ? null : new Date().toISOString(),
        error_message: `AI error: ${response.status}`,
        result: { error: `AI error: ${response.status}` },
        ...(shouldRetry ? {
          retry_count: retryCount + 1,
          scheduled_at: new Date(Date.now() + retryCount * 30000).toISOString(),
        } : {
          dead_letter: retryCount >= maxRetries,
        }),
      }).eq("id", job_id);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Credits refunded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Credits refunded." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service unavailable. Credits refunded." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Stream response, collect for auditing + artifact generation ──
    const [clientStream, auditStream] = response.body!.tee();

    const finalizeJob = async () => {
      try {
        const reader = auditStream.getReader();
        const decoder = new TextDecoder();
        let fullResult = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nlIndex: number;
          while ((nlIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nlIndex);
            buffer = buffer.slice(nlIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResult += content;
            } catch { /* partial */ }
          }
        }

        // Mark job completed
        await supabase.from("neuron_jobs").update({
          status: "completed", completed_at: new Date().toISOString(),
          result: { content: fullResult, credits_spent: service.credits_cost, service: service.name },
        }).eq("id", job_id);

        // Save as neuron block
        if (neuron_id && fullResult) {
          await supabase.from("neuron_blocks").insert({
            neuron_id, type: "markdown", content: fullResult.slice(0, 100_000), position: 0, execution_mode: "passive",
          });
          await supabase.from("neurons").update({
            status: "published", lifecycle: "structured", updated_at: new Date().toISOString(),
          }).eq("id", neuron_id);
        }

        // ── AUTO-GENERATE ARTIFACT ──
        if (fullResult && fullResult.length > 50) {
          const artifactType = SERVICE_ARTIFACT_TYPE[service_key] || "document";
          const artifactTitle = `${service.name} — ${new Date().toLocaleDateString("ro-RO")}`;

          const { data: artifact } = await supabase.from("artifacts").insert({
            author_id: user_id,
            title: artifactTitle,
            artifact_type: artifactType,
            content: fullResult.slice(0, 200_000),
            format: "markdown",
            status: "generated",
            service_key,
            job_id,
            tags: [service_key, artifactType],
            metadata: { credits_spent: service.credits_cost, neuron_id },
          }).select("id").single();

          // Link artifact to source neuron
          if (artifact && neuron_id) {
            await supabase.from("artifact_neurons").insert({
              artifact_id: artifact.id,
              neuron_id,
              relation_type: "source",
            });
          }
        }
      } catch (e) {
        console.error("Finalize job error:", e);
        await supabase.from("neuron_jobs").update({
          status: "completed", completed_at: new Date().toISOString(),
          result: { error: "Finalization error", partial: true },
        }).eq("id", job_id);
      }
    };

    finalizeJob();

    return new Response(clientStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("run-service error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
