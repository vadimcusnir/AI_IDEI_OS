import { rateLimitGuard } from "../_shared/rate-limiter.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit guard (IP-based)
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  const rateLimited = rateLimitGuard(clientIP, req, { maxRequests: 20, windowSeconds: 60 }, corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const { messages, sources, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build context from selected sources
    const sourceContext = (sources || [])
      .map((s: { title: string; content: string }, i: number) => `[Source ${i + 1}: ${s.title}]\n${s.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = mode === "studio"
      ? `Ești un motor AI de generare conținut. Primești surse de cunoștințe și generezi artefacte de înaltă calitate.
Răspunde în limba în care este scris conținutul surselor. Fii concis, structurat, profesional.
Dacă nu ai surse, explică ce ai nevoie.

SURSE DISPONIBILE:
${sourceContext || "Nicio sursă selectată."}`
      : `Ești un asistent AI de analiză și sinteză a cunoștințelor. Lucrezi cu un workspace de tip Notebook.
Ai acces la sursele de mai jos. Răspunde întrebărilor utilizatorului pe baza lor.
Fii concis, structurat, și citează sursele când e relevant.
Răspunde în limba în care ți se pune întrebarea.

SURSE DISPONIBILE:
${sourceContext || "Nicio sursă selectată. Cere utilizatorului să adauge surse."}`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("notebook-chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
