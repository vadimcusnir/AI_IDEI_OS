/**
 * Post-publish SEO enrichment — called after blog post is saved.
 * Generates keyword clusters, enhanced schema.org, and product intelligence.
 */

import { aiCallWithRetry, extractAiContent } from "../_shared/ai-retry.ts";

const SEO_SYSTEM = `You are an SEO intelligence engine for AI-IDEI, a knowledge extraction OS platform.

Given a blog post, produce an SEO enrichment JSON with:

1. seo_title: Optimized title ≤60 chars with primary keyword
2. meta_description: Compelling description ≤155 chars
3. keyword_clusters: Array of 3-5 keyword groups, each with a "primary" keyword and 3-5 "related" keywords
4. schema_org: Complete Article schema.org JSON-LD object
5. internal_link_suggestions: Array of 3-5 suggested internal link anchors with target paths
6. content_score: Object with scores 1-10 for: seo_readiness, topical_authority, engagement_potential

Output strict JSON only.`;

export async function seoTransform(
  apiKey: string,
  post: { id: string; title: string; content: string; excerpt: string; slug: string; category: string; tags: string[] }
): Promise<any> {
  try {
    const contentPreview = post.content.substring(0, 3000);
    
    const resp = await aiCallWithRetry(apiKey, {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SEO_SYSTEM },
        {
          role: "user",
          content: `Enrich this blog post for SEO:

Title: ${post.title}
Slug: ${post.slug}
Category: ${post.category}
Tags: ${(post.tags || []).join(", ")}
Excerpt: ${post.excerpt}

Content (first 3000 chars):
${contentPreview}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const raw = extractAiContent(resp);
    // Parse JSON
    let cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[seo-transform] Failed:", e);
    return null;
  }
}
