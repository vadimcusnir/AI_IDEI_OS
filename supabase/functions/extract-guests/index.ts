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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── Authenticate via JWT ──
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
    const userId = caller.id;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { episode_id } = await req.json();
    if (!episode_id) {
      return new Response(JSON.stringify({ error: "Missing episode_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch episode
    const { data: episode, error: epErr } = await supabase
      .from("episodes").select("*").eq("id", episode_id).eq("author_id", userId).single();

    if (!episode || epErr) {
      return new Response(JSON.stringify({ error: "Episode not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = episode.transcript || "";
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "No transcript" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sample = transcript.slice(0, 6000);

    const systemPrompt = `You are a guest/participant detection engine for podcast transcripts.

Analyze this transcript and identify ALL distinct people mentioned or participating (host, guest, expert, etc.).

For each person return a JSON object with:
- "full_name": string (their full name)
- "role": "host" | "guest" | "expert" | "panelist"
- "bio": string (2-3 sentence bio based on what's revealed in the transcript)
- "expertise_areas": string[] (max 5 areas of expertise mentioned)
- "frameworks_mentioned": string[] (any frameworks, models, or methodologies they reference)
- "psychological_traits": string[] (communication style traits observed)
- "key_quotes": string[] (1-3 notable direct quotes, max 30 words each)

Return ONLY a valid JSON array. No markdown wrapping.
If no distinct people can be identified, return an empty array [].`;

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
          { role: "user", content: `Episode: "${episode.title}"\n\nTranscript:\n${sample}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error(`AI error: ${response.status}`);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || "";

    let guests: any[] = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) guests = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Parse error:", e);
    }

    if (guests.length === 0) {
      return new Response(JSON.stringify({ guests: [], message: "No guests detected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert guest profiles
    const created: any[] = [];
    for (const guest of guests) {
      const slug = guest.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data: existing } = await supabase
        .from("guest_profiles")
        .select("id, episode_ids, neuron_ids")
        .eq("author_id", userId)
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        const updatedEpisodes = Array.from(new Set([...(existing.episode_ids || []), episode_id]));
        await supabase.from("guest_profiles").update({
          episode_ids: updatedEpisodes,
          bio: guest.bio || existing.bio || "",
          expertise_areas: guest.expertise_areas || [],
          frameworks_mentioned: guest.frameworks_mentioned || [],
          psychological_traits: guest.psychological_traits || [],
          key_quotes: guest.key_quotes || [],
          updated_at: new Date().toISOString(),
        } as any).eq("id", existing.id);
        created.push({ id: existing.id, slug, full_name: guest.full_name, updated: true });
      } else {
        const { data: newGuest, error: gErr } = await supabase
          .from("guest_profiles")
          .insert({
            author_id: userId,
            full_name: guest.full_name,
            slug,
            role: guest.role || "guest",
            bio: guest.bio || "",
            expertise_areas: guest.expertise_areas || [],
            frameworks_mentioned: guest.frameworks_mentioned || [],
            psychological_traits: guest.psychological_traits || [],
            key_quotes: guest.key_quotes || [],
            episode_ids: [episode_id],
          } as any)
          .select("id")
          .single();

        if (newGuest) created.push({ id: newGuest.id, slug, full_name: guest.full_name, created: true });
        if (gErr) console.error("Guest insert error:", gErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      guests_processed: created.length,
      guests: created,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("extract-guests error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
