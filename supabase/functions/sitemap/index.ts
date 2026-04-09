import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const BASE_URL = "https://ai-idei.com";
const LANGS = ["en", "ro", "ru"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const xmlHeaders = {
    ...getCorsHeaders(req),
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  };

  /** Build hreflang alternates for a path */
  function hreflangs(path: string): string {
    return LANGS.map(
      (l) => `      <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${path}" />`
    ).join("\n") + `\n      <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en${path}" />`;
  }

  function urlEntry(path: string, lastmod: string | null, freq: string, priority: number): string {
    return `  <url>
    <loc>${BASE_URL}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
${hreflangs(path)}
  </url>`;
  }

  function xmlResponse(body: string) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`,
      { headers: xmlHeaders }
    );
  }

  try {
    // ═══ Sitemap Index ═══
    if (type === "index") {
      const subs = [
        "blog", "blog-categories",
        "insights", "patterns", "formulas", "contradictions",
        "applications", "profiles", "topics", "marketplace",
        "knowledge", "media-profiles", "analyses",
        "knowledge-surface", "product-surface",
        "community",
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-static.xml</loc></sitemap>
  ${subs.map((t) => `<sitemap><loc>${BASE_URL}/functions/v1/sitemap?type=${t}</loc></sitemap>`).join("\n  ")}
</sitemapindex>`;
      return new Response(xml, { headers: xmlHeaders });
    }

    // ═══ Blog ═══
    if (type === "blog") {
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5000);
      const urls = [
        urlEntry("/blog", null, "daily", 0.8),
        ...(posts || []).map((p: any) =>
          urlEntry(`/blog/${p.slug}`, new Date(p.updated_at).toISOString().split("T")[0], "weekly", 0.7)
        ),
      ];
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Blog Categories ═══
    if (type === "blog-categories") {
      const { data: cats } = await supabase
        .from("blog_posts")
        .select("category")
        .eq("status", "published");
      const unique = [...new Set((cats || []).map((c: any) => c.category).filter(Boolean))];
      const urls = unique.map((cat) =>
        urlEntry(`/blog?category=${cat}`, null, "weekly", 0.6)
      );
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Topics ═══
    if (type === "topics") {
      const { data: topics } = await supabase
        .from("topics")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50000);
      const urls = (topics || []).map((t: any) =>
        urlEntry(`/topics/${t.slug}`, new Date(t.updated_at).toISOString().split("T")[0], "weekly", 0.6)
      );
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Marketplace ═══
    if (type === "marketplace") {
      const { data } = await supabase
        .from("knowledge_assets")
        .select("id, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(50000);
      const urls = (data || []).map((a: any) =>
        urlEntry(`/marketplace/${a.id}`, new Date(a.updated_at).toISOString().split("T")[0], "weekly", 0.8)
      );
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Public Analyses ═══
    if (type === "analyses") {
      const { data } = await supabase
        .from("public_analyses")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50000);
      const urls = (data || []).map((a: any) =>
        urlEntry(`/analysis/${a.slug}`, a.updated_at ? new Date(a.updated_at).toISOString().split("T")[0] : null, "weekly", 0.7)
      );
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Knowledge (all entities) ═══
    if (type === "knowledge") {
      const { data } = await supabase
        .from("entities")
        .select("slug, entity_type, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(50000);
      const typePathMap: Record<string, string> = {
        insight: "insights", pattern: "patterns", formula: "formulas",
        contradiction: "contradictions", application: "applications", profile: "profiles",
      };
      const urls = (data || []).map((e: any) => {
        const prefix = typePathMap[e.entity_type] || e.entity_type;
        return urlEntry(`/knowledge/${prefix}/${e.slug}`, new Date(e.updated_at).toISOString().split("T")[0], "weekly", 0.7);
      });
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Media Profiles ═══
    if (type === "media-profiles") {
      const { data } = await supabase
        .from("media_profiles")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(50000);
      const urls = (data || []).map((p: any) =>
        urlEntry(`/media/profiles/${p.slug}`, new Date(p.updated_at).toISOString().split("T")[0], "monthly", 0.6)
      );
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Knowledge Surface Pages (/k/*) ═══
    if (type === "knowledge-surface") {
      const { data } = await supabase
        .from("knowledge_surface_pages")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(50000);
      const urls = (data || []).map((p: any) =>
        urlEntry(`/k/${p.slug.replace(/^knowledge\//, "")}`, new Date(p.updated_at).toISOString().split("T")[0], "weekly", 0.7)
      );
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Product Surface Pages (/p/*) ═══
    if (type === "product-surface") {
      const { data } = await supabase
        .from("product_surface_pages")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(50000);
      const urls = (data || []).map((p: any) =>
        urlEntry(`/p/${p.slug}`, new Date(p.updated_at).toISOString().split("T")[0], "weekly", 0.7)
      );
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Community Threads ═══
    if (type === "community") {
      const { data } = await supabase
        .from("community_threads")
        .select("id, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(50000);
      const urls = [
        urlEntry("/community", null, "daily", 0.8),
        ...(data || []).map((t: any) =>
          urlEntry(`/community/${t.id}`, new Date(t.updated_at).toISOString().split("T")[0], "weekly", 0.5)
        ),
      ];
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Entity type sitemaps (insights, patterns, etc.) ═══
    const typeMap: Record<string, string[]> = {
      insights: ["insight"], patterns: ["pattern"], formulas: ["formula"],
      contradictions: ["contradiction"], applications: ["application"], profiles: ["profile"],
    };
    const entityTypes = typeMap[type];
    if (!entityTypes) {
      return new Response("Unknown sitemap type", { status: 404 });
    }

    const { data: entities } = await supabase
      .from("entities")
      .select("slug, entity_type, updated_at")
      .eq("is_published", true)
      .in("entity_type", entityTypes)
      .order("updated_at", { ascending: false })
      .limit(50000);

    const urls = (entities || []).map((e: any) =>
      urlEntry(`/knowledge/${type}/${e.slug}`, new Date(e.updated_at).toISOString().split("T")[0], "weekly", 0.7)
    );
    return xmlResponse(urls.join("\n"));
  } catch (err) {
    console.error(err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
