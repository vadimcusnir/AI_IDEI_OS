import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * llm-audit — Scans pages for LLM indexation issues and generates AI fix suggestions.
 * 
 * POST /llm-audit { action: "scan" | "fix", page_paths?: string[] }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const BASE_URL = "https://ai-idei.com";

const KNOWN_ROUTES = [
  { path: "/", title: "Home", type: "landing", schemas: ["Organization", "WebApplication"] },
  { path: "/extractor", title: "Extractor", type: "tool", schemas: ["WebApplication"] },
  { path: "/intelligence", title: "Intelligence", type: "content", schemas: ["Dataset"] },
  { path: "/services", title: "Services", type: "content", schemas: ["Service"] },
  { path: "/marketplace", title: "Marketplace", type: "content", schemas: ["Product"] },
  { path: "/community", title: "Community", type: "content", schemas: ["DiscussionForumPosting"] },
  { path: "/library", title: "Library", type: "content", schemas: ["CollectionPage"] },
  { path: "/docs", title: "Documentation", type: "content", schemas: ["TechArticle"] },
  { path: "/api", title: "API", type: "content", schemas: ["WebAPI"] },
  { path: "/changelog", title: "Changelog", type: "content", schemas: ["ItemList"] },
  { path: "/landing", title: "Landing", type: "landing", schemas: ["Organization", "FAQPage"] },
  { path: "/credits", title: "Credits", type: "content", schemas: ["Offer"] },
  { path: "/links", title: "Links", type: "content", schemas: ["Person"] },
  { path: "/gamification", title: "Gamification", type: "content", schemas: [] },
  { path: "/privacy", title: "Privacy Policy", type: "legal", schemas: [] },
  { path: "/terms", title: "Terms of Service", type: "legal", schemas: [] },
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

  // Auth check — admin only
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
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();
  
  if (!roleData) {
    return jsonResp({ error: "Admin access required" }, 403);
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":llm-audit", req, { maxRequests: 20, windowSeconds: 60 }, corsHeaders);
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));
    const { action = "scan" } = body;

    if (action === "scan") {
      return await handleScan(supabase, jsonResp);
    } else if (action === "fix" && LOVABLE_API_KEY) {
      return await handleFix(supabase, LOVABLE_API_KEY, jsonResp);
    } else {
      return jsonResp({ error: "Invalid action or missing API key" }, 400);
    }
  } catch (err) {
    console.error("llm-audit error:", err);
    return jsonResp({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

type JsonResp = (data: any, status?: number) => Response;

async function handleScan(supabase: any, jsonResp: JsonResp) {
  const results: any[] = [];

  for (const route of KNOWN_ROUTES) {
    const issues: any[] = [];

    if (route.schemas.length > 0) {
      issues.push({
        type: "schema_check",
        severity: "info",
        message: `Expected schemas: ${route.schemas.join(", ")}`,
      });
    }

    if (route.type === "content" && !route.schemas.length) {
      issues.push({
        type: "missing_schema",
        severity: "medium",
        message: "No structured data schema defined for this content page",
      });
    }

    results.push({
      page_path: route.path,
      page_title: route.title,
      page_type: route.type,
      schema_types: route.schemas,
      issues,
      overall_score: route.schemas.length > 0 ? 7.5 : 4.0,
      topic_clarity_score: 7.0,
      entity_density_score: route.type === "content" ? 6.5 : 3.0,
      semantic_links_score: 5.0,
      last_crawled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Scan entity pages
  const { data: entities } = await supabase
    .from("entities")
    .select("slug, entity_type, name, summary, tags")
    .eq("is_published", true)
    .limit(500);

  const entityTypes: Record<string, string> = {
    insight: "insights", pattern: "patterns", formula: "formulas",
    contradiction: "contradictions", application: "applications", profile: "profiles",
  };

  for (const entity of (entities || [])) {
    const plural = entityTypes[entity.entity_type] || entity.entity_type + "s";
    const path = `/${plural}/${entity.slug}`;
    const issues: any[] = [];

    if (!entity.summary || entity.summary.length < 50) {
      issues.push({ type: "thin_content", severity: "high", message: "Summary too short (<50 chars)" });
    }
    if (!entity.tags || entity.tags.length === 0) {
      issues.push({ type: "missing_tags", severity: "medium", message: "No tags defined" });
    }

    const hasSchema = true;
    const score = Math.min(10, (entity.summary?.length > 100 ? 3 : 1) + (entity.tags?.length || 0) * 0.5 + (hasSchema ? 3 : 0) + 2);

    results.push({
      page_path: path,
      page_title: entity.name,
      page_type: "entity",
      schema_types: ["CreativeWork"],
      entity_count: 1,
      word_count: (entity.summary || "").split(/\s+/).length,
      issues,
      overall_score: score,
      topic_clarity_score: entity.summary?.length > 100 ? 8.0 : 4.0,
      entity_density_score: 8.0,
      semantic_links_score: entity.tags?.length > 2 ? 7.0 : 3.0,
      last_crawled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Scan guest profiles
  const { data: guests } = await supabase
    .from("guest_profiles")
    .select("id, full_name, bio")
    .limit(200);

  for (const guest of (guests || [])) {
    const path = `/guests/${guest.id}`;
    const issues: any[] = [];

    if (!guest.bio || guest.bio.length < 50) {
      issues.push({ type: "thin_content", severity: "medium", message: "Bio too short" });
    }

    results.push({
      page_path: path,
      page_title: guest.full_name,
      page_type: "person",
      schema_types: ["Person"],
      word_count: (guest.bio || "").split(/\s+/).length,
      issues,
      overall_score: guest.bio?.length > 100 ? 8.0 : 5.0,
      topic_clarity_score: 7.0,
      entity_density_score: 6.0,
      semantic_links_score: 4.0,
      last_crawled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Upsert all results
  for (const result of results) {
    await supabase.from("llm_page_index").upsert(result, { onConflict: "page_path" });
  }

  const totalIssues = results.reduce((s, r) => s + (r.issues?.length || 0), 0);
  const avgScore = results.length > 0
    ? (results.reduce((s, r) => s + r.overall_score, 0) / results.length).toFixed(1)
    : "0";

  return jsonResp({
    pages_scanned: results.length,
    total_issues: totalIssues,
    average_score: parseFloat(avgScore),
    static_routes: KNOWN_ROUTES.length,
    entity_pages: (entities || []).length,
    guest_pages: (guests || []).length,
  });
}

async function handleFix(supabase: any, apiKey: string, jsonResp: JsonResp) {
  const { data: pages } = await supabase
    .from("llm_page_index")
    .select("id, page_path, page_title, page_type, issues, overall_score")
    .lt("overall_score", 6)
    .order("overall_score", { ascending: true })
    .limit(20);

  if (!pages?.length) {
    return jsonResp({ fixes_generated: 0, message: "No low-scoring pages found" });
  }

  let fixCount = 0;

  for (const page of pages) {
    const issues = (page.issues as any[]) || [];
    if (issues.length === 0) continue;

    const prompt = `Analyze this web page for LLM indexation quality and suggest fixes:
Page: ${page.page_path}
Title: ${page.page_title}
Type: ${page.page_type}
Current Score: ${page.overall_score}/10
Issues: ${JSON.stringify(issues)}

For each issue, suggest a specific fix. Focus on:
1. Better title (SEO optimized, <60 chars)
2. Better meta description (informative, <160 chars)
3. Missing FAQ blocks (generate 2-3 relevant Q&As)
4. Internal link suggestions
5. Schema.org improvements

Output as JSON array: [{ "issue_type": "...", "current_value": "...", "suggested_value": "...", "reasoning": "..." }]`;

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
            { role: "system", content: "You are an SEO expert specializing in LLM indexation. Output valid JSON only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!aiResp.ok) continue;

      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content?.trim() || "";
      
      let fixes: any[] = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) fixes = JSON.parse(jsonMatch[0]);
      } catch { continue; }

      for (const fix of fixes) {
        await supabase.from("llm_fix_suggestions").insert({
          page_id: page.id,
          issue_type: fix.issue_type || "general",
          severity: fix.severity || "medium",
          current_value: fix.current_value || "",
          suggested_value: fix.suggested_value || "",
          ai_reasoning: fix.reasoning || "",
          status: "pending",
        });
        fixCount++;
      }
    } catch (e) {
      console.error(`Fix generation failed for ${page.page_path}:`, e);
    }
  }

  return jsonResp({ fixes_generated: fixCount, pages_analyzed: pages.length });
}
