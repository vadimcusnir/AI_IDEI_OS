import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * scrape-url — Fetch and extract text from a URL.
 * SECURITY: Auth required, SSRF protection via IP blocklist, rate limited.
 */

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
  /\.internal$/i,
  /\.local$/i,
  /metadata\.google\.internal/i,
];

const BLOCKED_PROTOCOLS = ["file:", "ftp:", "gopher:", "data:", "javascript:"];

function isBlockedUrl(parsed: URL): boolean {
  if (BLOCKED_PROTOCOLS.includes(parsed.protocol)) return true;
  const hostname = parsed.hostname;
  return BLOCKED_HOSTNAME_PATTERNS.some(r => r.test(hostname));
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    // 1. Auth required
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 2. Rate limiting
    const blocked = await rateLimitGuard(`scrape:${user.id}`, req, {
      maxRequests: 10,
      windowSeconds: 60,
    }, cors);
    if (blocked) return blocked;

    // 3. Parse and validate URL
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 4. SSRF protection — block private/internal IPs
    if (isBlockedUrl(parsedUrl)) {
      return new Response(JSON.stringify({ error: "URL not allowed" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: "Only HTTP/HTTPS URLs allowed" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 5. DNS resolution check — prevent DNS rebinding attacks (IPv4 + IPv6)
    try {
      const checks: string[] = [];
      try { const a = await Deno.resolveDns(parsedUrl.hostname, "A"); checks.push(...a); } catch { /* no A records */ }
      try { const aaaa = await Deno.resolveDns(parsedUrl.hostname, "AAAA"); checks.push(...aaaa); } catch { /* no AAAA records */ }

      if (checks.length === 0) {
        return new Response(JSON.stringify({ error: "DNS resolution failed" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      for (const ip of checks) {
        if (BLOCKED_HOSTNAME_PATTERNS.some(r => r.test(ip))) {
          return new Response(JSON.stringify({ error: "URL resolves to blocked IP" }), {
            status: 403, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
      }
    } catch {
      return new Response(JSON.stringify({ error: "DNS resolution failed" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 6. Fetch with timeout — manual redirect to re-validate target
    let finalUrl = parsedUrl.toString();
    let resp = await fetch(finalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AI-IDEI/1.0; +https://ai-idei.com)",
        "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });

    // Follow up to 3 redirects, re-checking each target
    for (let hops = 0; hops < 3 && [301, 302, 303, 307, 308].includes(resp.status); hops++) {
      const loc = resp.headers.get("location");
      if (!loc) break;
      const redirectUrl = new URL(loc, finalUrl);
      if (isBlockedUrl(redirectUrl)) {
        return new Response(JSON.stringify({ error: "Redirect target blocked" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      finalUrl = redirectUrl.toString();
      resp = await fetch(finalUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-IDEI/1.0; +https://ai-idei.com)", "Accept": "text/html,*/*" },
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
      });
    }

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch: ${resp.status}` }), {
        status: 422, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Check redirect didn't land on blocked URL
    const finalUrl = new URL(resp.url);
    if (isBlockedUrl(finalUrl)) {
      return new Response(JSON.stringify({ error: "Redirect to blocked URL" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const html = await resp.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']*)["']/i);
    const title = ogTitleMatch?.[1] || titleMatch?.[1]?.trim() || parsedUrl.hostname;

    // Strip HTML to get text content
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote|section|article)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .replace(/[<>]/g, "")
      .trim();

    if (text.length > 50000) {
      text = text.slice(0, 50000) + "\n\n[Content truncated at 50,000 characters]";
    }

    return new Response(JSON.stringify({ title, content: text, url: parsedUrl.toString() }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("scrape-url error:", error);
    // Sanitize error — don't leak internals
    return new Response(
      JSON.stringify({ error: "Failed to process URL" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
