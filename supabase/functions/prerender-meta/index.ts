import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * prerender-meta — Hybrid prerender: serves HTML <head> + critical above-fold content
 * for crawlers hitting public entity, topic, knowledge, marketplace, and analysis pages.
 * 
 * MODE:
 * - JSON response (default): meta fields + headHtml + criticalHtml
 * - Full HTML (Accept: text/html or ?format=html): complete crawlable page
 * 
 * Supports /:lang/ subfolder prefixes (strips lang before matching).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const BASE_URL = "https://ai-idei.com";
const SUPPORTED_LANGS = ["en", "ro", "ru"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimited = await rateLimitGuard(`prerender:${ip}`, req, { maxRequests: 30, windowSeconds: 60 }, getCorsHeaders(req));
  if (rateLimited) return rateLimited;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    const wantsHtml = req.headers.get("accept")?.includes("text/html") || url.searchParams.get("format") === "html";

    let rawPath: string;
    if (req.method === "POST") {
      const body = await req.json();
      rawPath = body.path;
    } else {
      rawPath = url.searchParams.get("path") || "/";
    }
    
    if (!rawPath) throw new Error("Missing path parameter");

    // Strip lang prefix: /en/insights/foo → /insights/foo
    const langMatch = rawPath.match(/^\/(en|ro|ru)(\/.*)?$/);
    const detectedLang = langMatch ? langMatch[1] : "en";
    const path = langMatch ? (langMatch[2] || "/") : rawPath;

    let meta: {
      title: string;
      description: string;
      canonical: string;
      ogImage?: string;
      jsonLd?: Record<string, unknown>;
      criticalContent?: string;
    } | null = null;

    // ── Entity pages: /:type/:slug ──
    const directEntityMatch = path.match(/^\/(insights|patterns|formulas|applications|contradictions|profiles|knowledge)\/([\w-]+)$/);
    const knowledgeEntityMatch = path.match(/^\/knowledge\/(insights|patterns|formulas|applications|contradictions|profiles)\/([\w-]+)$/);
    const entityMatchResult = knowledgeEntityMatch || directEntityMatch;
    
    if (entityMatchResult) {
      const [, typePlural, slug] = entityMatchResult;
      const typeMap: Record<string, string> = {
        insights: "insight", patterns: "pattern", formulas: "formula",
        applications: "application", contradictions: "contradiction", profiles: "profile",
        knowledge: "insight",
      };
      const entityType = typeMap[typePlural] || typePlural;

      const { data: entity } = await supabase
        .from("entities")
        .select("title, summary, description, meta_description, slug, entity_type, json_ld, content")
        .eq("slug", slug)
        .eq("entity_type", entityType)
        .eq("is_published", true)
        .maybeSingle();

      if (entity) {
        const canonicalPath = knowledgeEntityMatch ? `/knowledge/${typePlural}/${slug}` : `/${typePlural}/${slug}`;
        meta = {
          title: `${entity.title} | AI-IDEI Knowledge`,
          description: entity.meta_description || entity.summary || entity.description || `${entity.title} — ${entityType} in AI-IDEI knowledge graph`,
          canonical: `${BASE_URL}/${detectedLang}${canonicalPath}`,
          criticalContent: buildEntityHtml(entity),
          jsonLd: entity.json_ld as Record<string, unknown> || {
            "@context": "https://schema.org",
            "@type": "Article",
            name: entity.title,
            description: entity.summary || entity.description,
            url: `${BASE_URL}/${detectedLang}${canonicalPath}`,
            inLanguage: detectedLang,
            author: { "@type": "Organization", name: "AI-IDEI" },
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
          },
        };
      }
    }

    // ── Topic pages ──
    const topicMatch = path.match(/^(?:\/knowledge)?\/topics\/([\w-]+)$/);
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
          description: topic.description || `Explore ${topic.title} — ${topic.entity_count || 0} connected entities.`,
          canonical: `${BASE_URL}/${detectedLang}/topics/${slug}`,
          criticalContent: `<article><h1>${escapeHtml(topic.title)}</h1><p>${escapeHtml(topic.description || "")}</p><p>${topic.entity_count || 0} connected entities</p></article>`,
          jsonLd: {
            "@context": "https://schema.org", "@type": "CollectionPage",
            name: topic.title, description: topic.description,
            url: `${BASE_URL}/${detectedLang}/topics/${slug}`,
            inLanguage: detectedLang,
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
            numberOfItems: topic.entity_count || 0,
          },
        };
      }
    }

    // ── Analysis pages ──
    const analysisMatch = path.match(/^\/analysis\/([\w-]+)$/);
    if (!meta && analysisMatch) {
      const [, slug] = analysisMatch;
      const { data: analysis } = await supabase
        .from("artifacts")
        .select("title, preview_content, content, created_at, artifact_type")
        .eq("id", slug)
        .eq("status", "published")
        .maybeSingle();

      if (analysis) {
        meta = {
          title: `${analysis.title} | AI-IDEI Analysis`,
          description: analysis.preview_content?.substring(0, 155) || `${analysis.title} — AI-powered analysis`,
          canonical: `${BASE_URL}/${detectedLang}/analysis/${slug}`,
          criticalContent: `<article><h1>${escapeHtml(analysis.title)}</h1><p>${escapeHtml(analysis.preview_content || "")}</p>${truncateContent(analysis.content)}</article>`,
          jsonLd: {
            "@context": "https://schema.org", "@type": "AnalysisNewsArticle",
            name: analysis.title, description: analysis.preview_content?.substring(0, 155),
            url: `${BASE_URL}/${detectedLang}/analysis/${slug}`,
            inLanguage: detectedLang,
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
            datePublished: analysis.created_at,
          },
        };
      }
    }

    // ── Media profile pages ──
    const mediaMatch = path.match(/^\/media\/profiles\/([\w-]+)$/);
    if (!meta && mediaMatch) {
      const [, slug] = mediaMatch;
      const { data: profile } = await supabase
        .from("media_profiles")
        .select("name, description, slug, avatar_url, biography")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (profile) {
        meta = {
          title: `${profile.name} | AI-IDEI Media`,
          description: profile.description?.substring(0, 155) || `${profile.name} — media profile`,
          canonical: `${BASE_URL}/${detectedLang}/media/profiles/${slug}`,
          ogImage: profile.avatar_url || undefined,
          criticalContent: `<article><h1>${escapeHtml(profile.name)}</h1><p>${escapeHtml(profile.description || "")}</p>${truncateContent(profile.biography)}</article>`,
          jsonLd: {
            "@context": "https://schema.org", "@type": "Person",
            name: profile.name, description: profile.description,
            url: `${BASE_URL}/${detectedLang}/media/profiles/${slug}`,
          },
        };
      }
    }

    // ── Marketplace detail ──
    const marketMatch = path.match(/^\/marketplace\/([\w-]+)$/);
    if (!meta && marketMatch) {
      const [, id] = marketMatch;
      const { data: asset } = await supabase
        .from("knowledge_assets")
        .select("title, description, asset_type, price_neurons")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      if (asset) {
        meta = {
          title: `${asset.title} | AI-IDEI Marketplace`,
          description: asset.description?.substring(0, 155) || `${asset.title} — marketplace`,
          canonical: `${BASE_URL}/${detectedLang}/marketplace/${id}`,
          criticalContent: `<article><h1>${escapeHtml(asset.title)}</h1><p>${escapeHtml(asset.description || "")}</p><p>Type: ${asset.asset_type} · Price: ${asset.price_neurons} NEURONS</p></article>`,
          jsonLd: {
            "@context": "https://schema.org", "@type": "Product",
            name: asset.title, description: asset.description,
            url: `${BASE_URL}/${detectedLang}/marketplace/${id}`,
            offers: { "@type": "Offer", price: asset.price_neurons, priceCurrency: "NEURON" },
          },
        };
      }
    }

    // ── Blog posts ──
    const blogMatch = path.match(/^\/blog\/([\w-]+)$/);
    if (!meta && blogMatch) {
      const [, slug] = blogMatch;
      const { data: post } = await supabase
        .from("blog_posts")
        .select("title, excerpt, content, published_at, seo_title, seo_description, thumbnail_url, tags")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (post) {
        meta = {
          title: post.seo_title || `${post.title} | AI-IDEI Blog`,
          description: post.seo_description || post.excerpt || post.title,
          canonical: `${BASE_URL}/${detectedLang}/blog/${slug}`,
          ogImage: post.thumbnail_url || undefined,
          criticalContent: `<article><h1>${escapeHtml(post.title)}</h1><p class="lead">${escapeHtml(post.excerpt)}</p>${truncateContent(post.content)}</article>`,
          jsonLd: {
            "@context": "https://schema.org", "@type": "Article",
            headline: post.title, description: post.excerpt,
            url: `${BASE_URL}/${detectedLang}/blog/${slug}`,
            inLanguage: detectedLang,
            datePublished: post.published_at,
            image: post.thumbnail_url,
            keywords: (post.tags || []).join(", "),
            author: { "@type": "Organization", name: "AI-IDEI" },
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
          },
        };
      }
    }

    // ── Knowledge Surface pages ──
    const surfaceMatch = path.match(/^\/k\/(.+)$/);
    if (!meta && surfaceMatch) {
      const [, slugPath] = surfaceMatch;
      const { data: page } = await supabase
        .from("knowledge_surface_pages")
        .select("title, meta_description, slug, schema_json, content_html")
        .eq("slug", `knowledge/${slugPath}`)
        .eq("status", "published")
        .maybeSingle();

      if (page) {
        meta = {
          title: `${page.title} | AI-IDEI`,
          description: page.meta_description || page.title,
          canonical: `${BASE_URL}/${detectedLang}/k/${slugPath}`,
          criticalContent: truncateContent(page.content_html),
          jsonLd: page.schema_json as Record<string, unknown>,
        };
      }
    }

    // ── Product Surface pages ──
    const productMatch = path.match(/^\/p\/(.+)$/);
    if (!meta && productMatch) {
      const [, slug] = productMatch;
      const { data: page } = await supabase
        .from("product_surface_pages")
        .select("title, meta_description, slug, schema_json, content_html")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (page) {
        meta = {
          title: `${page.title} | AI-IDEI`,
          description: page.meta_description || page.title,
          canonical: `${BASE_URL}/${detectedLang}/p/${slug}`,
          criticalContent: truncateContent(page.content_html),
          jsonLd: page.schema_json as Record<string, unknown>,
        };
      }
    }

    if (!meta) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Build hreflang links
    const hreflangs = SUPPORTED_LANGS.map(lang => 
      `<link rel="alternate" hreflang="${lang}" href="${meta!.canonical.replace(`/${detectedLang}/`, `/${lang}/`)}" />`
    ).join("\n");
    const xDefaultHreflang = `<link rel="alternate" hreflang="x-default" href="${meta.canonical.replace(`/${detectedLang}/`, `/en/`)}" />`;

    // Build head HTML
    const headHtml = `
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeHtml(meta.description)}" />
<link rel="canonical" href="${meta.canonical}" />
<meta property="og:title" content="${escapeHtml(meta.title)}" />
<meta property="og:description" content="${escapeHtml(meta.description)}" />
<meta property="og:url" content="${meta.canonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="AI-IDEI" />
${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}" />` : ""}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(meta.title)}" />
<meta name="twitter:description" content="${escapeHtml(meta.description)}" />
${hreflangs}
${xDefaultHreflang}
${meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>` : ""}
`.trim();

    // Full HTML mode for crawlers
    if (wantsHtml) {
      const fullHtml = `<!DOCTYPE html>
<html lang="${detectedLang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${headHtml}
</head>
<body>
<div id="root">
${meta.criticalContent || ""}
<noscript><p>This page requires JavaScript for full functionality. <a href="${BASE_URL}">Visit AI-IDEI</a></p></noscript>
</div>
<script>window.location.replace(window.location.href);</script>
</body>
</html>`;
      return new Response(fullHtml, {
        headers: { ...getCorsHeaders(req), "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
      });
    }

    return new Response(JSON.stringify({
      found: true,
      lang: detectedLang,
      title: meta.title,
      description: meta.description,
      canonical: meta.canonical,
      jsonLd: meta.jsonLd,
      headHtml,
      criticalHtml: meta.criticalContent || null,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (e) {
    console.error("prerender-meta error:", e);
    return new Response(JSON.stringify({ error: "Failed to generate meta data" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncateContent(content?: string | null, maxChars = 2000): string {
  if (!content) return "";
  const clean = content.substring(0, maxChars);
  return clean.length < content.length ? clean + "…" : clean;
}

function buildEntityHtml(entity: { title: string; summary?: string; description?: string; content?: string }): string {
  return `<article>
<h1>${escapeHtml(entity.title)}</h1>
${entity.summary ? `<p class="lead">${escapeHtml(entity.summary)}</p>` : ""}
${entity.description ? `<p>${escapeHtml(entity.description)}</p>` : ""}
${truncateContent(entity.content)}
</article>`;
}
