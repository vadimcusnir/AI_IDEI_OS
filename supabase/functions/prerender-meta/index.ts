/**
 * prerender-meta — Serves pre-rendered HTML <head> with meta/JSON-LD
 * for crawlers hitting public entity, topic, and knowledge surface pages.
 * Used by a reverse proxy or middleware to inject SEO data into SPA shell.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const BASE_URL = "https://ai-idei.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  // Rate limit by IP (public endpoint, no auth)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimited = await rateLimitGuard(`prerender:${ip}`, req, { maxRequests: 30, windowSeconds: 60 }, getCorsHeaders(req));
  if (rateLimited) return rateLimited;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { path } = await req.json();
    if (!path) throw new Error("Missing path parameter");

    let meta: {
      title: string;
      description: string;
      canonical: string;
      ogImage?: string;
      jsonLd?: Record<string, unknown>;
    } | null = null;

    // ── Entity pages: /knowledge/:type/:slug ──
    const entityMatch = path.match(/^\/knowledge\/(insights|patterns|formulas|applications|contradictions|profiles)\/(.+)$/);
    if (entityMatch) {
      const [, typePlural, slug] = entityMatch;
      const typeMap: Record<string, string> = {
        insights: "insight", patterns: "pattern", formulas: "formula",
        applications: "application", contradictions: "contradiction", profiles: "profile",
      };
      const entityType = typeMap[typePlural] || typePlural;

      const { data: entity } = await supabase
        .from("entities")
        .select("title, summary, description, meta_description, slug, entity_type, confidence_score, importance_score, evidence_count, idea_rank, json_ld")
        .eq("slug", slug)
        .eq("entity_type", entityType)
        .eq("is_published", true)
        .maybeSingle();

      if (entity) {
        meta = {
          title: `${entity.title} | AI-IDEI Knowledge`,
          description: entity.meta_description || entity.summary || entity.description || `${entity.title} — ${entityType} in AI-IDEI knowledge graph`,
          canonical: `${BASE_URL}/knowledge/${typePlural}/${slug}`,
          jsonLd: entity.json_ld as Record<string, unknown> || {
            "@context": "https://schema.org",
            "@type": "Article",
            name: entity.title,
            description: entity.summary || entity.description,
            url: `${BASE_URL}/knowledge/${typePlural}/${slug}`,
            author: { "@type": "Organization", name: "AI-IDEI" },
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
            datePublished: new Date().toISOString(),
            mainEntityOfPage: `${BASE_URL}/knowledge/${typePlural}/${slug}`,
          },
        };
      }
    }

    // ── Topic pages: /knowledge/topics/:slug ──
    const topicMatch = path.match(/^\/knowledge\/topics\/(.+)$/);
    if (!meta && topicMatch) {
      const [, slug] = topicMatch;
      const { data: topic } = await supabase
        .from("topics")
        .select("title, description, slug, entity_count")
        .eq("slug", slug)
        .maybeSingle();

      if (topic) {
        meta = {
          title: `${topic.title} | AI-IDEI Topics`,
          description: topic.description || `Explore ${topic.title} — ${topic.entity_count || 0} connected entities in the AI-IDEI knowledge graph.`,
          canonical: `${BASE_URL}/knowledge/topics/${slug}`,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: topic.title,
            description: topic.description,
            url: `${BASE_URL}/knowledge/topics/${slug}`,
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
            numberOfItems: topic.entity_count || 0,
          },
        };
      }
    }

    // ── Knowledge Surface pages: /k/* ──
    const surfaceMatch = path.match(/^\/k\/(.+)$/);
    if (!meta && surfaceMatch) {
      const [, slugPath] = surfaceMatch;
      const fullSlug = `knowledge/${slugPath}`;
      const { data: page } = await supabase
        .from("knowledge_surface_pages")
        .select("title, meta_description, slug, schema_json, published_at")
        .eq("slug", fullSlug)
        .eq("status", "published")
        .maybeSingle();

      if (page) {
        meta = {
          title: `${page.title} | AI-IDEI`,
          description: page.meta_description || page.title,
          canonical: `${BASE_URL}/k/${slugPath}`,
          jsonLd: page.schema_json as Record<string, unknown>,
        };
      }
    }

    // ── Product Surface pages: /p/* ──
    const productMatch = path.match(/^\/p\/(.+)$/);
    if (!meta && productMatch) {
      const [, slug] = productMatch;
      const { data: page } = await supabase
        .from("product_surface_pages")
        .select("title, meta_description, slug, schema_json")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (page) {
        meta = {
          title: `${page.title} | AI-IDEI`,
          description: page.meta_description || page.title,
          canonical: `${BASE_URL}/p/${slug}`,
          jsonLd: page.schema_json as Record<string, unknown>,
        };
      }
    }

    if (!meta) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Build HTML head fragment for injection
    const headHtml = `
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeHtml(meta.description)}" />
<link rel="canonical" href="${meta.canonical}" />
<meta property="og:title" content="${escapeHtml(meta.title)}" />
<meta property="og:description" content="${escapeHtml(meta.description)}" />
<meta property="og:url" content="${meta.canonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="AI-IDEI" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(meta.title)}" />
<meta name="twitter:description" content="${escapeHtml(meta.description)}" />
${meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>` : ""}
`.trim();

    return new Response(JSON.stringify({
      found: true,
      title: meta.title,
      description: meta.description,
      canonical: meta.canonical,
      jsonLd: meta.jsonLd,
      headHtml,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("prerender-meta error:", e);
    return new Response(JSON.stringify({
      error: "Failed to generate meta data",
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
