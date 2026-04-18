import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";
import { loadPrompt } from "../_shared/prompt-loader.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { reportError } from "../_shared/error-reporter.ts";
import { buildBoundedMessages } from "../_shared/prompt-boundary.ts";

const logStep = (step: string, details?: unknown) => {
  console.log(`[ANALYZE-PSYCHOLOGY] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);
};

// ── 10-Module Pipeline Definition ──
const PSYCHOLOGY_MODULES = [
  {
    id: "big_five",
    name: "Big Five Personality",
    prompts: [
      "Analyze openness to experience: intellectual curiosity, imagination, preference for novelty. Score 0-100 with confidence interval.",
      "Analyze conscientiousness: organization, self-discipline, goal orientation, planning behavior. Score 0-100 with confidence interval.",
      "Analyze extraversion: social energy, assertiveness, positive emotions, talkativeness. Score 0-100 with confidence interval.",
      "Analyze agreeableness: cooperation, trust, empathy, social harmony. Score 0-100 with confidence interval.",
      "Analyze neuroticism: emotional instability, anxiety, moodiness, stress reactivity. Score 0-100 with confidence interval.",
    ],
  },
  {
    id: "liwc_metrics",
    name: "LIWC Linguistic Analysis (Pennebaker)",
    prompts: [
      "Measure analytical thinking: logical reasoning markers, causal words, insight words, certainty. Score 0-100.",
      "Measure emotional tone: positive vs negative emotion words, affective intensity. Score 0-100 (50=neutral, 100=very positive).",
      "Measure authenticity: self-referential honesty, first-person pronouns, hedging absence. Score 0-100.",
      "Measure clout/authority: confidence markers, we-pronouns, social hierarchy. Score 0-100.",
    ],
  },
  {
    id: "cognitive_style",
    name: "Cognitive Style Analysis",
    prompts: [
      "Analyze cognitive complexity: sentence structure diversity, vocabulary breadth, abstract vs concrete language, multi-perspective thinking. Score 0-100.",
      "Analyze information processing style: sequential vs holistic, detail-oriented vs big-picture, data-driven vs intuitive. Classify and score.",
      "Analyze reasoning patterns: deductive vs inductive, analogical thinking, causal chains, hypothetical reasoning frequency.",
      "Analyze learning style markers: visual references, auditory cues, kinesthetic language, theoretical vs practical orientation.",
    ],
  },
  {
    id: "emotional_drivers",
    name: "Emotional Intelligence & Drivers",
    prompts: [
      "Analyze emotional intelligence: self-awareness markers, empathy expressions, emotion regulation language. Score 0-100 with sub-dimensions.",
      "Identify primary emotional drivers: achievement, affiliation, power, autonomy, security. Rank and score each 0-100.",
      "Analyze emotional vocabulary: diversity, specificity, intensity patterns. Compute emotional granularity score.",
      "Measure emotional contagion potential: storytelling emotional arcs, empathy triggers, emotional metaphors.",
    ],
  },
  {
    id: "narrative_patterns",
    name: "Narrative & Storytelling Patterns",
    prompts: [
      "Identify narrative archetypes used: hero's journey, rags-to-riches, overcoming monster, quest, rebirth, comedy, tragedy. Frequency and effectiveness.",
      "Analyze story structure: beginning-middle-end patterns, tension building, resolution patterns, anecdote frequency per 1000 words.",
      "Measure narrative coherence: temporal markers, causal connectors, character consistency, theme development.",
      "Identify metaphor patterns: conceptual metaphors used, metaphor density, originality vs conventional metaphors.",
      "Analyze rhetorical devices: repetition, tricolon, antithesis, rhetorical questions, contrast patterns.",
    ],
  },
  {
    id: "communication_profile",
    name: "Communication Profile",
    prompts: [
      "Classify communication style: Directive, Collaborative, Analytical, Expressive, or Supportive. Provide percentage mix.",
      "Analyze persuasion approach: Logical (data/evidence), Emotional (stories/values), Authority (credentials/expertise), Social Proof (examples/testimonials), Storytelling (narratives). Primary and secondary.",
      "Measure dominance patterns: interruption markers, topic control, directive language, hedging frequency. Score 0-100.",
      "Analyze listening indicators: acknowledgment language, paraphrasing, question asking patterns, building on others' ideas.",
    ],
  },
  {
    id: "leadership_profile",
    name: "Leadership & Decision Style",
    prompts: [
      "Classify leadership style: Visionary, Democratic, Coaching, Commanding, Affiliative, Pacesetting. Primary and mix percentages.",
      "Analyze decision-making style: Analytical (data-heavy), Intuitive (gut-feeling), Directive (quick/decisive), Conceptual (creative/broad). Score each 0-100.",
      "Measure risk tolerance: risk-seeking language, uncertainty comfort, hedging patterns, bold vs cautious proposals. Classify: Risk-Averse, Moderate, Risk-Seeking.",
      "Analyze influence strategy: pull vs push, collaborative vs directive, evidence-based vs vision-based.",
    ],
  },
  {
    id: "lexical_analysis",
    name: "Lexical & Structural Analysis",
    prompts: [
      "Compute lexical metrics: average sentence length, vocabulary diversity (type-token ratio), Flesch-Kincaid readability, jargon density.",
      "Analyze pronoun usage: I/me ratio (self-focus), we/us ratio (collective), you ratio (audience engagement), they ratio (distancing).",
      "Measure word category ratios: emotion words, cognitive words, certainty words, tentative words, action words per 100 words.",
      "Analyze question patterns: open vs closed, rhetorical vs genuine, Socratic method usage, inquiry depth.",
    ],
  },
  {
    id: "value_system",
    name: "Values & Belief System",
    prompts: [
      "Identify core values from language: achievement, benevolence, conformity, hedonism, power, security, self-direction, stimulation, tradition, universalism. Rank top 5.",
      "Analyze moral foundations: care/harm, fairness/cheating, loyalty/betrayal, authority/subversion, sanctity/degradation. Score each 0-100.",
      "Identify worldview markers: growth vs fixed mindset, internal vs external locus of control, optimistic vs pessimistic orientation.",
    ],
  },
  {
    id: "expertise_mapping",
    name: "Expertise & Knowledge Mapping",
    prompts: [
      "Map expertise domains mentioned: identify each domain, assess depth (surface/intermediate/expert), frequency of domain-specific jargon.",
      "Analyze teaching/explaining patterns: simplification ability, analogy quality, scaffolding techniques, example diversity.",
      "Measure authority markers: credential references, experience claims, certainty language in domain-specific contexts, hedging in unfamiliar domains.",
    ],
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");
    const userId = userData.user.id;

    // Rate limit (user-based, post-auth)
    const rateLimited = await rateLimitGuard(userId, req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;
    logStep("Authenticated", { userId });

    const PsychSchema = z.object({
      guest_profile_id: z.string().uuid("Invalid guest_profile_id format"),
      tier: z.enum(["free", "premium"]).default("free"),
    });
    const parsed = PsychSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { guest_profile_id, tier } = parsed.data;

    // Regime enforcement
    const regime = await getRegimeConfig("analyze-psychology");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: "Service blocked", reason: blockReason, regime: regime.regime }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const isDryRun = regime.dryRun || regime.regime === "simulation";

    const { data: guest, error: guestError } = await supabase
      .from("guest_profiles")
      .select("*")
      .eq("id", guest_profile_id)
      .eq("author_id", userId)
      .single();

    if (guestError || !guest) throw new Error("Guest profile not found or access denied");
    logStep("Guest loaded", { name: guest.full_name });

    // Gather transcript text
    let transcriptText = "";
    if (guest.episode_ids && guest.episode_ids.length > 0) {
      const { data: episodes } = await supabase
        .from("episodes")
        .select("transcript")
        .in("id", guest.episode_ids)
        .not("transcript", "is", null);
      if (episodes) {
        transcriptText = episodes.map((e: { transcript: string }) => e.transcript).join("\n\n");
      }
    }

    const analysisText = [
      transcriptText,
      guest.bio || "",
      ...(guest.key_quotes || []),
    ].filter(Boolean).join("\n\n");

    if (analysisText.length < 100) {
      throw new Error("Insufficient text for psychological analysis (minimum 100 characters)");
    }

    logStep("Text gathered", { length: analysisText.length });

    if (isDryRun) {
      logStep("DRY RUN — skipping AI call");
      return new Response(JSON.stringify({ success: false, dry_run: true, regime: regime.regime }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    // ── Select modules based on tier ──
    const modulesToRun = tier === "premium" ? PSYCHOLOGY_MODULES : PSYCHOLOGY_MODULES.slice(0, 4);
    const totalPrompts = modulesToRun.reduce((sum, m) => sum + m.prompts.length, 0);
    logStep("Pipeline config", { tier, modules: modulesToRun.length, prompts: totalPrompts });

    // ─── F-006: BILLING RESERVATION (audit hard finding) ───
    // Pricing: 2 NEURONI per module (free=4 modules=8N, premium=10 modules=20N)
    const reserveAmount = modulesToRun.length * 2;
    const billingJobId = crypto.randomUUID();
    const { data: reserveOk, error: reserveErr } = await supabase
      .rpc("wallet_reserve", { _user_id: userId, _amount: reserveAmount, _job_id: billingJobId, _description: `analyze-psychology[${tier}]` });
    if (reserveErr || reserveOk === false) {
      logStep("Insufficient credits", { needed: reserveAmount, error: reserveErr?.message });
      return new Response(JSON.stringify({
        error: "Insufficient credits",
        needed: reserveAmount,
        message: `This analysis requires ${reserveAmount} NEURONS. Top up your balance.`,
      }), { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    logStep("Credits reserved", { amount: reserveAmount, billingJobId });

    // ── Run pipeline: batch modules, each module's prompts run as a single mega-prompt ──
    const textSlice = analysisText.slice(0, tier === "premium" ? 25000 : 15000);
    const moduleResults: Record<string, any> = {};

    const BATCH_SIZE = 3;
    for (let i = 0; i < modulesToRun.length; i += BATCH_SIZE) {
      const batch = modulesToRun.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (mod) => {
        const systemPrompt = `You are an expert psycholinguistic analyst performing the "${mod.name}" module.

Analyze the user-provided text and answer ALL of these analysis prompts. Return a single JSON object with your findings.

ANALYSIS PROMPTS:
${mod.prompts.map((p, idx) => `${idx + 1}. ${p}`).join("\n")}

Return a comprehensive JSON object with scores (0-100), classifications, and confidence intervals where requested. Include a "confidence" field (0-1) for the overall module.`;

        const { messages: boundedMessages } = buildBoundedMessages({
          system: systemPrompt,
          userParts: [{ label: "text_to_analyze", content: textSlice, maxLen: 25000 }],
          alertSourceFn: "analyze-psychology",
          userId: user.id,
        });

        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${lovableApiKey}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: boundedMessages,
              temperature: 0.3,
              response_format: { type: "json_object" },
            }),
          });

          if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            logStep(`Module ${mod.id} failed`, { error: errText });
            return { id: mod.id, result: null, error: errText };
          }

          const aiResult = await aiResponse.json();
          const content = aiResult.choices?.[0]?.message?.content;
          if (!content) return { id: mod.id, result: null, error: "Empty response" };
          
          return { id: mod.id, result: JSON.parse(content), error: null };
        } catch (err) {
          logStep(`Module ${mod.id} error`, { error: String(err) });
          return { id: mod.id, result: null, error: String(err) };
        }
      }));

      for (const br of batchResults) {
        if (br.result) moduleResults[br.id] = br.result;
      }
    }

    logStep("Pipeline complete", { modulesCompleted: Object.keys(moduleResults).length });

    // ── Synthesize final profile ──
    const bigFive = moduleResults.big_five || {};
    const liwc = moduleResults.liwc_metrics || {};
    const cognitive = moduleResults.cognitive_style || {};
    const emotional = moduleResults.emotional_drivers || {};
    const narrative = moduleResults.narrative_patterns || {};
    const comm = moduleResults.communication_profile || {};
    const leadership = moduleResults.leadership_profile || {};
    const lexical = moduleResults.lexical_analysis || {};
    const values = moduleResults.value_system || {};
    const expertise = moduleResults.expertise_mapping || {};

    // Extract scores with fallbacks
    const extractScore = (obj: any, ...paths: string[]): number => {
      for (const path of paths) {
        const parts = path.split(".");
        let val: any = obj;
        for (const p of parts) {
          val = val?.[p];
        }
        if (typeof val === "number") return Math.min(100, Math.max(0, val));
      }
      return 50;
    };

    const profileData = {
      guest_profile_id,
      author_id: userId,
      openness: extractScore(bigFive, "openness", "openness_to_experience.score", "scores.openness"),
      conscientiousness: extractScore(bigFive, "conscientiousness", "conscientiousness.score", "scores.conscientiousness"),
      extraversion: extractScore(bigFive, "extraversion", "extraversion.score", "scores.extraversion"),
      agreeableness: extractScore(bigFive, "agreeableness", "agreeableness.score", "scores.agreeableness"),
      neuroticism: extractScore(bigFive, "neuroticism", "neuroticism.score", "scores.neuroticism"),
      analytical_thinking: extractScore(liwc, "analytical_thinking", "analytical.score", "scores.analytical_thinking"),
      emotional_tone: extractScore(liwc, "emotional_tone", "emotional.score", "scores.emotional_tone"),
      authenticity: extractScore(liwc, "authenticity", "authenticity.score", "scores.authenticity"),
      clout: extractScore(liwc, "clout", "clout.score", "scores.clout"),
      dominance: extractScore(comm, "dominance", "dominance.score", "scores.dominance"),
      empathy: extractScore(emotional, "empathy", "emotional_intelligence.empathy", "scores.empathy"),
      cognitive_complexity: extractScore(cognitive, "cognitive_complexity", "complexity.score", "scores.cognitive_complexity"),
      confidence_level: extractScore(comm, "confidence_level", "confidence.score", "scores.confidence"),
      communication_style: comm.communication_style || comm.style || comm.primary_style || null,
      leadership_style: leadership.leadership_style || leadership.primary || leadership.style || null,
      decision_style: leadership.decision_style || leadership.decision_making || null,
      persuasion_approach: comm.persuasion_approach || comm.persuasion || null,
      risk_tolerance: leadership.risk_tolerance || leadership.risk || null,
      lexical_features: lexical || {},
      analysis_metadata: {
        text_length: analysisText.length,
        analyzed_at: new Date().toISOString(),
        episodes_count: guest.episode_ids?.length || 0,
        tier,
        modules_completed: Object.keys(moduleResults).length,
        total_modules: modulesToRun.length,
        total_prompts: totalPrompts,
        pipeline_version: "v2-multi-module",
        raw_modules: tier === "premium" ? moduleResults : undefined,
        cognitive_style: cognitive,
        emotional_drivers: emotional,
        narrative_patterns: narrative,
        value_system: values,
        expertise_mapping: expertise,
      },
      model_version: `v2-${tier}-gemini-flash`,
    };

    const { error: upsertError } = await supabase
      .from("psychological_profiles")
      .upsert(profileData as any, { onConflict: "guest_profile_id" });

    if (upsertError) throw new Error(`Save failed: ${upsertError.message}`);
    logStep("Profile saved");

    // ─── F-006: SETTLE billing on success ───
    const completedModules = Object.keys(moduleResults).length;
    const expectedModules = modulesToRun.length;
    if (completedModules < expectedModules) {
      // Partial run — refund unused modules
      const unusedAmount = (expectedModules - completedModules) * 2;
      await supabase.rpc("wallet_refund", { _user_id: userId, _amount: unusedAmount, _job_id: billingJobId, _description: `analyze-psychology partial refund (${expectedModules - completedModules}/${expectedModules})` });
      logStep("Partial refund", { refunded: unusedAmount });
    }
    const settledAmount = completedModules * 2;
    await supabase.rpc("wallet_settle", { _user_id: userId, _amount: settledAmount, _job_id: billingJobId, _description: `analyze-psychology[${tier}] ${completedModules}/${expectedModules} modules` });
    logStep("Credits settled", { amount: settledAmount });

    return new Response(JSON.stringify({
      success: true,
      tier,
      modules_completed: completedModules,
      credits_charged: settledAmount,
      profile: profileData,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    // ─── F-006: REFUND on failure (best-effort, billingJobId may be undefined if error before reservation) ───
    try {
      // @ts-ignore — variables defined in try block; refund only if reservation happened
      if (typeof billingJobId !== "undefined" && typeof userId !== "undefined" && typeof reserveAmount !== "undefined") {
        // @ts-ignore
        await supabase.rpc("wallet_refund", { _user_id: userId, _amount: reserveAmount, _job_id: billingJobId, _description: `analyze-psychology failed: ${msg.slice(0, 200)}` });
        logStep("Reservation refunded due to error");
      }
    } catch (refundErr) {
      logStep("REFUND FAILED", { error: String(refundErr) });
      // Wave 4 — refund failure is CRITICAL (user charged, no result)
      await reportError(refundErr, {
        functionName: "analyze-psychology",
        alert: {
          severity: "critical",
          serviceKey: "billing-refund",
          impactScope: "user charged but pipeline failed and refund did not execute",
          recommendedAction: "Manually issue wallet_refund RPC for affected billingJobId.",
        },
      });
    }
    // Wave 4 — proactive alerting (HIGH: paid AI pipeline)
    await reportError(error, {
      functionName: "analyze-psychology",
      alert: {
        severity: "high",
        serviceKey: "psychology-analysis",
        impactScope: "psychology module pipeline (8 modules)",
        recommendedAction: "Check Lovable AI Gateway status and module prompt validity.",
      },
    });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
