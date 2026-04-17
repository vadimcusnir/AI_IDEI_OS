import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { aiCallWithRetry, extractAiContent } from "../_shared/ai-retry.ts";
import { seoTransform } from "./seo-transform.ts";
import { hardValidateArticle } from "../_shared/blog-validation.ts";
import { extractImageBytes, uploadOptimizedImage } from "../_shared/image-optimize.ts";
import { moderateContent } from "../_shared/content-moderation.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import {
  NORMALIZER_SYSTEM,
  PLANNER_SYSTEM,
  RENDERER_SYSTEM,
  VALIDATOR_SYSTEM,
  REPAIR_SYSTEM,
} from "../_shared/blog-prompts.ts";

/**
 * Blog Post Generator — AI-IDEI Content Marketing Engine (5-Stage Pipeline)
 * Stages: Normalize → Plan → Render → Validate → Repair
 * 
 * POST: Generate a new blog post (admin only)
 *   body: { topic?: string, topic_id?: string, category?: string, schedule_hours?: number, pipeline?: "5-stage" | "single-shot" }
 * 
 * POST /publish: Publish scheduled posts (called by cron)
 */

const CATEGORIES = [
  "knowledge-extraction", "ai-strategy", "content-intelligence",
  "cognitive-frameworks", "digital-economics", "creator-systems",
];

const IMAGE_STYLE_PROMPT = `Style requirements (MANDATORY):
- Dark background using colors #0A0A0F to #111118
- Gold-oxide accent lines and elements (#D4A843)
- Petrol/teal secondary color (#1A3A4A)
- Subtle noise texture overlay feel
- Geometric precision, clean lines
- NO photorealism, NO stock photo style
- Technical-premium aesthetic
- Minimal or no text in the image
- Abstract/conceptual representation`;

