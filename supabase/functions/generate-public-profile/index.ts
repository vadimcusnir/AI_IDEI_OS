/**
 * generate-public-profile — Autonomous Intelligence Profile Generator v2
 * 
 * Full pipeline: job lifecycle → credit reserve → signal extraction → AI synthesis 
 * → quality gate → PII scrub → store draft → marketplace asset → settle credits
 * 
 * Uses Lovable AI (Gemini Flash). No external API key needed.
 */
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PROFILE_COST_NEURONS = 350;
const QUALITY_THRESHOLD = 0.65;

interface RequestBody {
  episode_id?: string;
  person_name: string;
  profile_type: "public_figure" | "local_figure" | "anonymized_client";
  source_type: "podcast" | "interview" | "conversation";
  source_ref?: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let jobId: string | null = null;
  let userId: string | null = null;

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");
    userId = user.id;

    // ── Parse & Validate Input ──
    const body: RequestBody = await req.json();
    if (!body.person_name?.trim()) throw new Error("person_name required");
    if (!["public_figure", "local_figure", "anonymized_client"].includes(body.profile_type)) {
      throw new Error("Invalid profile_type");
    }
    if (!["podcast", "interview", "conversation"].includes(body.source_type)) {
      throw new Error("Invalid source_type");
    }

    // ── Step 0: Create Job ──
    const { data: job, error: jobErr } = await db.from("profile_jobs").insert({
      user_id: userId,
      job_type: "generate",
      status: "created",
      input_params: body,
      credits_cost: PROFILE_COST_NEURONS,
    }).select("id").single();

    if (jobErr || !job) throw new Error("Failed to create job");
    jobId = job.id;

    // ── Step 0.5: Reserve Credits ──
    const { data: reserveResult } = await db.rpc("reserve_neurons", {
      p_user_id: userId,
      p_amount: PROFILE_COST_NEURONS,
      p_reason: `Profile generation: ${body.person_name}`,
    });

    if (!reserveResult) {
      await updateJob(db, jobId, "failed", null, "Insufficient credits");
      throw new Error(`Insufficient credits. Need ${PROFILE_COST_NEURONS}N`);
    }

    // Mark job running
    await updateJob(db, jobId, "running");
    await db.from("profile_jobs").update({ started_at: new Date().toISOString() }).eq("id", jobId);

    // ── Step 1: Extract Signals from Neurons ──
    let neurons: { id: number; title: string; content_category: string; score: number }[] = [];
    let transcript = "";

    if (body.episode_id) {
      const { data: episode } = await db
        .from("episodes")
        .select("transcript, title, duration_seconds, source_url")
        .eq("id", body.episode_id)
        .eq("author_id", userId)
        .single();

      if (episode?.transcript) {
        transcript = episode.transcript.slice(0, 15000);
      }

      const { data: epNeurons } = await db
        .from("neurons")
        .select("id, title, content_category, score")
        .eq("episode_id", body.episode_id)
        .eq("author_id", userId)
        .order("score", { ascending: false })
        .limit(50);

      neurons = epNeurons || [];
    }

    // Neuron blocks
    let neuronContents: { neuron_id: number; type: string; content: string }[] = [];
    if (neurons.length > 0) {
      const { data: blocks } = await db
        .from("neuron_blocks")
        .select("neuron_id, type, content")
        .in("neuron_id", neurons.map(n => n.id))
        .in("type", ["insight", "pattern", "framework", "concept", "strategy"])
        .limit(100);
      neuronContents = blocks || [];
    }

    // ── Step 2: AI Synthesis ──
    const signalBundle = buildSignalBundle(neurons, neuronContents, transcript);
    const isAnonymized = body.profile_type === "anonymized_client";
    const personRef = isAnonymized ? "Subject (anonymized)" : body.person_name;

    const synthesisPrompt = buildSynthesisPrompt(personRef, signalBundle);
    const aiResponse = await callLovableAI(synthesisPrompt);

    let profileData;
    try {
      const cleaned = aiResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      profileData = JSON.parse(cleaned);
    } catch {
      await releaseCredits(db, userId, PROFILE_COST_NEURONS);
      await updateJob(db, jobId, "failed", null, "AI synthesis produced invalid output");
      throw new Error("AI synthesis produced invalid output");
    }

