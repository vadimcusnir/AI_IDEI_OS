import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const IDENTITY_DIMENSIONS = [
  { key: "psychological_portrait", label: "Psychological Portrait", prompt: "Analyze the user's psychological profile: personality traits, emotional patterns, decision-making tendencies, risk tolerance, and core motivations." },
  { key: "cognitive_logic", label: "Cognitive Logic", prompt: "Extract the user's cognitive patterns: how they reason, structure arguments, process information, handle complexity, and approach problem-solving." },
  { key: "problem_solving", label: "Problem Solving Model", prompt: "Identify the user's problem-solving methodology: frameworks used, steps followed, how they diagnose issues, and their approach to solutions." },
  { key: "tone_of_voice", label: "Tone & Expression", prompt: "Analyze the user's communication style: vocabulary complexity, sentence structure, formality level, use of metaphors, humor patterns, and persuasion techniques." },
  { key: "knowledge_signature", label: "Knowledge Signature", prompt: "Map the user's knowledge domains: areas of expertise, depth of knowledge, unique frameworks, original concepts, and intellectual fingerprint." },
  { key: "dark_patterns", label: "Blind Spots & Limits", prompt: "Identify potential blind spots: cognitive biases, knowledge gaps, recurring assumptions, areas of overconfidence, and limitation patterns." },
  { key: "operational_identity", label: "Operational Identity", prompt: "Define the user's operational style: work patterns, productivity rhythms, collaboration preferences, leadership approach, and execution methodology." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const dimensions = body.dimensions || IDENTITY_DIMENSIONS.map((d) => d.key);

    // Fetch user's neurons for context
    const { data: neurons } = await supabase
      .from("neurons")
      .select("id, title, content, content_category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!neurons || neurons.length < 3) {
      return new Response(JSON.stringify({
        error: "insufficient_data",
        message: "Minimum 3 neurons required for identity extraction",
        current_count: neurons?.length || 0,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context from neurons
    const context = neurons
      .map((n) => `[${n.content_category || "general"}] ${n.title}: ${(n.content || "").slice(0, 500)}`)
      .join("\n\n");

    const results: Array<{ dimension_key: string; dimension_label: string; extraction: any; confidence: number; source_neuron_ids: number[] }> = [];
    const gaps: Array<{ dimension_key: string; gap_severity: string; suggestion_text: string }> = [];

    // Process each requested dimension
    for (const dimKey of dimensions) {
      const dimDef = IDENTITY_DIMENSIONS.find((d) => d.key === dimKey);
      if (!dimDef) continue;

      try {
        const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-gateway`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a cognitive identity analyst. ${dimDef.prompt}\n\nReturn a JSON object with:\n- "summary": string (2-3 sentences)\n- "traits": string[] (3-7 key traits)\n- "strength_level": number (0-1, how confident you are)\n- "evidence": string[] (2-4 specific examples from the content)\n- "recommendations": string[] (1-3 areas for development)\n\nRespond ONLY with valid JSON, no markdown.`,
              },
              {
                role: "user",
                content: `Analyze this person's content for ${dimDef.label}:\n\n${context}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const rawContent = aiData.choices?.[0]?.message?.content || "{}";
          // Strip markdown code fences if present
          const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          let extraction;
          try {
            extraction = JSON.parse(cleaned);
          } catch {
            extraction = { summary: cleaned, traits: [], strength_level: 0.3 };
          }

          const confidence = extraction.strength_level || 0.5;
          results.push({
            dimension_key: dimKey,
            dimension_label: dimDef.label,
            extraction,
            confidence,
            source_neuron_ids: neurons.slice(0, 10).map((n) => n.id),
          });

          if (confidence < 0.4) {
            gaps.push({
              dimension_key: dimKey,
              gap_severity: confidence < 0.2 ? "critical" : "moderate",
              suggestion_text: `Insufficient data for ${dimDef.label}. Upload more content related to this dimension.`,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to extract ${dimKey}:`, err);
        gaps.push({
          dimension_key: dimKey,
          gap_severity: "critical",
          suggestion_text: `Extraction failed for ${dimDef.label}. Try again later.`,
        });
      }
    }

    // Upsert identity dimensions
    for (const r of results) {
      await supabase.from("identity_dimensions").upsert(
        {
          user_id: user.id,
          dimension_key: r.dimension_key,
          dimension_label: r.dimension_label,
          extraction: r.extraction,
          confidence: r.confidence,
          source_neuron_ids: r.source_neuron_ids,
          model_version: "v1",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,dimension_key" }
      );
    }

    // Insert gap detections
    if (gaps.length > 0) {
      // Clear old unresolved gaps first
      await supabase
        .from("profile_gap_detections")
        .delete()
        .eq("user_id", user.id)
        .eq("resolved", false);

      await supabase.from("profile_gap_detections").insert(
        gaps.map((g) => ({
          user_id: user.id,
          ...g,
        }))
      );
    }

    // Build OS layers summary
    const osLayers = [
      { key: "identity", label: "Identity Layer", dims: ["psychological_portrait", "cognitive_logic", "tone_of_voice"] },
      { key: "knowledge", label: "Knowledge Layer", dims: ["knowledge_signature"] },
      { key: "execution", label: "Execution Layer", dims: ["problem_solving", "operational_identity"] },
      { key: "adaptation", label: "Adaptation Layer", dims: ["dark_patterns"] },
      { key: "monetization", label: "Monetization Layer", dims: [] },
    ];

    for (const layer of osLayers) {
      const layerDims = results.filter((r) => layer.dims.includes(r.dimension_key));
      const completeness = layer.dims.length > 0
        ? Math.round((layerDims.length / layer.dims.length) * 100)
        : 0;

      const layerGaps = gaps.filter((g) => layer.dims.includes(g.dimension_key));

      await supabase.from("personal_os_layers").upsert(
        {
          user_id: user.id,
          layer_key: layer.key,
          layer_label: layer.label,
          layer_data: {
            dimensions: layerDims.map((d) => ({
              key: d.dimension_key,
              label: d.dimension_label,
              confidence: d.confidence,
              summary: d.extraction?.summary || "",
            })),
          },
          completeness_pct: completeness,
          gap_details: layerGaps,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,layer_key" }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        dimensions_extracted: results.length,
        gaps_detected: gaps.length,
        total_neurons_analyzed: neurons.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("extract-identity error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