function repairAndParseJson(raw: string): any {
  let cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /* continue */ }

  const jsonStart = cleaned.search(/[{[]/);
  if (jsonStart === -1) return null;
  const opener = cleaned[jsonStart];
  const closer = opener === "{" ? "}" : "]";
  const jsonEnd = cleaned.lastIndexOf(closer);
  if (jsonEnd <= jsonStart) {
    cleaned = cleaned.substring(jsonStart);
  } else {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  cleaned = cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === "\n" || ch === "\t" ? ch : "");

  try { return JSON.parse(cleaned); } catch { /* continue */ }

  let braces = 0, brackets = 0;
  for (const ch of cleaned) {
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }
  let repaired = cleaned;
  while (brackets > 0) { repaired += "]"; brackets--; }
  while (braces > 0) { repaired += "}"; braces--; }

  try { return JSON.parse(repaired); } catch (e) {
    console.error("[blog-generate] JSON repair failed:", (e as Error).message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  // Rate limit guard (IP-based)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimited = await rateLimitGuard(clientIp + ":blog-generate", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
  if (rateLimited) return rateLimited;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "AI key not configured" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const isPublishAction = url.pathname.endsWith("/publish");

    // === AUTO-PUBLISH ENDPOINT ===
    if (isPublishAction) {
      const now = new Date().toISOString();
      const { data: posts, error } = await supabase
        .from("blog_posts")
        .update({ status: "published", published_at: now })
        .eq("status", "scheduled")
        .lte("scheduled_at", now)
        .select("id, title");

      return new Response(JSON.stringify({ published: posts?.length || 0, posts }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // === AUTH CHECK (admin only) ===
    const authHeader = req.headers.get("authorization") || "";
    let isAdminUser = false;
    let userId = "";

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (user && !authErr) {
        const { data: roleCheck } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        isAdminUser = !!roleCheck;
        userId = user.id;
      }
    }

    // Allow cron (no auth) or admin users
    const isCronCall = !authHeader;
    if (!isAdminUser && !isCronCall) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const pipelineMode = body.pipeline || "5-stage";
    const scheduleHours = body.schedule_hours ?? 0;

    // Resolve topic: from body, topic_id, or random from DB
    let topicHint = body.topic || "";
    let topicId = body.topic_id || null;
    let category = body.category || "";

    if (!topicHint) {
      // Try to get a pending topic from the topic bank
      const { data: nextTopic } = await supabase
        .from("blog_topics")
        .select("id, title, category")
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .limit(1)
        .single();

      if (nextTopic) {
        topicHint = nextTopic.title;
        topicId = nextTopic.id;
        category = nextTopic.category;
        // Mark as processing
        await supabase.from("blog_topics").update({ status: "processing" }).eq("id", nextTopic.id);
      } else {
        // Fallback to random category
        topicHint = "AI-powered knowledge extraction trends and practical applications";
        category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      }
    }

    if (!category) category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    let articleData: any;
    let pipelineScores: any = null;

    if (pipelineMode === "5-stage") {
      // ═══ STAGE 1: NORMALIZE ═══
      console.log("[blog-generate] Stage 1: Normalize");
      const normalizeResp = await aiCallWithRetry(LOVABLE_API_KEY, {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: NORMALIZER_SYSTEM },
          { role: "user", content: `Topic: ${topicHint}\nCategory: ${category}` },
        ],
        temperature: 0.5, max_tokens: 2000,
      });
      const normalized = repairAndParseJson(extractAiContent(normalizeResp));
      if (!normalized) {
        console.error("[blog-generate] Normalize stage failed, falling back to single-shot");
        articleData = await singleShotGenerate(LOVABLE_API_KEY, topicHint, category);
      } else {
        // ═══ STAGE 2: PLAN ═══
        console.log("[blog-generate] Stage 2: Plan");
        const planResp = await aiCallWithRetry(LOVABLE_API_KEY, {
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: PLANNER_SYSTEM },
            { role: "user", content: `Normalized analysis:\n${JSON.stringify(normalized, null, 2)}` },
          ],
          temperature: 0.5, max_tokens: 3000,
        });
        const plan = repairAndParseJson(extractAiContent(planResp));

        // ═══ STAGE 3: RENDER ═══
        console.log("[blog-generate] Stage 3: Render");
        const renderResp = await aiCallWithRetry(LOVABLE_API_KEY, {
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: RENDERER_SYSTEM },
            { role: "user", content: `Topic: ${topicHint}\nCategory: ${category}\n\nNormalized analysis:\n${JSON.stringify(normalized, null, 2)}\n\nEditorial plan:\n${JSON.stringify(plan || {}, null, 2)}` },
          ],
          temperature: 0.7, max_tokens: 8000,
        });
        articleData = repairAndParseJson(extractAiContent(renderResp));

        if (articleData?.title && articleData?.content) {
          // ═══ STAGE 4: VALIDATE ═══
          console.log("[blog-generate] Stage 4: Validate");
          const validateResp = await aiCallWithRetry(LOVABLE_API_KEY, {
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: VALIDATOR_SYSTEM },
              { role: "user", content: `Topic: ${topicHint}\n\nArticle JSON:\n${JSON.stringify(articleData, null, 2)}` },
            ],
            temperature: 0.3, max_tokens: 2000,
          });
          const validation = repairAndParseJson(extractAiContent(validateResp));
          pipelineScores = validation?.scores || null;

          // ═══ STAGE 5: REPAIR (conditional) ═══
          if (validation?.decision === "repair" && validation?.repair_instructions) {
            console.log("[blog-generate] Stage 5: Repair");
            const repairResp = await aiCallWithRetry(LOVABLE_API_KEY, {
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: REPAIR_SYSTEM },
                { role: "user", content: `Original article:\n${JSON.stringify(articleData, null, 2)}\n\nRepair instructions:\n${validation.repair_instructions}` },
              ],
              temperature: 0.5, max_tokens: 8000,
            });
            const repaired = repairAndParseJson(extractAiContent(repairResp));
            if (repaired?.title && repaired?.content) {
              articleData = repaired;
            }
          } else if (validation?.decision === "reject") {
            console.log("[blog-generate] Validator rejected, falling back to single-shot");
            articleData = await singleShotGenerate(LOVABLE_API_KEY, topicHint, category);
            pipelineScores = null;
          }
        } else {
          console.log("[blog-generate] Render failed, falling back to single-shot");
          articleData = await singleShotGenerate(LOVABLE_API_KEY, topicHint, category);
        }
      }
    } else {
      articleData = await singleShotGenerate(LOVABLE_API_KEY, topicHint, category);
    }

    if (!articleData?.title || !articleData?.content) {
      // Update topic status to failed
      if (topicId) await supabase.from("blog_topics").update({ status: "failed" }).eq("id", topicId);
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ═══ HARD VALIDATION (code-level) ═══
    const hardResult = hardValidateArticle(articleData);
    console.log("[blog-generate] Hard validation:", hardResult.valid ? "PASS" : "FAIL", hardResult.errors);

    if (!hardResult.valid) {
      // One repair attempt
      console.log("[blog-generate] Hard validation failed, attempting repair");
      const repairResp = await aiCallWithRetry(LOVABLE_API_KEY, {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: REPAIR_SYSTEM },
          { role: "user", content: `Article:\n${JSON.stringify(articleData, null, 2)}\n\nRepair these structural issues:\n${hardResult.errors.join("\n")}` },
        ],
        temperature: 0.5, max_tokens: 8000,
      });
      const repaired = repairAndParseJson(extractAiContent(repairResp));
      if (repaired?.title && repaired?.content) {
        const recheck = hardValidateArticle(repaired);
        if (recheck.valid) {
          articleData = repaired;
        } else {
          console.error("[blog-generate] Repair failed hard validation again");
        }
      }
    }

    // ═══ CONTENT MODERATION ═══
    console.log("[blog-generate] Running content moderation...");
    const modResult = await moderateContent(LOVABLE_API_KEY, articleData.content, articleData.title);
    if (!modResult.pass) {
      console.error("[blog-generate] Content moderation FAILED:", modResult.reason, modResult.flagged_dimensions);
      if (topicId) await supabase.from("blog_topics").update({ status: "failed" }).eq("id", topicId);
      return new Response(JSON.stringify({
        error: "Content moderation failed",
        reason: modResult.reason,
        flagged: modResult.flagged_dimensions,
        scores: modResult.scores,
      }), {
        status: 422, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (!pipelineScores) pipelineScores = {};
    pipelineScores.moderation = modResult.scores;

    // ═══ GENERATE THUMBNAIL ═══
    console.log("[blog-generate] Generating thumbnail...");
    let thumbnailUrl = "";
    try {
      const thumbResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{
            role: "user",
            content: `Generate an image: ${articleData.thumbnail_prompt || articleData.title}. ${IMAGE_STYLE_PROMPT}. Aspect ratio: 16:9, landscape orientation. Abstract and conceptual.`,
          }],
          modalities: ["image", "text"],
        }),
      });
      const thumbData = await thumbResp.json();
      const base64 = thumbData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (base64) {
        const { bytes, contentType, extension } = extractImageBytes(base64);
        const fileName = `thumbnails/${articleData.slug}-thumb.${extension}`;
        const url = await uploadOptimizedImage(supabase, "blog-images", fileName, bytes, contentType);
        if (url) thumbnailUrl = url;
      }
    } catch (e) { console.error("[blog-generate] Thumbnail failed:", e); }

    // ═══ GENERATE INLINE IMAGES ═══
    console.log("[blog-generate] Generating inline images...");
    const inlineImages: Array<{ key: string; url: string; prompt: string }> = [];
    const imagePrompts = articleData.image_prompts || [];

    for (let i = 0; i < imagePrompts.length; i += 2) {
      const batch = imagePrompts.slice(i, i + 2);
      const results = await Promise.allSettled(
        batch.map(async (img: { key: string; prompt: string }) => {
          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{
                role: "user",
                content: `Generate an image: ${img.prompt}. ${IMAGE_STYLE_PROMPT}. Inline blog illustration. Create a diagram, mind map, schema, or visual metaphor. Aspect ratio: 3:2, landscape.`,
              }],
              modalities: ["image", "text"],
            }),
          });
          const data = await resp.json();
          const base64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!base64) throw new Error("No image in response");
          const { bytes, contentType, extension } = extractImageBytes(base64);
          const fileName = `inline/${articleData.slug}-${img.key.toLowerCase()}.${extension}`;
          const url = await uploadOptimizedImage(supabase, "blog-images", fileName, bytes, contentType);
          if (!url) throw new Error("Upload failed");
          return { key: img.key, url, prompt: img.prompt };
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") inlineImages.push(r.value);
      }
      if (i + 2 < imagePrompts.length) await new Promise(r => setTimeout(r, 2000));
    }

    // Replace image placeholders
    let finalContent = articleData.content;
    for (const img of inlineImages) {
      const placeholder = new RegExp(`\\[${img.key}:[^\\]]*\\]`, "g");
      finalContent = finalContent.replace(placeholder, `\n\n![${img.prompt}](${img.url})\n\n`);
    }
    finalContent = finalContent.replace(/\[IMAGE_\d+:[^\]]*\]/g, "");

    const wordCount = finalContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // ═══ AUTO-INTERLINK: find related posts ═══
    let relatedPostIds: string[] = [];
    try {
      const { data: existingPosts } = await supabase
        .from("blog_posts")
        .select("id, title, tags, category")
        .eq("status", "published")
        .limit(100);

      if (existingPosts?.length) {
        const newTags = new Set((articleData.tags || []).map((t: string) => t.toLowerCase()));
        const scored = existingPosts
          .map((p: any) => {
            let score = 0;
            if (p.category === category) score += 2;
            const pTags = (p.tags || []).map((t: string) => t.toLowerCase());
            for (const t of pTags) { if (newTags.has(t)) score += 3; }
            return { id: p.id, score };
          })
          .filter((s: any) => s.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5);
        relatedPostIds = scored.map((s: any) => s.id);
      }
    } catch (e) { console.error("[blog-generate] Interlink failed:", e); }

    // ═══ SAVE TO DB ═══
    const scheduledAt = scheduleHours > 0
      ? new Date(Date.now() + scheduleHours * 3600000).toISOString()
      : null;

    // ═══ AUTO-PREMIUM RULES ═══
    // Marchează ca premium dacă: long-form (≥1800 words) SAU categorie strategică SAU depth score ridicat
    const PREMIUM_CATEGORIES = new Set(["cognitive-frameworks", "digital-economics", "ai-strategy"]);
    const depthScore = Number((pipelineScores as any)?.depth_score ?? (pipelineScores as any)?.depth ?? 0);
    const isPremiumAuto =
      wordCount >= 1800 ||
      PREMIUM_CATEGORIES.has(category) ||
      depthScore >= 0.8;
    const premiumReason = isPremiumAuto
      ? (wordCount >= 1800 ? "long_form" : PREMIUM_CATEGORIES.has(category) ? "premium_category" : "high_depth_score")
      : null;

    const { data: post, error: insertErr } = await supabase
      .from("blog_posts")
      .insert({
        title: articleData.title,
        slug: articleData.slug,
        excerpt: articleData.excerpt,
        content: finalContent,
        thumbnail_url: thumbnailUrl,
        inline_images: inlineImages,
        category,
        tags: articleData.tags || [],
        status: scheduledAt ? "scheduled" : "draft",
        scheduled_at: scheduledAt,
        author_id: userId || null,
        seo_title: articleData.title,
        seo_description: articleData.seo_description || articleData.excerpt,
        reading_time_min: readingTime,
        word_count: wordCount,
        pipeline_stage: pipelineMode,
        pipeline_scores: pipelineScores,
        related_post_ids: relatedPostIds,
        is_premium: isPremiumAuto,
        metadata: {
          premium_auto: isPremiumAuto,
          premium_reason: premiumReason,
          generated_at: new Date().toISOString(),
          topic_seed: topicHint,
          topic_id: topicId,
          images_generated: inlineImages.length,
          has_thumbnail: !!thumbnailUrl,
          pipeline_mode: pipelineMode,
          hard_validation: hardValidateArticle(articleData),
        },
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[blog-generate] Insert error:", insertErr);
      if (topicId) await supabase.from("blog_topics").update({ status: "failed" }).eq("id", topicId);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Update topic status
    if (topicId) {
      await supabase.from("blog_topics")
        .update({ status: "completed", generated_post_id: post.id })
        .eq("id", topicId);
    }

    console.log("[blog-generate] Post created:", post.id, post.title);

    // ═══ POST-PUBLISH SEO ENRICHMENT (async, non-blocking) ═══
    let seoData = null;
    try {
      seoData = await seoTransform(LOVABLE_API_KEY, {
        id: post.id,
        title: post.title,
        content: finalContent,
        excerpt: articleData.excerpt,
        slug: articleData.slug,
        category,
        tags: articleData.tags || [],
      });
      if (seoData) {
        await supabase.from("blog_posts").update({
          seo_title: seoData.seo_title || post.seo_title,
          seo_description: seoData.meta_description || post.seo_description,
          metadata: {
            ...post.metadata as any,
            seo_enrichment: seoData,
          },
        }).eq("id", post.id);
        console.log("[blog-generate] SEO enrichment applied for:", post.id);
      }
    } catch (seoErr) {
      console.error("[blog-generate] SEO enrichment failed (non-critical):", seoErr);
    }

    return new Response(JSON.stringify({
      success: true,
      post: { id: post.id, title: post.title, slug: post.slug, status: post.status },
      pipeline: pipelineMode,
      scores: pipelineScores,
      images: { thumbnail: !!thumbnailUrl, inline: inlineImages.length },
      related: relatedPostIds.length,
      seo: !!seoData,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[blog-generate] Error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

// ═══ FALLBACK: Single-shot generation ═══
async function singleShotGenerate(apiKey: string, topic: string, category: string) {
  const resp = await aiCallWithRetry(apiKey, {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: `You are an expert content writer for AI-IDEI, a knowledge extraction operating system platform.
Write a comprehensive, insightful blog post in English.

Rules:
- Title: SEO-optimized, max 70 characters, compelling
- Write 1500-2500 words
- Use markdown formatting with ## for H2 sections and ### for H3
- Include 5-7 H2 sections
- Each section should be 200-400 words
- Include practical insights, not generic advice
- Write with authority and depth
- Include a compelling introduction (150-200 words)
- Include a conclusion with clear takeaway
- Generate an excerpt (2-3 sentences, max 160 chars for SEO)
- Generate an SEO meta description (max 155 chars)
- Generate 3-5 relevant tags

IMPORTANT: After every 250-300 words, insert a placeholder like [IMAGE_N: description of what the image should show].

Output format (strict JSON):
{
  "title": "...",
  "slug": "...",
  "excerpt": "...",
  "seo_description": "...",
  "content": "... markdown with [IMAGE_N: ...] placeholders ...",
  "tags": ["tag1", "tag2"],
  "image_prompts": [
    { "key": "IMAGE_1", "prompt": "detailed description for AI image generation" }
  ],
  "thumbnail_prompt": "description for the thumbnail image"
}` },
      { role: "user", content: `Write a blog post about: ${topic}\nCategory: ${category}` },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });
  return repairAndParseJson(extractAiContent(resp));
}
