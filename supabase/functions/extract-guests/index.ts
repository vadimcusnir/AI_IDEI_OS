import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { loadPrompt } from "../_shared/prompt-loader.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";

import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── Authenticate via JWT ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = caller.id;

    // ── Rate limit check (DB-backed, persistent) ──
    const rateLimited = await rateLimitGuard(userId, req, { maxRequests: 10, windowSeconds: 3600 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { episode_id } = await req.json();
    if (!episode_id || typeof episode_id !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid episode_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch episode
    const { data: episode, error: epErr } = await supabase
      .from("episodes").select("*").eq("id", episode_id).eq("author_id", userId).single();

    if (!episode || epErr) {
      return new Response(JSON.stringify({ error: "Episode not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const transcript = episode.transcript || "";
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "No transcript" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const sample = transcript.slice(0, 6000);

    // ── Regime check ──
    const regime = await getRegimeConfig("extract-guests");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: blockReason }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const isDryRun = regime.dryRun || regime.regime === "simulation";

    const fallbackPrompt = `You are a guest/participant detection engine for podcast transcripts.

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

    const { prompt: systemPrompt } = await loadPrompt("extract_guests", fallbackPrompt);

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
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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

    // Validate parsed guests - max 20, sanitize strings
    guests = guests.slice(0, 20).filter(g => g.full_name && typeof g.full_name === "string");

    if (guests.length === 0) {
      return new Response(JSON.stringify({ guests: [], message: "No guests detected" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // In simulation mode, return detected guests without persisting
    if (isDryRun) {
      return new Response(JSON.stringify({
        success: true, dry_run: true, regime: regime.regime,
        guests_detected: guests.length,
        guests: guests.map((g: any) => ({ full_name: g.full_name, role: g.role })),
      }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    // Upsert guest profiles
    const created: any[] = [];
    for (const guest of guests) {
      const fullName = String(guest.full_name).slice(0, 200);
      const slug = fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);

      if (!slug) continue;

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
          bio: String(guest.bio || "").slice(0, 2000),
          expertise_areas: (guest.expertise_areas || []).slice(0, 10).map((s: any) => String(s).slice(0, 200)),
          frameworks_mentioned: (guest.frameworks_mentioned || []).slice(0, 10).map((s: any) => String(s).slice(0, 200)),
          psychological_traits: (guest.psychological_traits || []).slice(0, 10).map((s: any) => String(s).slice(0, 200)),
          key_quotes: (guest.key_quotes || []).slice(0, 10).map((s: any) => String(s).slice(0, 500)),
          updated_at: new Date().toISOString(),
        } as any).eq("id", existing.id);
        created.push({ id: existing.id, slug, full_name: fullName, updated: true });
      } else {
        const { data: newGuest, error: gErr } = await supabase
          .from("guest_profiles")
          .insert({
            author_id: userId,
            full_name: fullName,
            slug,
            role: ["host", "guest", "expert", "panelist"].includes(guest.role) ? guest.role : "guest",
            bio: String(guest.bio || "").slice(0, 2000),
            expertise_areas: (guest.expertise_areas || []).slice(0, 10).map((s: any) => String(s).slice(0, 200)),
            frameworks_mentioned: (guest.frameworks_mentioned || []).slice(0, 10).map((s: any) => String(s).slice(0, 200)),
            psychological_traits: (guest.psychological_traits || []).slice(0, 10).map((s: any) => String(s).slice(0, 200)),
            key_quotes: (guest.key_quotes || []).slice(0, 10).map((s: any) => String(s).slice(0, 500)),
            episode_ids: [episode_id],
          } as any)
          .select("id")
          .single();

        if (newGuest) created.push({ id: newGuest.id, slug, full_name: fullName, created: true });
        if (gErr) console.error("Guest insert error:", gErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      guests_processed: created.length,
      guests: created,
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

  } catch (e) {
    console.error("extract-guests error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
