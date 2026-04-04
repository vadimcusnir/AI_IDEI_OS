import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Blog RSS Feed — AI-IDEI
 * Returns RSS 2.0 XML with the latest 50 published blog posts.
 */

const BASE_URL = "https://ai-idei.com";
const SITE_NAME = "AI-IDEI Blog";
const SITE_DESCRIPTION = "Deep insights on knowledge extraction, AI strategy, and building systems that think.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("title, slug, excerpt, published_at, category, tags, thumbnail_url, seo_description")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50);

    const items = (posts || []).map((p: any) => {
      const pubDate = new Date(p.published_at).toUTCString();
      const description = escapeXml(p.seo_description || p.excerpt || "");
      const categories = [p.category, ...(p.tags || [])].map(
        (c: string) => `      <category>${escapeXml(c)}</category>`
      ).join("\n");

      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${BASE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${p.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
${categories}${p.thumbnail_url ? `\n      <enclosure url="${escapeXml(p.thumbnail_url)}" type="image/png" />` : ""}
    </item>`;
    }).join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${BASE_URL}/blog</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en</language>
    <atom:link href="${BASE_URL}/functions/v1/blog-rss" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=1800",
      },
    });
  } catch (e) {
    console.error("[blog-rss] Error:", e);
    return new Response("Error generating RSS", { status: 500 });
  }
});

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
