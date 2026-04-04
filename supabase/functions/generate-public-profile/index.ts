/**
 * generate-public-profile — Autonomous Intelligence Profile Generator
 * 
 * Pipeline: transcript_ref → extract signals → synthesize profile → PII scrub → store draft
 * 
 * Uses Lovable AI (Gemini) for synthesis. No external API key needed.
 */
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

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

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    // Parse & validate input
    const body: RequestBody = await req.json();
    if (!body.person_name?.trim()) throw new Error("person_name required");
    if (!["public_figure", "local_figure", "anonymized_client"].includes(body.profile_type)) {
      throw new Error("Invalid profile_type");
    }

    // ── Step 1: Extract Signals from Neurons ──
    let neurons: { id: number; title: string; content_category: string; score: number }[] = [];
    let transcript = "";

    if (body.episode_id) {
      // Get episode transcript
      const { data: episode } = await supabaseAdmin
        .from("episodes")
        .select("transcript, title, duration_seconds, source_url")
        .eq("id", body.episode_id)
        .eq("author_id", user.id)
        .single();

      if (episode?.transcript) {
        transcript = episode.transcript.slice(0, 15000); // Cap at 15k chars for AI
      }

      // Get neurons from this episode
      const { data: episodeNeurons } = await supabaseAdmin
        .from("neurons")
        .select("id, title, content_category, score")
        .eq("episode_id", body.episode_id)
        .eq("author_id", user.id)
        .order("score", { ascending: false })
        .limit(50);

      neurons = episodeNeurons || [];
    }

    // Get neuron blocks (content) for enrichment
    let neuronContents: { neuron_id: number; type: string; content: string }[] = [];
    if (neurons.length > 0) {
      const neuronIds = neurons.map(n => n.id);
      const { data: blocks } = await supabaseAdmin
        .from("neuron_blocks")
        .select("neuron_id, type, content")
        .in("neuron_id", neuronIds)
        .in("type", ["insight", "pattern", "framework", "concept", "strategy"])
        .limit(100);
      neuronContents = blocks || [];
    }

    // ── Step 2: Synthesize Profile via AI ──
    const signalBundle = buildSignalBundle(neurons, neuronContents, transcript);
    
    const isAnonymized = body.profile_type === "anonymized_client";
    const personRef = isAnonymized ? "Subject (anonymized)" : body.person_name;

    const synthesisPrompt = `You are an intelligence analyst specializing in behavioral profiling from public material.

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
- If anonymized, remove ALL identifying information
- Focus on behavioral patterns, not personal judgments
- Output ONLY valid JSON, no markdown`;

    const aiResponse = await callLovableAI(synthesisPrompt);
    
    // Parse AI response
    let profileData;
    try {
      const cleaned = aiResponse
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      profileData = JSON.parse(cleaned);
    } catch {
      throw new Error("AI synthesis produced invalid output");
    }

    // ── Step 3: PII Scrubbing ──
    if (isAnonymized) {
      profileData = scrubPII(profileData, body.person_name);
    }

    // ── Step 4: Store Profile as Draft ──
    const slug = generateSlug(isAnonymized ? `profile-${Date.now()}` : body.person_name);

    const { data: profile, error: insertErr } = await supabaseAdmin
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
        source_duration_minutes: null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertErr || !profile) throw new Error(insertErr?.message || "Failed to create profile");

    // Create public subset
    await supabaseAdmin.from("intelligence_profile_public").insert({
      profile_id: profile.id,
      public_indicators: profileData.indicators || [],
      public_patterns: profileData.patterns || [],
      public_summary: profileData.summary || null,
      meta_title: `${isAnonymized ? "Anonymous Profile" : body.person_name} — Analysis from public material`,
      meta_description: `Observational analysis based on ${body.source_type} material.`,
      json_ld: buildJsonLd(body, slug, isAnonymized),
    });

    // Store signals
    const signals = extractSignals(profileData, profile.id);
    if (signals.length > 0) {
      await supabaseAdmin.from("profile_signals").insert(signals);
    }

    // Initial version snapshot
    await supabaseAdmin.from("profile_versions").insert({
      profile_id: profile.id,
      version: 1,
      data_snapshot: profileData,
      change_summary: "Initial AI synthesis",
      created_by: user.id,
    });

    // Initial scores
    const dataVolume = Math.min(1, (neurons.length / 30 + (transcript.length > 0 ? 0.3 : 0)));
    await supabaseAdmin.from("profile_scores").insert({
      profile_id: profile.id,
      data_volume: dataVolume,
      consistency: 0.5,
      prediction_accuracy: 0,
      validation_score: 0,
      certainty: Math.min(0.999, dataVolume * 0.7),
      overall: Math.min(0.999, dataVolume * 0.5),
    });

    // Audit log
    await supabaseAdmin.from("profile_audit_log").insert({
      profile_id: profile.id,
      action: "generated",
      actor: user.id,
      details: {
        source: body.episode_id ? "episode" : "manual",
        neuron_count: neurons.length,
        transcript_length: transcript.length,
        signal_count: signals.length,
      },
    });

    // State transition
    await supabaseAdmin.from("intelligence_profile_state_transitions").insert({
      profile_id: profile.id,
      from_status: null,
      to_status: "draft",
      triggered_by: user.id,
      reason_code: "AI_GENERATION",
    });

    return new Response(JSON.stringify({
      success: true,
      profile_id: profile.id,
      slug,
      status: "draft",
      signal_count: signals.length,
      neuron_count: neurons.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helpers ──

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
    bundle += "\n## Transcript Excerpt (first 5000 chars)\n\n";
    bundle += transcript.slice(0, 5000) + "\n";
  }

  if (!bundle) {
    bundle = "No extracted signals available. Generate a basic template profile based on the person name only.";
  }

  return bundle;
}

function scrubPII(data: Record<string, unknown>, originalName: string): Record<string, unknown> {
  const json = JSON.stringify(data);
  // Remove name variants
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
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

function extractSignals(profileData: Record<string, unknown>, profileId: string) {
  const signals: { profile_id: string; signal_type: string; signal_key: string; signal_value: string; confidence_score: number }[] = [];

  // Personality traits
  const personality = profileData.personality as Record<string, unknown> | undefined;
  if (personality?.dominant_traits && Array.isArray(personality.dominant_traits)) {
    for (const trait of personality.dominant_traits) {
      signals.push({ profile_id: profileId, signal_type: "personality", signal_key: "dominant_trait", signal_value: trait, confidence_score: 0.7 });
    }
  }

  // Cognitive patterns
  const cognition = profileData.cognition as Record<string, unknown> | undefined;
  if (cognition?.thinking_patterns && Array.isArray(cognition.thinking_patterns)) {
    for (const p of cognition.thinking_patterns) {
      signals.push({ profile_id: profileId, signal_type: "cognition", signal_key: "thinking_pattern", signal_value: p, confidence_score: 0.6 });
    }
  }

  // Motivations
  const motivation = profileData.motivation as Record<string, unknown> | undefined;
  if (motivation?.primary_drivers && Array.isArray(motivation.primary_drivers)) {
    for (const d of motivation.primary_drivers) {
      signals.push({ profile_id: profileId, signal_type: "motivation", signal_key: "primary_driver", signal_value: d, confidence_score: 0.6 });
    }
  }

  // Behavior
  const behavior = profileData.behavior as Record<string, unknown> | undefined;
  if (behavior?.influence_tactics && Array.isArray(behavior.influence_tactics)) {
    for (const t of behavior.influence_tactics) {
      signals.push({ profile_id: profileId, signal_type: "behavior", signal_key: "influence_tactic", signal_value: t, confidence_score: 0.5 });
    }
  }

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
