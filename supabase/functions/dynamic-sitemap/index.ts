import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ai-idei.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const BASE = "https://ai-idei.com";
  let urls: string[] = [];

  // Public analyses
  const { data: analyses } = await supabase
    .from("public_analyses")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(500);

  if (analyses) {
    for (const a of analyses) {
      const lastmod = a.updated_at ? new Date(a.updated_at).toISOString().split("T")[0] : "";
      urls.push(`  <url><loc>${BASE}/analysis/${a.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }
  }

  // Public entities (insights, patterns, formulas, etc.)
  const { data: entities } = await supabase
    .from("entities")
    .select("slug, entity_type, updated_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (entities) {
    const typePathMap: Record<string, string> = {
      insight: "insights",
      pattern: "patterns",
      formula: "formulas",
      contradiction: "contradictions",
      application: "applications",
      topic: "topics",
    };
    for (const e of entities) {
      const path = typePathMap[e.entity_type] || e.entity_type;
      const lastmod = e.updated_at ? new Date(e.updated_at).toISOString().split("T")[0] : "";
      urls.push(`  <url><loc>${BASE}/${path}/${e.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    }
  }

  // Media profiles
  const { data: profiles } = await supabase
    .from("media_profiles")
    .select("slug, updated_at")
    .eq("is_published", true)
    .limit(200);

  if (profiles) {
    for (const p of profiles) {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : "";
      urls.push(`  <url><loc>${BASE}/media/profiles/${p.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.6</priority></url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
