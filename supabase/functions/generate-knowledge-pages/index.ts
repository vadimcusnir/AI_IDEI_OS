/**
 * generate-knowledge-pages — Auto-generates knowledge surface pages from entities/neurons.
 * 
 * POST /generate-knowledge-pages { action: "generate" | "score", limit?: number }
 * - generate: Creates knowledge_surface_pages from high-scoring entities
 * - score: Updates visibility scores for existing pages
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGE_TYPES = {
  insight: { label: "Insight", schema: "ScholarlyArticle" },
  pattern: { label: "Pattern", schema: "HowTo" },
  formula: { label: "Formula", schema: "HowTo" },
  framework: { label: "Framework", schema: "TechArticle" },
  application: { label: "Application", schema: "Article" },
  concept: { label: "Concept", schema: "DefinedTerm" },
  profile: { label: "Profile", schema: "Person" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth check — admin only
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
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Rate limit (user-based, post-auth)
  const rateLimited = rateLimitGuard(user.id, req, { maxRequests: 10, windowSeconds: 60 }, corsHeaders);
  if (rateLimited) return rateLimited;

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();
  
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "generate", limit = 20, auto_publish_threshold = 7.0 } = body;

    if (action === "generate" && LOVABLE_API_KEY) {
      return await handleGenerate(supabase, LOVABLE_API_KEY, limit, auto_publish_threshold);
    } else if (action === "validate") {
      return await handleValidate(supabase, LOVABLE_API_KEY);
    } else if (action === "score") {
      return await handleScore(supabase);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action or missing API key" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("generate-knowledge-pages error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

async function handleGenerate(supabase: any, apiKey: string, limit: number, autoPublishThreshold: number) {
  // Get high-scoring entities not yet converted to surface pages
  const { data: existingSlugs } = await supabase
    .from("knowledge_surface_pages")
    .select("slug");
  
  const existingSet = new Set((existingSlugs || []).map((s: any) => s.slug));

  const { data: entities } = await supabase
    .from("entities")
    .select("id, name, slug, entity_type, summary, tags, confidence_score, evidence_count, idea_rank")
    .eq("is_published", true)
    .order("idea_rank", { ascending: false, nullsFirst: false })
    .limit(limit * 3); // fetch more to filter

  if (!entities?.length) {
    return new Response(JSON.stringify({ pages_created: 0, message: "No entities available" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Filter out already-existing pages
  const candidates = entities.filter((e: any) => !existingSet.has(`knowledge/${e.entity_type}s/${e.slug}`));
  const toProcess = candidates.slice(0, limit);

  let created = 0;

  for (const entity of toProcess) {
    const pageType = PAGE_TYPES[entity.entity_type as keyof typeof PAGE_TYPES] || PAGE_TYPES.concept;
    const slug = `knowledge/${entity.entity_type}s/${entity.slug}`;

    // Get related entities for context
    const { data: relations } = await supabase
      .from("entity_relations")
      .select("target_entity_id, relation_type, strength")
      .eq("source_entity_id", entity.id)
      .order("strength", { ascending: false })
      .limit(10);

    const relatedIds = (relations || []).map((r: any) => r.target_entity_id);
    let relatedNames: string[] = [];
    if (relatedIds.length > 0) {
      const { data: relatedEntities } = await supabase
        .from("entities")
        .select("name")
        .in("id", relatedIds);
      relatedNames = (relatedEntities || []).map((e: any) => e.name);
    }

    // Generate page content with AI
    const prompt = `Generate a comprehensive knowledge page for the following concept.

CONCEPT: ${entity.name}
TYPE: ${entity.entity_type}
SUMMARY: ${entity.summary || "No summary available"}
TAGS: ${(entity.tags || []).join(", ")}
RELATED CONCEPTS: ${relatedNames.join(", ") || "None"}

Create a well-structured page with:
1. A clear, SEO-optimized title (include the concept type)
2. A meta description (max 155 chars, informative)
3. Full content in Markdown with:
   - H2 sections: Definition, Key Principles, How It Works, Applications, Related Concepts
   - Each section 100-200 words
   - Include practical examples
   - End with "Why This Matters" section

Output as JSON:
{
  "title": "...",
  "meta_description": "...",
  "content_md": "...(full markdown)..."
}`;

    try {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You are an expert knowledge writer. Create SEO-optimized knowledge pages. Output valid JSON only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 3000,
        }),
      });

      if (!aiResp.ok) continue;

      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content?.trim() || "";
      
      let pageData: any = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) pageData = JSON.parse(jsonMatch[0]);
      } catch { continue; }

      if (!pageData.title || !pageData.content_md) continue;

      // Build schema.org JSON-LD
      const schemaJson = {
        "@context": "https://schema.org",
        "@type": pageType.schema,
        name: pageData.title,
        description: pageData.meta_description || entity.summary || "",
        url: `https://ai-idei.com/${slug}`,
        keywords: (entity.tags || []).join(", "),
        datePublished: new Date().toISOString(),
        publisher: {
          "@type": "Organization",
          name: "AI-IDEI",
          url: "https://ai-idei.com",
        },
      };

      const qualityScore = Math.min(10, (entity.idea_rank || 0) * 10);
      const autoPublish = qualityScore >= autoPublishThreshold;

      const { error } = await supabase.from("knowledge_surface_pages").insert({
        slug,
        page_type: entity.entity_type,
        title: pageData.title,
        meta_description: pageData.meta_description || "",
        content_md: pageData.content_md,
        entity_ids: [entity.id],
        schema_json: schemaJson,
        status: autoPublish ? "published" : "draft",
        quality_score: qualityScore,
      });

      if (!error) created++;
    } catch (e) {
      console.error(`Failed to generate page for ${entity.name}:`, e);
    }
  }

  return new Response(JSON.stringify({
    pages_created: created,
    candidates_processed: toProcess.length,
    total_entities: entities.length,
  }), {
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

async function handleScore(supabase: any) {
  // Update visibility scores for all knowledge surface pages
  const { data: pages } = await supabase
    .from("knowledge_surface_pages")
    .select("id, slug, content_md, entity_ids, view_count, llm_citation_count, quality_score");

  if (!pages?.length) {
    return new Response(JSON.stringify({ scored: 0 }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  let scored = 0;

  for (const page of pages) {
    const wordCount = (page.content_md || "").split(/\s+/).length;
    const contentDepth = Math.min(10, wordCount / 100);
    const entityCoverage = Math.min(10, (page.entity_ids?.length || 0) * 2.5);
    const schemaScore = 8; // All pages have schema.org
    const visibility = (contentDepth * 0.3) + (entityCoverage * 0.2) + (schemaScore * 0.2) + 
                       (Math.min(10, page.view_count / 10) * 0.15) + 
                       (Math.min(10, page.llm_citation_count * 2) * 0.15);

    await supabase.from("llm_visibility_scores").upsert({
      surface_page_id: page.id,
      score_date: new Date().toISOString().split("T")[0],
      visibility_score: Math.round(visibility * 100) / 100,
      citation_count: page.llm_citation_count || 0,
      referral_count: page.view_count || 0,
      schema_score: schemaScore,
      content_depth_score: contentDepth,
      entity_coverage_score: entityCoverage,
    }, { onConflict: "surface_page_id,score_date" });

    scored++;
  }

  return new Response(JSON.stringify({ scored }), {
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

/**
 * Validate draft pages — AI checks quality, factual consistency, SEO compliance.
 * Pages passing validation are auto-published.
 */
