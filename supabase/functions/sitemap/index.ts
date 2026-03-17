import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://ai-idei.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (type === "index") {
      // Sitemap index
      const types = ["insights", "patterns", "formulas", "contradictions", "applications", "profiles", "topics", "docs"];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-static.xml</loc></sitemap>
  ${types.map((t) => `<sitemap><loc>${BASE_URL}/api/sitemap?type=${t}</loc></sitemap>`).join("\n  ")}
</sitemapindex>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    if (type === "topics") {
      const { data: topics } = await supabase
        .from("topics")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50000);

      const urls = (topics || []).map(
        (t: any) => `  <url>
    <loc>${BASE_URL}/topics/${t.slug}</loc>
    <lastmod>${new Date(t.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
      );

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`,
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // Entity type sitemaps
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
    <loc>${BASE_URL}/${type}/${e.slug}</loc>
    <lastmod>${new Date(e.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    );

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`,
      { headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  } catch (err) {
    console.error(err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