    // ── Step 3: Quality Gate ──
    const qualityScore = computeQualityScore(profileData, neurons.length, transcript.length);
    if (qualityScore.overall < QUALITY_THRESHOLD) {
      await releaseCredits(db, userId, PROFILE_COST_NEURONS);
      await updateJob(db, jobId, "failed", { quality: qualityScore }, `Quality below threshold: ${qualityScore.overall.toFixed(2)}`);
      throw new Error(`Profile quality ${qualityScore.overall.toFixed(2)} below ${QUALITY_THRESHOLD} threshold. Add more source material.`);
    }

    // ── Step 4: PII Scrubbing ──
    if (isAnonymized) {
      profileData = scrubPII(profileData, body.person_name);
    }

    // ── Step 5: Store Profile as Draft ──
    const slug = generateSlug(isAnonymized ? `profile-${Date.now()}` : body.person_name);

    const { data: profile, error: insertErr } = await db
      .from("intelligence_profiles")
      .insert({
        person_name: isAnonymized ? "Anonymous Profile" : body.person_name.trim(),
        profile_type: body.profile_type,
        source_type: body.source_type,
        source_ref: body.source_ref || "N/A",
        transcript_ref: body.episode_id || null,
        public_slug: slug,
        extracted_indicators: profileData.indicators || [],
        cognitive_patterns: profileData.patterns || [],
        synthesis_text: profileData.summary || "",
        visibility_status: "draft",
        risk_flag: isAnonymized ? "medium" : "low",
        consent_required: isAnonymized,
        created_by: userId,
      })
      .select("id")
      .single();

    if (insertErr || !profile) {
      await releaseCredits(db, userId, PROFILE_COST_NEURONS);
      await updateJob(db, jobId, "failed", null, insertErr?.message);
      throw new Error(insertErr?.message || "Failed to create profile");
    }

    // ── Parallel: public subset, signals, version, scores, artifact, audit, state ──
    const signals = extractSignals(profileData, profile.id);

    await Promise.all([
      // Public subset
      db.from("intelligence_profile_public").insert({
        profile_id: profile.id,
        public_indicators: profileData.indicators || [],
        public_patterns: profileData.patterns || [],
        public_summary: profileData.summary || null,
        meta_title: `${isAnonymized ? "Anonymous Profile" : body.person_name} — Analysis`,
        meta_description: `Observational analysis based on ${body.source_type} material.`,
        json_ld: buildJsonLd(body, slug, isAnonymized),
      }),
      // Signals
      signals.length > 0 ? db.from("profile_signals").insert(signals) : Promise.resolve(),
      // Version snapshot
      db.from("profile_versions").insert({
        profile_id: profile.id,
        version: 1,
        data_snapshot: profileData,
        change_summary: "Initial AI synthesis",
        created_by: userId,
      }),
      // Quality scores
      db.from("profile_scores").insert({
        profile_id: profile.id,
        data_volume: qualityScore.data_volume,
        consistency: qualityScore.consistency,
        prediction_accuracy: qualityScore.prediction_accuracy,
        validation_score: 0,
        certainty: qualityScore.certainty,
        overall: qualityScore.overall,
      }),
      // Profile artifact
      db.from("profile_artifacts").insert({
        profile_id: profile.id,
        job_id: jobId,
        artifact_type: "profile_snapshot",
        content: profileData,
        format: "json",
        title: `Profile: ${isAnonymized ? "Anonymous" : body.person_name}`,
        created_by: userId,
      }),
      // Audit log
      db.from("profile_audit_log").insert({
        profile_id: profile.id,
        action: "generated",
        actor: userId,
        details: {
          source: body.episode_id ? "episode" : "manual",
          neuron_count: neurons.length,
          transcript_length: transcript.length,
          signal_count: signals.length,
          quality_score: qualityScore.overall,
          job_id: jobId,
        },
      }),
      // State transition
      db.from("intelligence_profile_state_transitions").insert({
        profile_id: profile.id,
        from_status: null,
        to_status: "draft",
        triggered_by: userId,
        reason_code: "AI_GENERATION",
      }),
    ]);