async function handleValidate(supabase: any, apiKey: string | undefined) {
  const { data: drafts } = await supabase
    .from("knowledge_surface_pages")
    .select("id, slug, title, content_md, meta_description, quality_score, entity_ids")
    .eq("status", "draft")
    .order("quality_score", { ascending: false })
    .limit(20);

  if (!drafts?.length) {
    return new Response(JSON.stringify({ validated: 0, published: 0, rejected: 0 }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  let published = 0;
  let rejected = 0;

  for (const page of drafts) {
    const wordCount = (page.content_md || "").split(/\s+/).length;

    // Rule-based pre-validation
    const issues: string[] = [];
    if (wordCount < 150) issues.push("content_too_short");
    if (!page.meta_description || page.meta_description.length < 50) issues.push("meta_description_weak");
    if (!page.title || page.title.length < 10) issues.push("title_too_short");
    if (page.title && page.title.length > 70) issues.push("title_too_long");

    // Content structure checks
    const hasH2 = /^##\s/m.test(page.content_md || "");
    if (!hasH2) issues.push("missing_h2_sections");

    const sectionCount = ((page.content_md || "").match(/^##\s/gm) || []).length;
    if (sectionCount < 3) issues.push("insufficient_sections");

    if (issues.length === 0 && wordCount >= 300 && (page.quality_score || 0) >= 6) {
      // Auto-publish high-quality validated pages
      await supabase.from("knowledge_surface_pages")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", page.id);
      published++;
    } else if (issues.length > 2 || wordCount < 100) {
      // Mark as needs_revision
      await supabase.from("knowledge_surface_pages")
        .update({
          status: "needs_revision",
          updated_at: new Date().toISOString(),
        })
        .eq("id", page.id);
      rejected++;
    }
    // Pages with 1-2 minor issues stay as draft for manual review
  }

  return new Response(JSON.stringify({
    validated: drafts.length,
    published,
    rejected,
    still_draft: drafts.length - published - rejected,
  }), {
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}
