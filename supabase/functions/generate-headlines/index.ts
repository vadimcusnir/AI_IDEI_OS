import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ești un copywriter expert în Direct Response, specializat în limba română.

Generezi titluri folosind formula canonică în 7 straturi:
1. VERB EXTREM — acțiune violentă, vizuală, care rupe pattern-ul
2. THREE-LAYER PAIN STACK — 3 dureri concrete, specifice, tactile
3. SABOTAGE CLAUSE — "care îți sabotează / te ține pe loc / te blochează"
4. CREDIBLE PIVOT — "în timp ce / fără ca / chiar dacă"
5. IDENTITY POSITIONING — "operator / arhitect / strateg / orchestrator"
6. AGENCY ACTION — acțiune cu control, fără efort perceput
7. CLOSING AMPLIFICATION TRIAD — "mai X, mai Y și cu Z" (3 beneficii crescătoare)

REGULI STRICTE:
- Fiecare titlu trebuie să fie lung (50-120 cuvinte), nu scurt
- ZERO clișee: nu "secret", nu "hack", nu "truc", nu "simplu", nu "ușor"
- Titlurile trebuie să fie în ROMÂNĂ
- Subtitlul explică mecanismul, nu repetă titlul
- Tonul: autoritar dar empatic, profesional dar accesibil
- Nu promite rezultate garantate sau sume de bani

Răspunde EXCLUSIV cu un JSON array valid, fără markdown, fără explicații:
[{"title":"...","subtitle":"..."},{"title":"...","subtitle":"..."},{"title":"...","subtitle":"..."}]`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authenticate via JWT ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit guard (user-based)
    const rateLimited = rateLimitGuard(user.id, req, { maxRequests: 15, windowSeconds: 60 }, corsHeaders);
    if (rateLimited) return rateLimited;

    const { topic, audience, pain } = await req.json();

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build user prompt
    const userPrompt = [
      `TOPIC: ${topic}`,
      audience ? `PUBLIC ȚINTĂ: ${audience}` : "",
      pain ? `DURERE PRIMARĂ: ${pain}` : "",
      "",
      "Generează exact 3 titluri Direct Response în română, urmând formula canonică în 7 straturi.",
    ]
      .filter(Boolean)
      .join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.9,
          max_tokens: 2000,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", errText);
      throw new Error(`AI Gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response (handle potential markdown wrapping)
    let headlines;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      headlines = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      headlines = [];
    }

    return new Response(
      JSON.stringify({ headlines }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-headlines error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
