import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * llm-crawler — Crawls site pages, parses content, extracts entities,
 * computes scores, and detects indexation issues.
 *
 * POST /llm-crawler { action: "crawl" | "analyze" | "score" | "detect-issues", limit?: number }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const SITE_BASE = "https://ai-idei.com";

// Known static routes from ROUTE_TREE
const STATIC_ROUTES = [
  "/", "/auth", "/links", "/architecture", "/docs", "/changelog",
  "/contradictions", "/applications",
  "/profiles", "/topics", "/media/profiles", "/library",
  "/home", "/neurons", "/dashboard", "/extractor", "/services", "/jobs",
  "/credits", "/intelligence", "/prompt-forge", "/profile-extractor",
  "/profile", "/notifications", "/feedback", "/guests", "/onboarding",
  "/community", "/marketplace", "/admin",
  "/docs/getting-started/overview", "/docs/foundation/neuron-model",
  "/docs/pipeline/extraction", "/docs/architecture/overview",
];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  const jsonResp = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Admin auth check
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }

  const { data: roleData } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", user.id).eq("role", "admin").single();
  if (!roleData) {
    return jsonResp({ error: "Admin access required" }, 403);
  }

  // Rate limit (user-based, post-auth)
  const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 10, windowSeconds: 60 }, corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "crawl", limit = 50 } = body;

    switch (action) {
      case "crawl":
        return await handleCrawl(supabase, jsonResp, limit);
      case "analyze":
        return await handleAnalyze(supabase, LOVABLE_API_KEY, jsonResp, limit);
      case "score":
        return await handleScore(supabase, jsonResp);
      case "detect-issues":
        return await handleDetectIssues(supabase, jsonResp);
      default:
        return jsonResp({ error: "Invalid action" }, 400);
    }
  } catch (err) {
    console.error("llm-crawler error:", err);
    return jsonResp({ error: err instanceof Error ? err.message : "Unknown" }, 500);
  }
});

type JsonResp = (data: any, status?: number) => Response;

/** CRAWL — Discover and register pages */
async function handleCrawl(supabase: any, jsonResp: JsonResp, limit: number) {
  let discovered = 0;
  let updated = 0;

  for (const route of STATIC_ROUTES.slice(0, limit)) {
    const url = `${SITE_BASE}${route}`;

    const { data: existing } = await supabase
      .from("site_pages").select("id").eq("url", url).single();

    if (existing) {
      await supabase.from("site_pages")
        .update({ last_scan: new Date().toISOString(), status_code: 200 })
        .eq("id", existing.id);
      updated++;
    } else {
      let pageType = "page";
      if (route === "/") pageType = "landing";
      else if (route.startsWith("/docs")) pageType = "documentation";
      else if (["/contradictions", "/applications", "/profiles", "/library"].some(p => route.startsWith(p))) pageType = "knowledge";
      else if (route.startsWith("/admin")) pageType = "admin";
      else if (["/home", "/dashboard", "/neurons", "/extractor", "/services"].includes(route)) pageType = "app";

      await supabase.from("site_pages").insert({
        url,
        title: routeToTitle(route),
        page_type: pageType,
        status_code: 200,
        last_scan: new Date().toISOString(),
      });
      discovered++;
    }
  }

  // Also discover entity pages
  const { data: entities } = await supabase
    .from("entities")
    .select("slug, entity_type, name")
    .eq("is_published", true)
    .limit(limit);

  for (const entity of (entities || [])) {
    const url = `${SITE_BASE}/${entity.entity_type}s/${entity.slug}`;
    const { data: ex } = await supabase.from("site_pages").select("id").eq("url", url).single();
    if (!ex) {
      await supabase.from("site_pages").insert({
        url,
        title: entity.name,
        page_type: "knowledge",
        status_code: 200,
        last_scan: new Date().toISOString(),
      });
      discovered++;
    }
  }

  // Discover topic pages
  const { data: topics } = await supabase
    .from("topics")
    .select("slug, title")
    .limit(limit);

  for (const topic of (topics || [])) {
    const url = `${SITE_BASE}/topics/${topic.slug}`;
    const { data: ex } = await supabase.from("site_pages").select("id").eq("url", url).single();
    if (!ex) {
      await supabase.from("site_pages").insert({
        url,
        title: topic.title,
        page_type: "knowledge",
        status_code: 200,
        last_scan: new Date().toISOString(),
      });
      discovered++;
    }
  }

  // Discover blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title")
    .eq("status", "published")
    .limit(limit);

  for (const post of (posts || [])) {
    const url = `${SITE_BASE}/blog/${post.slug}`;
    const { data: ex } = await supabase.from("site_pages").select("id").eq("url", url).single();
    if (!ex) {
      await supabase.from("site_pages").insert({
        url,
        title: post.title,
        page_type: "blog",
        status_code: 200,
        last_scan: new Date().toISOString(),
      });
      discovered++;
    }
  }

  return jsonResp({ discovered, updated, total_routes: STATIC_ROUTES.length });
}