    // ── Step 6: Auto-draft Marketplace Asset ──
    await db.from("knowledge_assets").insert({
      author_id: userId,
      title: `Intelligence Profile: ${isAnonymized ? "Anonymous" : body.person_name}`,
      description: profileData.summary?.slice(0, 500) || "AI-generated behavioral intelligence profile",
      asset_type: "intelligence_profile",
      price_neurons: Math.round(PROFILE_COST_NEURONS * 1.41),
      neuron_ids: neurons.slice(0, 10).map(n => n.id),
      tags: ["intelligence", "profile", body.profile_type, body.source_type],
      preview_content: profileData.summary?.slice(0, 200) || null,
      is_published: false,
      metadata: { profile_id: profile.id, quality_score: qualityScore.overall },
    });

    // ── Step 7: Settle Credits ──
    await db.rpc("settle_neurons", {
      p_user_id: userId,
      p_amount: PROFILE_COST_NEURONS,
      p_reason: `Profile generated: ${slug}`,
    });

    // ── Complete Job ──
    await updateJob(db, jobId, "completed", {
      profile_id: profile.id,
      slug,
      signal_count: signals.length,
      quality_score: qualityScore.overall,
    });
    await db.from("profile_jobs").update({ completed_at: new Date().toISOString() }).eq("id", jobId);

