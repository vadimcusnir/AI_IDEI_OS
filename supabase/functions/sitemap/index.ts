import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const BASE_URL = "https://ai-idei.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const xmlHeaders = { ...getCorsHeaders(req), "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" };

  function xmlResponse(body: string) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`,
      { headers: xmlHeaders }
    );
  }

  function mapUrls(data: any[] | null, prefix: string, priority: number) {
    return (data || []).map(
      (e: any) => `  <url>
    <loc>${BASE_URL}/${prefix}/${e.slug}</loc>
    <lastmod>${new Date(e.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
    ).join("\n");
  }

  try {
    // ═══ Sitemap Index ═══
    if (type === "index") {
      const subs = [
        "blog",
        "insights", "patterns", "formulas", "contradictions",
        "applications", "profiles", "topics", "marketplace",
        "knowledge", "media-profiles", "analyses",
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
        `  <url><loc>${BASE_URL}/blog</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
        ...mapUrls(posts, "blog", 0.7),
      ];
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Docs ═══
    if (type === "docs") {
      const docsSections = [
        { key: "getting-started", topics: ["introduction", "how-it-works", "your-first-neuron", "credits-system"] },
        { key: "foundation", topics: ["what-is-ai-idei", "neuron-model", "intelligence-assets"] },
        { key: "pipeline", topics: ["transcript-refinery", "signal-extraction", "pattern-detection", "synthesis-layer"] },
        { key: "architecture", topics: ["knowledge-graph", "neuron-library", "service-manifests", "job-engine"] },
        { key: "derivatives", topics: ["insights", "patterns", "formulas", "profiles", "decision-artifacts"] },
        { key: "reference", topics: ["faq", "glossary", "security"] },
      ];
      const urls = docsSections.flatMap((s) =>
        s.topics.map((t) => `  <url>
    <loc>${BASE_URL}/docs/${s.key}/${t}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
      );
      return xmlResponse(`<url><loc>${BASE_URL}/docs</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n${urls.join("\n")}`);
    }

    // ═══ Topics ═══
    if (type === "topics") {
      const { data: topics } = await supabase
        .from("topics")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50000);
      return xmlResponse(mapUrls(topics, "topics", 0.6));
    }

    // ═══ Marketplace (knowledge_assets) ═══
    if (type === "marketplace") {
      const { data } = await supabase
        .from("knowledge_assets")
        .select("id, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(50000);
      const urls = (data || []).map((a: any) => `  <url>
    <loc>${BASE_URL}/marketplace/${a.id}</loc>
    <lastmod>${new Date(a.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
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
      const urls = (data || []).map((a: any) => `  <url>
    <loc>${BASE_URL}/analysis/${a.slug}</loc>
    <lastmod>${a.updated_at ? new Date(a.updated_at).toISOString().split("T")[0] : ""}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      return xmlResponse(urls.join("\n"));
    }

    // ═══ Knowledge (public entities — all types aggregated) ═══
    if (type === "knowledge") {
      const { data } = await supabase
        .from("entities")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(50000);
      const urls = (data || []).map((e: any) => `  <url>
    <loc>${BASE_URL}/knowledge/${e.slug}</loc>
    <lastmod>${new Date(e.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
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
      return xmlResponse(mapUrls(data, "media/profiles", 0.6));
    }

    // ═══ Entity type sitemaps (insights, patterns, etc.) ═══
    const typeMap: Record<string, string[]> = {
      insights: ["insight"],
      patterns: ["pattern"],
      formulas: ["formula"],
      contradictions: ["contradiction"],
      applications: ["application"],
      profiles: ["profile"],
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

    const urls = (entities || []).map(
      (e: any) => `  <url>
    <loc>${BASE_URL}/knowledge/${e.slug}</loc>
    <lastmod>${new Date(e.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    );
    return xmlResponse(urls.join("\n"));
  } catch (err) {
    console.error(err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
