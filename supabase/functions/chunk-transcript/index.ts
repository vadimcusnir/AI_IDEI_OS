import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter((s) => s.length > 0);
}

function greedyChunk(text: string, minTokens = 200, maxTokens = 800): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  const chunks: string[] = [];
  let buffer = "";
  let bufferTokens = 0;

  for (const para of paragraphs) {
    const sentences = splitSentences(para);
    for (const sentence of sentences) {
      const sentTokens = estimateTokens(sentence);
      if (bufferTokens + sentTokens > maxTokens && bufferTokens >= minTokens) {
        chunks.push(buffer.trim());
        buffer = "";
        bufferTokens = 0;
      }
      if (sentTokens > maxTokens && buffer.trim()) {
        if (bufferTokens > 0) {
          chunks.push(buffer.trim());
          buffer = "";
          bufferTokens = 0;
        }
        chunks.push(sentence);
        continue;
      }
      buffer += (buffer ? " " : "") + sentence;
      bufferTokens += sentTokens;
    }
    if (bufferTokens >= minTokens) {
      chunks.push(buffer.trim());
      buffer = "";
      bufferTokens = 0;
    }
  }

  if (buffer.trim()) {
    if (chunks.length > 0 && bufferTokens < minTokens) {
      chunks[chunks.length - 1] += " " + buffer.trim();
    } else {
      chunks.push(buffer.trim());
    }
  }

  return chunks;
}

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

    const { episode_id, min_tokens, max_tokens } = await req.json();

    if (!episode_id) {
      return new Response(JSON.stringify({ error: "Missing episode_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch episode
    const { data: episode, error: epErr } = await supabase
      .from("episodes")
      .select("id, title, transcript, status, metadata")
      .eq("id", episode_id)
      .eq("author_id", userId)
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

    const minT = min_tokens ?? 200;
    const maxT = max_tokens ?? 800;
    const chunks = greedyChunk(transcript, minT, maxT);

    const result = chunks.map((content, index) => ({
      index,
      content,
      token_estimate: estimateTokens(content),
      char_count: content.length,
    }));

    if (episode.status === "transcribed" || episode.status === "uploaded") {
      await supabase
        .from("episodes")
        .update({
          status: "chunked",
          metadata: {
            ...(typeof episode.metadata === "object" && episode.metadata ? episode.metadata : {}),
            chunks_count: result.length,
            chunk_params: { min_tokens: minT, max_tokens: maxT },
            chunked_at: new Date().toISOString(),
          },
        } as any)
        .eq("id", episode_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        episode_id,
        total_chunks: result.length,
        total_tokens: result.reduce((s, c) => s + c.token_estimate, 0),
        chunks: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chunk-transcript error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
