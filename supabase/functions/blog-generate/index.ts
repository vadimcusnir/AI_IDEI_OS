import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { aiCallWithRetry, extractAiContent } from "../_shared/ai-retry.ts";

/**
 * Blog Post Generator — AI-IDEI Content Marketing Engine
 * Generates SEO-optimized blog posts with inline AI images.
 * 
 * POST: Generate a new blog post (admin only)
 *   body: { topic?: string, category?: string, schedule_hours?: number }
 * 
 * POST /publish: Publish scheduled posts (called by cron)
 */

const CATEGORIES = [
  "knowledge-extraction",
  "ai-strategy",
  "content-intelligence",
  "cognitive-frameworks",
  "digital-economics",
  "creator-systems",
];

const TOPIC_SEEDS = [
  "How AI transforms raw content into structured knowledge assets",
  "The neuron model: why atomic knowledge units outperform documents",
  "Building a personal knowledge operating system from scratch",
  "Why most content creators lose 90% of their intellectual value",
  "The economics of knowledge extraction and monetization",
  "Cognitive frameworks for decision-making under uncertainty",
  "Pattern recognition in unstructured data: practical approaches",
  "From podcast transcript to sellable intelligence report",
  "The attention economy vs the knowledge economy",
  "Why structured thinking beats raw information volume",
  "Building systems that think: knowledge graphs in practice",
  "The future of content: from consumption to extraction",
  "How to price intellectual property in the AI age",
  "Entity extraction: finding hidden connections in your content",
  "The compound effect of systematic knowledge management",
  "Digital twin of your expertise: building and monetizing",
  "Why the best creators are becoming knowledge engineers",
  "Automated insight generation: from data to actionable intelligence",
  "The knowledge supply chain: extraction, refinement, delivery",
  "Building anti-fragile content strategies with AI",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

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

    // === AUTO-PUBLISH ENDPOINT (called by cron) ===
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

    // === GENERATE ENDPOINT (admin only) ===
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleCheck } = await supabase.rpc("has_role", {
      _user_id: user.id, _role: "admin",
    });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const topicHint = body.topic || TOPIC_SEEDS[Math.floor(Math.random() * TOPIC_SEEDS.length)];
    const category = body.category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const scheduleHours = body.schedule_hours ?? 0;

    // Step 1: Generate article content
    console.log("[blog-generate] Generating article for topic:", topicHint);
    const articleResponse = await aiCallWithRetry(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert content writer for AI-IDEI, a knowledge extraction operating system platform.
Write a comprehensive, insightful blog post in English.

Rules:
- Title: SEO-optimized, max 60 characters, compelling
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

IMPORTANT: After every 250-300 words, insert a placeholder like [IMAGE_N: description of what the image should show — be specific about the concept, diagram type, or visual metaphor].

Output format (strict JSON):
{
  "title": "...",
  "slug": "...",
  "excerpt": "...",
  "seo_description": "...",
  "content": "... markdown with [IMAGE_N: ...] placeholders ...",
  "tags": ["tag1", "tag2"],
  "image_prompts": [
    { "key": "IMAGE_1", "prompt": "detailed description for AI image generation" },
    { "key": "IMAGE_2", "prompt": "..." }
  ],
  "thumbnail_prompt": "description for the thumbnail image — abstract representation of the main concept"
}`,
        },
        {
          role: "user",
          content: `Write a blog post about: ${topicHint}\nCategory: ${category}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const rawContent = extractAiContent(articleResponse);
    
    // Parse JSON from response (handle markdown code blocks)
    let articleData: any;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      articleData = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error("[blog-generate] Failed to parse article JSON");
      return new Response(JSON.stringify({ error: "Failed to parse generated content" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Step 2: Generate thumbnail
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
            content: `Generate an image: ${articleData.thumbnail_prompt || articleData.title}. ${IMAGE_STYLE_PROMPT}. Aspect ratio: 16:9, landscape orientation. The image should be abstract and conceptual, representing the core idea visually.`,
          }],
          modalities: ["image", "text"],
        }),
      });
      const thumbData = await thumbResp.json();
      const base64 = thumbData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (base64) {
        const imgData = base64.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(imgData), c => c.charCodeAt(0));
        const fileName = `thumbnails/${articleData.slug}-thumb.png`;
        await supabase.storage.from("blog-images").upload(fileName, bytes, {
          contentType: "image/png", upsert: true,
        });
        const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(fileName);
        thumbnailUrl = urlData.publicUrl;
      }
    } catch (e) {
      console.error("[blog-generate] Thumbnail generation failed:", e);
    }

    // Step 3: Generate inline images
    console.log("[blog-generate] Generating inline images...");
    const inlineImages: Array<{ key: string; url: string; prompt: string }> = [];
    const imagePrompts = articleData.image_prompts || [];

    // Process 2 at a time to avoid rate limits
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
                content: `Generate an image: ${img.prompt}. ${IMAGE_STYLE_PROMPT}. This is an inline blog illustration. Create a visual that could be a: diagram, mind map, classification schema, conceptual flowchart, or meaning metaphor. Aspect ratio: 3:2, landscape.`,
              }],
              modalities: ["image", "text"],
            }),
          });
          const data = await resp.json();
          const base64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!base64) throw new Error("No image in response");

          const imgBytes = Uint8Array.from(
            atob(base64.replace(/^data:image\/\w+;base64,/, "")),
            c => c.charCodeAt(0)
          );
          const fileName = `inline/${articleData.slug}-${img.key.toLowerCase()}.png`;
          await supabase.storage.from("blog-images").upload(fileName, imgBytes, {
            contentType: "image/png", upsert: true,
          });
          const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(fileName);
          return { key: img.key, url: urlData.publicUrl, prompt: img.prompt };
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") inlineImages.push(r.value);
      }

      // Small delay between batches
      if (i + 2 < imagePrompts.length) await new Promise(r => setTimeout(r, 2000));
    }

    // Step 4: Replace image placeholders in content
    let finalContent = articleData.content;
    for (const img of inlineImages) {
      const placeholder = new RegExp(`\\[${img.key}:[^\\]]*\\]`, "g");
      finalContent = finalContent.replace(
        placeholder,
        `\n\n![${img.prompt}](${img.url})\n\n`
      );
    }
    // Remove any unreplaced placeholders
    finalContent = finalContent.replace(/\[IMAGE_\d+:[^\]]*\]/g, "");

    // Calculate word count and reading time
    const wordCount = finalContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Step 5: Save to DB
    const scheduledAt = scheduleHours > 0
      ? new Date(Date.now() + scheduleHours * 3600000).toISOString()
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
        author_id: user.id,
        seo_title: articleData.title,
        seo_description: articleData.seo_description || articleData.excerpt,
        reading_time_min: readingTime,
        word_count: wordCount,
        metadata: {
          generated_at: new Date().toISOString(),
          topic_seed: topicHint,
          images_generated: inlineImages.length,
          has_thumbnail: !!thumbnailUrl,
        },
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[blog-generate] Insert error:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log("[blog-generate] Post created:", post.id, post.title);
    return new Response(JSON.stringify({
      success: true,
      post: { id: post.id, title: post.title, slug: post.slug, status: post.status },
      images: { thumbnail: !!thumbnailUrl, inline: inlineImages.length },
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