    return new Response(JSON.stringify({
      success: true,
      profile_id: profile.id,
      slug,
      status: "draft",
      signal_count: signals.length,
      neuron_count: neurons.length,
      quality_score: qualityScore.overall,
      job_id: jobId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    // If we have a job but haven't failed it yet
    if (jobId) {
      await updateJob(db, jobId, "failed", null, (err as Error).message).catch(() => {});
    }
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helper Functions ──

async function updateJob(
  db: ReturnType<typeof createClient>,
  jobId: string,
  status: string,
  outputData?: unknown,
  errorMessage?: string | null,
) {
  const update: Record<string, unknown> = { status };
  if (outputData !== undefined) update.output_data = outputData;
  if (errorMessage) update.error_message = errorMessage;
  await db.from("profile_jobs").update(update).eq("id", jobId);
}

async function releaseCredits(
  db: ReturnType<typeof createClient>,
  userId: string,
  amount: number,
) {
  await db.rpc("release_neurons", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: "Profile generation failed — credits returned",
  }).catch(() => {});
}

function buildSignalBundle(
  neurons: { id: number; title: string; content_category: string; score: number }[],
  blocks: { neuron_id: number; type: string; content: string }[],
  transcript: string
): string {
  let bundle = "";
  if (neurons.length > 0) {
    bundle += "## Extracted Knowledge Signals\n\n";
    for (const n of neurons.slice(0, 30)) {
      const nBlocks = blocks.filter(b => b.neuron_id === n.id);
      bundle += `### ${n.title} (${n.content_category}, score: ${n.score})\n`;
      for (const b of nBlocks) {
        bundle += `- [${b.type}] ${b.content.slice(0, 300)}\n`;
      }
      bundle += "\n";
    }
  }
  if (transcript) {
    bundle += "\n## Transcript Excerpt\n\n" + transcript.slice(0, 5000) + "\n";
  }
  if (!bundle) {
    bundle = "No extracted signals. Generate a basic template profile based on person name only.";
  }
  return bundle;
}

function buildSynthesisPrompt(personRef: string, signalBundle: string): string {
  return `You are an intelligence analyst specializing in behavioral profiling from public material.

Analyze the following extracted knowledge signals and transcript excerpts for: ${personRef}

${signalBundle}

Generate a structured intelligence profile in the following JSON format:
{
  "personality": {
    "dominant_traits": ["trait1", "trait2", "trait3"],
    "communication_style": "description",
    "decision_making": "description"
  },
  "cognition": {
    "thinking_patterns": ["pattern1", "pattern2"],
    "reasoning_style": "description",
    "complexity_preference": "low|medium|high"
  },
  "motivation": {
    "primary_drivers": ["driver1", "driver2"],
    "values": ["value1", "value2"],
    "risk_appetite": "description"
  },
  "behavior": {
    "leadership_style": "description",
    "conflict_approach": "description",
    "influence_tactics": ["tactic1", "tactic2"]
  },
  "predictions": {
    "likely_decisions": ["prediction1"],
    "communication_triggers": ["trigger1"],
    "negotiation_style": "description"
  },
  "indicators": [
    {
      "name": "indicator name",
      "description": "what was observed",
      "example": "specific example from material",
      "limitation": "what this indicator cannot tell us"
    }
  ],
  "patterns": ["pattern description 1", "pattern description 2"],
  "summary": "2-3 paragraph neutral observational synthesis"
}

Rules:
- Be observational, not diagnostic
- Use hedging language ("tends to", "appears to", "suggests")
- Include limitations for each indicator
- If subject is anonymized, remove ALL identifying information
- Focus on behavioral patterns, not personal judgments
- Output ONLY valid JSON, no markdown`;
}

function computeQualityScore(
  profileData: Record<string, unknown>,
  neuronCount: number,
  transcriptLength: number,
): { data_volume: number; consistency: number; prediction_accuracy: number; certainty: number; overall: number } {
  // Data volume: based on input richness
  const dataVolume = Math.min(0.999, (neuronCount / 30) * 0.5 + (transcriptLength > 0 ? 0.3 : 0) + 0.1);

  // Consistency: check if all sections exist
  const sections = ["personality", "cognition", "motivation", "behavior", "predictions"];
  const presentSections = sections.filter(s => profileData[s] && typeof profileData[s] === "object").length;
  const consistency = Math.min(0.999, presentSections / sections.length);

  // Signal density: indicators + patterns
  const indicators = Array.isArray(profileData.indicators) ? profileData.indicators.length : 0;
  const patterns = Array.isArray(profileData.patterns) ? profileData.patterns.length : 0;
  const signalDensity = Math.min(0.999, (indicators + patterns) / 10);

  // Prediction: based on whether predictions section has content
  const predictions = profileData.predictions as Record<string, unknown> | undefined;
  const predictionScore = predictions && Object.keys(predictions).length > 0 ? 0.6 : 0.2;

  const certainty = Math.min(0.999, dataVolume * 0.7 + signalDensity * 0.3);
  const overall = Math.min(0.999, dataVolume * 0.25 + consistency * 0.3 + signalDensity * 0.25 + predictionScore * 0.2);

  return { data_volume: dataVolume, consistency, prediction_accuracy: predictionScore, certainty, overall };
}

function scrubPII(data: Record<string, unknown>, originalName: string): Record<string, unknown> {
  const json = JSON.stringify(data);
  const nameParts = originalName.split(/\s+/);
  let scrubbed = json;
  for (const part of nameParts) {
    if (part.length > 2) {
      scrubbed = scrubbed.replace(new RegExp(part, "gi"), "[REDACTED]");
    }
  }
  return JSON.parse(scrubbed);
}

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

function extractSignals(profileData: Record<string, unknown>, profileId: string) {
  const signals: { profile_id: string; signal_type: string; signal_key: string; signal_value: string; confidence_score: number }[] = [];

  const addSignals = (section: string, key: string, field: string, confidence: number) => {
    const data = profileData[section] as Record<string, unknown> | undefined;
    if (data?.[field] && Array.isArray(data[field])) {
      for (const val of data[field] as string[]) {
        signals.push({ profile_id: profileId, signal_type: section, signal_key: key, signal_value: val, confidence_score: confidence });
      }
    }
  };

  addSignals("personality", "dominant_trait", "dominant_traits", 0.7);
  addSignals("cognition", "thinking_pattern", "thinking_patterns", 0.6);
  addSignals("motivation", "primary_driver", "primary_drivers", 0.6);
  addSignals("motivation", "value", "values", 0.5);
  addSignals("behavior", "influence_tactic", "influence_tactics", 0.5);
  addSignals("predictions", "likely_decision", "likely_decisions", 0.4);
  addSignals("predictions", "communication_trigger", "communication_triggers", 0.4);

  return signals;
}

function buildJsonLd(body: RequestBody, slug: string, isAnonymized: boolean) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${isAnonymized ? "Anonymous Profile" : body.person_name} — Observational Analysis`,
    url: `https://ai-idei.com/media/profiles/${slug}`,
    publisher: { "@type": "Organization", name: "AI-IDEI Intelligence OS" },
  };
  if (!isAnonymized) {
    base.about = { "@type": "Person", name: body.person_name };
  }
  return base;
}

async function callLovableAI(prompt: string): Promise<string> {
  const resp = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI call failed: ${resp.status} ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}