/** ANALYZE — Extract entities from pages using AI */
async function handleAnalyze(supabase: any, apiKey: string | undefined, jsonResp: JsonResp, limit: number) {
  if (!apiKey) return jsonResp({ error: "AI API key not configured" }, 400);

  const { data: pages } = await supabase
    .from("site_pages")
    .select("id, url, title, page_type")
    .is("content_hash", null)
    .order("last_scan", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (!pages?.length) return jsonResp({ analyzed: 0, message: "All pages analyzed" });

  let analyzed = 0;

  for (const page of pages) {
    try {
      // Try to fetch actual page content for better analysis
      let pageContent = "";
      try {
        const fetchResp = await fetch(page.url, {
          headers: { "User-Agent": "AI-IDEI-Crawler/1.0" },
          signal: AbortSignal.timeout(5000),
        });
        if (fetchResp.ok) {
          const html = await fetchResp.text();
          // Extract text content from HTML (strip tags)
          pageContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 3000);
        }
      } catch {
        // Fallback to title-only analysis
      }

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "You are a semantic web analyzer. Extract entities, concepts, and frameworks from the given page context. Output valid JSON only.",
            },
            {
              role: "user",
              content: `Analyze this page for LLM indexation:
URL: ${page.url}
Title: ${page.title || "Unknown"}
Type: ${page.page_type}
${pageContent ? `Content preview:\n${pageContent.slice(0, 2000)}` : ""}

Extract:
1. Key entities (people, organizations, concepts, frameworks)
2. Schema.org types that apply
3. Word count (estimate from content or title)
4. Topic keywords

Output JSON:
{
  "entities": [{"name": "...", "type": "concept|person|org|framework|tool", "confidence": 0.0-1.0}],
  "schema_types": ["Article", "SoftwareApplication", ...],
  "estimated_word_count": 500,
  "topics": ["topic1", "topic2"],
  "meta_description": "suggested meta description"
}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!aiResp.ok) continue;
      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content?.trim() || "";

      let parsed: any = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch { continue; }

      // Update page with real word count if we fetched content
      const wordCount = pageContent
        ? pageContent.split(/\s+/).filter(Boolean).length
        : (parsed.estimated_word_count || 0);

      await supabase.from("site_pages").update({
        word_count: wordCount,
        entity_count: (parsed.entities || []).length,
        schema_types: parsed.schema_types || [],
        schema_present: (parsed.schema_types || []).length > 0,
        meta_description: parsed.meta_description || page.title,
        content_hash: crypto.randomUUID().slice(0, 8),
        updated_at: new Date().toISOString(),
      }).eq("id", page.id);

      // Insert entities
      for (const entity of (parsed.entities || [])) {
        await supabase.from("llm_entities").upsert({
          page_id: page.id,
          entity_name: entity.name,
          entity_type: entity.type || "concept",
          confidence: entity.confidence || 0.5,
          description: `Extracted from ${page.title}`,
          source: page.url,
        }, { onConflict: "entity_name,page_id", ignoreDuplicates: true }).catch(() => {});
      }

      // Insert entity relationships
      const ents = parsed.entities || [];
      for (let i = 0; i < ents.length && i < 5; i++) {
        for (let j = i + 1; j < ents.length && j < 5; j++) {
          await supabase.from("entity_graph").insert({
            source_entity: ents[i].name,
            target_entity: ents[j].name,
            relation_type: "co_occurs",
            strength: Math.min(ents[i].confidence || 0.5, ents[j].confidence || 0.5),
            page_id: page.id,
          }).catch(() => {});
        }
      }

      analyzed++;
    } catch (e) {
      console.error(`Failed to analyze ${page.url}:`, e);
    }
  }

  return jsonResp({ analyzed, total_pages: pages.length });
}

/** SCORE — Compute LLM visibility scores per page */
async function handleScore(supabase: any, jsonResp: JsonResp) {
  const { data: pages } = await supabase
    .from("site_pages")
    .select("id, word_count, entity_count, schema_present, schema_types, internal_link_count");

  if (!pages?.length) return jsonResp({ scored: 0 });

  let scored = 0;
  for (const page of pages) {
    const entityDensity = Math.min(10, (page.entity_count || 0) * 1.5);
    const schemaCoverage = page.schema_present ? Math.min(10, (page.schema_types?.length || 0) * 3) : 0;
    const embeddingQuality = Math.min(10, (page.word_count || 0) / 100);
    const internalLinkScore = Math.min(10, (page.internal_link_count || 0) * 2);
    const citationProb = (entityDensity * 0.3 + schemaCoverage * 0.3 + embeddingQuality * 0.2 + internalLinkScore * 0.2);
    const visibility = (entityDensity + schemaCoverage + embeddingQuality + internalLinkScore + citationProb) / 5;

    await supabase.from("llm_scores").upsert({
      page_id: page.id,
      entity_density: Math.round(entityDensity * 100) / 100,
      schema_coverage: Math.round(schemaCoverage * 100) / 100,
      embedding_quality: Math.round(embeddingQuality * 100) / 100,
      internal_link_score: Math.round(internalLinkScore * 100) / 100,
      citation_probability: Math.round(citationProb * 100) / 100,
      llm_visibility_score: Math.round(visibility * 100) / 100,
      computed_at: new Date().toISOString(),
    }, { onConflict: "page_id" });

    await supabase.from("site_pages").update({
      llm_visibility_score: Math.round(visibility * 100) / 100,
    }).eq("id", page.id);

    scored++;
  }

  return jsonResp({ scored });
}

/** DETECT ISSUES — Find indexation problems */
async function handleDetectIssues(supabase: any, jsonResp: JsonResp) {
  const { data: pages } = await supabase
    .from("site_pages")
    .select("id, url, title, meta_description, word_count, entity_count, schema_present, schema_types");

  if (!pages?.length) return jsonResp({ issues_found: 0 });

  let issuesFound = 0;

  for (const page of pages) {
    const issues: Array<{ type: string; severity: string; desc: string; fix: string }> = [];

    if (!page.schema_present) {
      issues.push({
        type: "missing_schema",
        severity: "high",
        desc: `Page ${page.url} has no schema.org markup`,
        fix: "Add JSON-LD structured data matching content type",
      });
    }

    if (!page.title || page.title.length < 10) {
      issues.push({
        type: "weak_title",
        severity: "medium",
        desc: `Title "${page.title || 'none'}" is too short or missing`,
        fix: "Add descriptive title with primary keyword (50-60 chars)",
      });
    }

    if (!page.meta_description || page.meta_description.length < 50) {
      issues.push({
        type: "missing_meta",
        severity: "medium",
        desc: "Meta description missing or too short",
        fix: "Add informative meta description (120-155 chars)",
      });
    }

    if ((page.entity_count || 0) < 2) {
      issues.push({
        type: "low_entities",
        severity: "low",
        desc: "Page has fewer than 2 extractable entities",
        fix: "Enrich content with named concepts, frameworks, or references",
      });
    }

    if ((page.word_count || 0) < 200 && page.url !== `${SITE_BASE}/`) {
      issues.push({
        type: "thin_content",
        severity: "medium",
        desc: `Only ${page.word_count || 0} words — too thin for LLM retrieval`,
        fix: "Expand content to at least 500 words with structured sections",
      });
    }

    for (const issue of issues) {
      const { data: existing } = await supabase
        .from("llm_issues")
        .select("id")
        .eq("page_id", page.id)
        .eq("issue_type", issue.type)
        .is("resolved_at", null)
        .single();

      if (!existing) {
        await supabase.from("llm_issues").insert({
          page_id: page.id,
          issue_type: issue.type,
          severity: issue.severity,
          description: issue.desc,
          suggested_fix: issue.fix,
          auto_fix_available: ["missing_schema", "weak_title", "missing_meta"].includes(issue.type),
        });
        issuesFound++;
      }
    }
  }

  return jsonResp({ issues_found: issuesFound, pages_checked: pages.length });
}

function routeToTitle(route: string): string {
  if (route === "/") return "AI-IDEI — Knowledge Operating System";
  const parts = route.split("/").filter(Boolean);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " ")).join(" — ");
}
