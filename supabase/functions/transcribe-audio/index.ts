import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // per hour
const RATE_WINDOW = 3600_000;

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

  if (!ELEVENLABS_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ELEVENLABS_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── Authenticate via JWT (strict) ──
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
    const callerId = caller.id;

    // ── Rate limit check ──
    if (!checkRateLimit(callerId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (5 transcriptions/hour)" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { episode_id, file_path, language } = await req.json();

    if (!episode_id || typeof episode_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid episode_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!file_path || typeof file_path !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid file_path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (language && typeof language !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid language parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the episode — verify ownership
    const { data: episode, error: epErr } = await supabase
      .from("episodes")
      .select("*")
      .eq("id", episode_id)
      .eq("author_id", callerId)
      .single();

    if (!episode || epErr) {
      return new Response(
        JSON.stringify({ error: "Episode not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to transcribing
    await supabase.from("episodes").update({ status: "transcribing" }).eq("id", episode_id);

    // Download file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("episode-files")
      .download(file_path);

    if (!fileData || dlErr) {
      await supabase.from("episodes").update({ status: "error" }).eq("id", episode_id);
      return new Response(
        JSON.stringify({ error: "Failed to download file from storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine file name from path
    const fileName = file_path.split("/").pop() || "audio.mp3";

    // Send to ElevenLabs STT
    const apiFormData = new FormData();
    apiFormData.append("file", new File([fileData], fileName, { type: fileData.type }));
    apiFormData.append("model_id", "scribe_v2");
    apiFormData.append("tag_audio_events", "true");
    apiFormData.append("diarize", "true");
    if (language) {
      apiFormData.append("language_code", language);
    }

    console.log(`Transcribing file: ${fileName} (${(fileData.size / 1024 / 1024).toFixed(2)} MB)`);

    const sttResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!sttResponse.ok) {
      const errBody = await sttResponse.text();
      console.error(`ElevenLabs STT error: ${sttResponse.status} ${errBody}`);
      await supabase.from("episodes").update({ status: "error" }).eq("id", episode_id);
      return new Response(
        JSON.stringify({ error: `Transcription failed: ${sttResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcription = await sttResponse.json();
    const fullText = transcription.text || "";

    if (!fullText.trim()) {
      await supabase.from("episodes").update({ status: "error" }).eq("id", episode_id);
      return new Response(
        JSON.stringify({ error: "Transcription returned empty text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build SRT from word timestamps if available
    let srtContent = "";
    if (transcription.words && transcription.words.length > 0) {
      const words = transcription.words;
      const blockSize = 10;
      let blockIndex = 1;
      for (let i = 0; i < words.length; i += blockSize) {
        const block = words.slice(i, i + blockSize);
        const startTime = block[0].start;
        const endTime = block[block.length - 1].end;
        const text = block.map((w: any) => w.text).join(" ");
        srtContent += `${blockIndex}\n`;
        srtContent += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
        srtContent += `${text}\n\n`;
        blockIndex++;
      }
    }

    // Calculate duration
    let durationSeconds: number | null = null;
    if (transcription.words && transcription.words.length > 0) {
      const lastWord = transcription.words[transcription.words.length - 1];
      durationSeconds = Math.ceil(lastWord.end);
    }

    // Update episode with transcript
    await supabase.from("episodes").update({
      transcript: fullText,
      status: "transcribed",
      duration_seconds: durationSeconds,
      metadata: {
        ...(typeof episode.metadata === "object" && episode.metadata ? episode.metadata : {}),
        transcribed_at: new Date().toISOString(),
        transcription_service: "elevenlabs_scribe_v2",
        word_count: fullText.split(/\s+/).length,
        has_srt: !!srtContent,
        has_diarization: transcription.words?.some((w: any) => w.speaker) || false,
        audio_events: transcription.audio_events || [],
      },
    } as any).eq("id", episode_id);

    return new Response(
      JSON.stringify({
        success: true,
        episode_id,
        transcript_length: fullText.length,
        word_count: fullText.split(/\s+/).length,
        duration_seconds: durationSeconds,
        has_srt: !!srtContent,
        srt: srtContent || null,
        text: fullText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("transcribe-audio error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad3(ms)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}
