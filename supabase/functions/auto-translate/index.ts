import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
const SUPPORTED_LANGUAGES = ["en", "ro", "ru"];
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ro: "Romanian",
  ru: "Russian",
};

interface TranslateRequest {
  entity_id: string;
  entity_type: "neuron" | "artifact" | "ui" | "prompt";
  source_language: string;
  title?: string;
  content: string;
  target_languages?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Auth guard — require valid JWT
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    // Rate limit guard (user-based)
    const rateLimited = await rateLimitGuard(user.id + ":auto-translate", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body: TranslateRequest = await req.json();
    const { entity_id, entity_type, source_language, title, content, target_languages } = body;

    if (!entity_id || !content || !source_language) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: entity_id, content, source_language" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const targets = (target_languages || SUPPORTED_LANGUAGES).filter(l => l !== source_language);

    // Store source language first
    await storeTranslation(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      entity_id, entity_type, language: source_language,
      title: title || null, content,
      is_auto_translated: false, source_language,
    });

    // Translate to each target language
    const results: Record<string, { title?: string; content: string }> = {};

    for (const targetLang of targets) {
      const prompt = buildTranslationPrompt(source_language, targetLang, title, content, entity_type);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a professional translator. Return ONLY the translation, no explanations or metadata." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!aiResponse.ok) {
        console.error(`Translation to ${targetLang} failed:`, aiResponse.status);
        continue;
      }

      const aiData = await aiResponse.json();
      const translatedText = aiData.choices?.[0]?.message?.content?.trim() || "";

      if (!translatedText) continue;

      // Parse title and content from response
      let translatedTitle = title;
      let translatedContent = translatedText;

      if (title && translatedText.includes("---TITLE---")) {
        const parts = translatedText.split("---CONTENT---");
        translatedTitle = parts[0]?.replace("---TITLE---", "").trim() || title;
        translatedContent = parts[1]?.trim() || translatedText;
      }

      results[targetLang] = { title: translatedTitle, content: translatedContent };

      // Store in DB
      await storeTranslation(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        entity_id, entity_type, language: targetLang,
        title: translatedTitle || null, content: translatedContent,
        is_auto_translated: true, source_language,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        entity_id,
        source: source_language,
        translated: Object.keys(results),
        results,
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("auto-translate error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Translation failed" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});

function buildTranslationPrompt(
  sourceLang: string,
  targetLang: string,
  title: string | undefined,
  content: string,
  entityType: string
): string {
  const sourceLabel = LANGUAGE_NAMES[sourceLang] || sourceLang;
  const targetLabel = LANGUAGE_NAMES[targetLang] || targetLang;

  const contextHint = {
    neuron: "This is an atomic knowledge unit (neuron) — preserve technical precision, frameworks, and domain terminology.",
    artifact: "This is a generated content artifact — maintain the tone, structure, and formatting.",
    ui: "This is a UI label/string — keep it concise and natural for the target language.",
    prompt: "This is an AI prompt — preserve instruction clarity and variable placeholders.",
  }[entityType] || "Translate accurately.";

  if (title) {
    return `Translate from ${sourceLabel} to ${targetLabel}.\n${contextHint}\n\n---TITLE---\n${title}\n---CONTENT---\n${content}\n\nReturn the translation in the same format with ---TITLE--- and ---CONTENT--- markers.`;
  }

  return `Translate from ${sourceLabel} to ${targetLabel}.\n${contextHint}\n\n${content}`;
}

async function storeTranslation(
  supabaseUrl: string,
  serviceKey: string,
  data: {
    entity_id: string;
    entity_type: string;
    language: string;
    title: string | null;
    content: string;
    is_auto_translated: boolean;
    source_language: string;
  }
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/translations`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      entity_id: data.entity_id,
      entity_type: data.entity_type,
      language: data.language,
      title: data.title,
      content: data.content,
      is_auto_translated: data.is_auto_translated,
      source_language: data.source_language,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Store translation failed for ${data.language}:`, err);
  }
}
