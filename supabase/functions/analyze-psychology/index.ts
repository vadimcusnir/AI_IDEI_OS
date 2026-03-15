import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";
import { loadPrompt } from "../_shared/prompt-loader.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[ANALYZE-PSYCHOLOGY] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");
    const userId = userData.user.id;
    logStep("Authenticated", { userId });

    const { guest_profile_id } = await req.json();
    if (!guest_profile_id) throw new Error("guest_profile_id is required");

    // ── Regime enforcement ──
    const regime = await getRegimeConfig("analyze-psychology");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: "Service blocked", reason: blockReason, regime: regime.regime }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Gather transcript text from linked episodes
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

    // Also gather key_quotes and bio for analysis
    const analysisText = [
      transcriptText,
      guest.bio || "",
      ...(guest.key_quotes || []),
    ].filter(Boolean).join("\n\n");

    if (analysisText.length < 100) {
      throw new Error("Insufficient text for psychological analysis (minimum 100 characters)");
    }

    logStep("Text gathered", { length: analysisText.length });

    // Use Lovable AI for analysis
    const analysisPrompt = `You are an expert psycholinguistic analyst. Analyze the following text and produce a psychological profile.

Return a JSON object with EXACTLY these fields (all scores 0-100):

{
  "big_five": {
    "openness": <0-100>,
    "conscientiousness": <0-100>,
    "extraversion": <0-100>,
    "agreeableness": <0-100>,
    "neuroticism": <0-100>
  },
  "liwc_metrics": {
    "analytical_thinking": <0-100>,
    "emotional_tone": <0-100>,
    "authenticity": <0-100>,
    "clout": <0-100>
  },
  "communication": {
    "dominance": <0-100>,
    "empathy": <0-100>,
    "cognitive_complexity": <0-100>,
    "confidence_level": <0-100>
  },
  "insights": {
    "communication_style": "<one of: Directive, Collaborative, Analytical, Expressive, Supportive>",
    "leadership_style": "<one of: Visionary, Democratic, Coaching, Commanding, Affiliative>",
    "decision_style": "<one of: Analytical, Intuitive, Directive, Conceptual>",
    "persuasion_approach": "<one of: Logical, Emotional, Authority, Social Proof, Storytelling>",
    "risk_tolerance": "<one of: Risk-Averse, Moderate, Risk-Seeking>"
  },
  "lexical_features": {
    "avg_sentence_length": <number>,
    "vocabulary_diversity": <0-1>,
    "pronoun_ratio_i": <0-1>,
    "pronoun_ratio_we": <0-1>,
    "emotion_word_ratio": <0-1>,
    "cognitive_word_ratio": <0-1>,
    "certainty_word_ratio": <0-1>,
    "question_ratio": <0-1>
  }
}

Analyze based on:
- Word choice patterns (formal vs informal, abstract vs concrete)
- Pronoun usage (I vs we vs you — indicates focus orientation)
- Sentence complexity and length
- Emotional vs analytical language ratio
- Certainty markers vs hedging language
- Question frequency (curiosity/engagement)
- Metaphor and storytelling usage
- Authority markers and social proof references

TEXT TO ANALYZE:
${analysisText.slice(0, 15000)}`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI analysis failed: ${errText}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    logStep("AI analysis complete");
    const profile = JSON.parse(content);

    // Upsert psychological profile
    const { error: upsertError } = await supabase
      .from("psychological_profiles")
      .upsert(
        {
          guest_profile_id,
          author_id: userId,
          openness: profile.big_five.openness,
          conscientiousness: profile.big_five.conscientiousness,
          extraversion: profile.big_five.extraversion,
          agreeableness: profile.big_five.agreeableness,
          neuroticism: profile.big_five.neuroticism,
          analytical_thinking: profile.liwc_metrics.analytical_thinking,
          emotional_tone: profile.liwc_metrics.emotional_tone,
          authenticity: profile.liwc_metrics.authenticity,
          clout: profile.liwc_metrics.clout,
          dominance: profile.communication.dominance,
          empathy: profile.communication.empathy,
          cognitive_complexity: profile.communication.cognitive_complexity,
          confidence_level: profile.communication.confidence_level,
          communication_style: profile.insights.communication_style,
          leadership_style: profile.insights.leadership_style,
          decision_style: profile.insights.decision_style,
          persuasion_approach: profile.insights.persuasion_approach,
          risk_tolerance: profile.insights.risk_tolerance,
          lexical_features: profile.lexical_features || {},
          analysis_metadata: {
            text_length: analysisText.length,
            analyzed_at: new Date().toISOString(),
            episodes_count: guest.episode_ids?.length || 0,
          },
          model_version: "v1-gemini-flash",
        },
        { onConflict: "guest_profile_id" }
      );

    if (upsertError) throw new Error(`Save failed: ${upsertError.message}`);
    logStep("Profile saved");

    return new Response(JSON.stringify({ success: true, profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
