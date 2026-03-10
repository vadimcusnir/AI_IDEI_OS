import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { episode_id, user_id } = await req.json();

    if (!episode_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing episode_id or user_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 1: Fetch episode ──
    const { data: episode, error: epErr } = await supabase
      .from("episodes")
      .select("*")
      .eq("id", episode_id)
      .eq("author_id", user_id)
      .single();

    if (!episode || epErr) {
      return new Response(JSON.stringify({ error: "Episode not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = episode.transcript || "";
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "Episode has no transcript content" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 2: Check credits (extraction costs 100 credits) ──
    const EXTRACTION_COST = 100;
    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance, total_spent")
      .eq("user_id", user_id)
      .single();

    if (!credits || credits.balance < EXTRACTION_COST) {
      return new Response(JSON.stringify({
        error: "Insufficient credits for extraction",
        reason_code: "RC.CREDITS.INSUFFICIENT",
        needed: EXTRACTION_COST,
        have: credits?.balance ?? 0,
      }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reserve credits
    await supabase.from("user_credits").update({
      balance: credits.balance - EXTRACTION_COST,
      total_spent: credits.total_spent + EXTRACTION_COST,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user_id);

    // ── STEP 3: Update episode status ──
    await supabase.from("episodes").update({ status: "analyzing" }).eq("id", episode_id);

    // ── STEP 4: Call AI to extract neurons ──
    const systemPrompt = `You are a neuron extraction engine for a Knowledge Operating System.

Analyze the transcript and extract distinct knowledge units ("neurons").

For each neuron, return a JSON object in a JSON array. Each neuron must have:
- "title": concise title (max 12 words)
- "content_category": one of: transcript, insight, framework, strategy, formula, pattern, avatar, argument_map, narrative, psychological, commercial
- "blocks": array of block objects, each with:
  - "type": one of: text, heading, subheading, quote, idea, reference, list, markdown
  - "content": the block content

Rules:
- Extract 3-8 neurons per transcript
- Each neuron must be a self-contained knowledge unit
- Classify accurately using the content_category enum
- Use heading blocks for titles, text blocks for explanations, quote blocks for direct quotes, idea blocks for insights
- Return ONLY a valid JSON array, no markdown wrapping

Example output:
[
  {
    "title": "Personalization at Scale",
    "content_category": "strategy",
    "blocks": [
      {"type": "heading", "content": "Personalization at Scale"},
      {"type": "text", "content": "The key insight is that..."},
      {"type": "quote", "content": "Original quote from transcript..."},
      {"type": "idea", "content": "This can be applied to..."}
    ]
  }
]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Episode: "${episode.title}"\n\nTranscript:\n${transcript.slice(0, 15000)}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      // Release credits on failure
      await supabase.from("user_credits").update({
        balance: credits.balance,
        total_spent: credits.total_spent,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user_id);

      await supabase.from("episodes").update({ status: "transcribed" }).eq("id", episode_id);

      const statusCode = response.status;
      return new Response(JSON.stringify({ error: `AI error: ${statusCode}. Credits released.` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response (handle markdown wrapping)
    let neurons: any[] = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        neurons = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, rawContent.slice(0, 500));
      // Release credits
      await supabase.from("user_credits").update({
        balance: credits.balance,
        total_spent: credits.total_spent,
      }).eq("user_id", user_id);
      await supabase.from("episodes").update({ status: "transcribed" }).eq("id", episode_id);
      return new Response(JSON.stringify({ error: "Failed to parse AI extraction result" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(neurons) || neurons.length === 0) {
      await supabase.from("user_credits").update({
        balance: credits.balance,
        total_spent: credits.total_spent,
      }).eq("user_id", user_id);
      await supabase.from("episodes").update({ status: "transcribed" }).eq("id", episode_id);
      return new Response(JSON.stringify({ error: "No neurons extracted" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 5: Create neurons and blocks ──
    const createdNeurons: any[] = [];

    for (const neuronData of neurons) {
      const { data: newNeuron, error: nErr } = await supabase
        .from("neurons")
        .insert({
          author_id: user_id,
          title: neuronData.title || "Extracted Neuron",
          status: "draft",
          lifecycle: "structured",
          content_category: neuronData.content_category || null,
          episode_id: episode_id,
          credits_cost: Math.round(EXTRACTION_COST / neurons.length),
        })
        .select("id, number")
        .single();

      if (nErr || !newNeuron) {
        console.error("Neuron creation error:", nErr);
        continue;
      }

      // Create blocks
      const blocks = Array.isArray(neuronData.blocks) ? neuronData.blocks : [];
      for (let i = 0; i < blocks.length; i++) {
        await supabase.from("neuron_blocks").insert({
          neuron_id: newNeuron.id,
          type: blocks[i].type || "text",
          content: blocks[i].content || "",
          position: i,
          execution_mode: "passive",
        });
      }

      createdNeurons.push({ id: newNeuron.id, number: newNeuron.number, title: neuronData.title });
    }

    // ── STEP 6: Update episode and log ──
    await supabase.from("episodes").update({ status: "analyzed" }).eq("id", episode_id);

    // Log transaction
    await supabase.from("credit_transactions").insert({
      user_id,
      amount: -EXTRACTION_COST,
      type: "spend",
      description: `EXTRACTION: ${episode.title} → ${createdNeurons.length} neurons`,
    });

    return new Response(JSON.stringify({
      success: true,
      neurons_created: createdNeurons.length,
      neurons: createdNeurons,
      credits_spent: EXTRACTION_COST,
      episode_status: "analyzed",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("extract-neurons error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
