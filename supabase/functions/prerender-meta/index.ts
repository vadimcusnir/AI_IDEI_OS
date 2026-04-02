import { getCorsHeaders } from "../_shared/cors.ts";
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

    // ── Direct entity pages: /:type/:slug (e.g. /insights/my-insight) ──
    const directEntityMatch = path.match(/^\/(insights|patterns|formulas|applications|contradictions|profiles|knowledge)\/([\w-]+)$/);
    // ── Also match /knowledge/:type/:slug ──
    const knowledgeEntityMatch = path.match(/^\/knowledge\/(insights|patterns|formulas|applications|contradictions|profiles)\/([\w-]+)$/);

    const entityMatchResult = knowledgeEntityMatch || directEntityMatch;
    if (entityMatchResult) {
      const [, typePlural, slug] = entityMatchResult;
      const typeMap: Record<string, string> = {
        insights: "insight", patterns: "pattern", formulas: "formula",
        applications: "application", contradictions: "contradiction", profiles: "profile",
        knowledge: "insight", // fallback for /knowledge/:slug
      };
      const entityType = typeMap[typePlural] || typePlural;

      const { data: entity } = await supabase
        .from("entities")
        .select("title, summary, description, meta_description, slug, entity_type, json_ld")
        .eq("slug", slug)
        .eq("entity_type", entityType)
        .eq("is_published", true)
        .maybeSingle();

      if (entity) {
        const canonicalPath = knowledgeEntityMatch ? `/knowledge/${typePlural}/${slug}` : `/${typePlural}/${slug}`;
        meta = {
          title: `${entity.title} | AI-IDEI Knowledge`,
          description: entity.meta_description || entity.summary || entity.description || `${entity.title} — ${entityType} in AI-IDEI knowledge graph`,
          canonical: `${BASE_URL}${canonicalPath}`,
          jsonLd: entity.json_ld as Record<string, unknown> || {
            "@context": "https://schema.org",
            "@type": "Article",
            name: entity.title,
            description: entity.summary || entity.description,
            url: `${BASE_URL}${canonicalPath}`,
            author: { "@type": "Organization", name: "AI-IDEI" },
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
          },
        };
      }
    }

    // ── Topic pages: /topics/:slug or /knowledge/topics/:slug ──
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
          description: topic.description || `Explore ${topic.title} — ${topic.entity_count || 0} connected entities in the AI-IDEI knowledge graph.`,
          canonical: `${BASE_URL}/topics/${slug}`,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: topic.title,
            description: topic.description,
            url: `${BASE_URL}/topics/${slug}`,
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
            numberOfItems: topic.entity_count || 0,
          },
        };
      }
    }

    // ── Public analysis pages: /analysis/:slug ──
    const analysisMatch = path.match(/^\/analysis\/([\w-]+)$/);
    if (!meta && analysisMatch) {
      const [, slug] = analysisMatch;
      const { data: analysis } = await supabase
        .from("artifacts")
        .select("title, preview_content, created_at, artifact_type")
        .eq("id", slug)
        .eq("status", "published")
        .maybeSingle();

      if (analysis) {
        meta = {
          title: `${analysis.title} | AI-IDEI Analysis`,
          description: analysis.preview_content?.substring(0, 155) || `${analysis.title} — AI-powered analysis on AI-IDEI`,
          canonical: `${BASE_URL}/analysis/${slug}`,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "AnalysisNewsArticle",
            name: analysis.title,
            description: analysis.preview_content?.substring(0, 155),
            url: `${BASE_URL}/analysis/${slug}`,
            publisher: { "@type": "Organization", name: "AI-IDEI", url: BASE_URL },
            datePublished: analysis.created_at,
          },
        };
      }
    }

    // ── Media profile pages: /media/profiles/:slug ──
    const mediaMatch = path.match(/^\/media\/profiles\/([\w-]+)$/);
    if (!meta && mediaMatch) {
      const [, slug] = mediaMatch;
      const { data: profile } = await supabase
        .from("media_profiles")
        .select("name, description, slug, avatar_url")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (profile) {
        meta = {
          title: `${profile.name} | AI-IDEI Media`,
          description: profile.description?.substring(0, 155) || `${profile.name} — media profile on AI-IDEI`,
          canonical: `${BASE_URL}/media/profiles/${slug}`,
          ogImage: profile.avatar_url || undefined,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.name,
            description: profile.description,
            url: `${BASE_URL}/media/profiles/${slug}`,
          },
        };
      }
    }

    // ── Marketplace detail: /marketplace/:id ──
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
          description: asset.description?.substring(0, 155) || `${asset.title} — available on AI-IDEI marketplace`,
          canonical: `${BASE_URL}/marketplace/${id}`,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Product",
            name: asset.title,
            description: asset.description,
            url: `${BASE_URL}/marketplace/${id}`,
            offers: {
              "@type": "Offer",
              price: asset.price_neurons,
              priceCurrency: "NEURON",
            },
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
