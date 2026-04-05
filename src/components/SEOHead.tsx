import { useEffect } from "react";

const BASE_URL = "https://ai-idei.com";

/** Route-to-OG image mapping for social media thumbnails */
const OG_IMAGE_MAP: Record<string, string> = {
  "/extractor": "/og/og-extractor.png",
  "/intelligence": "/og/og-intelligence.png",
  "/neurons": "/og/og-neurons.png",
  "/services": "/og/og-services.png",
  "/marketplace": "/og/og-marketplace.png",
  "/community": "/og/og-community.png",
  "/library": "/og/og-library.png",
  "/pricing": "/og/og-default.png",
  "/about": "/og/og-default.png",
  "/about-vadim-cusnir": "/og/og-default.png",
  "/docs": "/og/og-default.png",
  "/changelog": "/og/og-default.png",
};

function resolveOgImage(path: string, custom?: string): string {
  if (custom) return custom;
  // Check exact match first, then prefix match
  if (OG_IMAGE_MAP[path]) return `${BASE_URL}${OG_IMAGE_MAP[path]}`;
  for (const [route, img] of Object.entries(OG_IMAGE_MAP)) {
    if (path.startsWith(route)) return `${BASE_URL}${img}`;
  }
  return `${BASE_URL}/og/og-default.png`;
}

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
}

export function SEOHead({ title, description, canonical, ogImage, jsonLd }: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title.includes("AI-IDEI") ? title : `${title} — AI-IDEI`;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, true);
      setMeta("twitter:description", description);
    }
    setMeta("og:title", fullTitle, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:site", "@ai_idei");
    setMeta("twitter:title", fullTitle);

    // Resolve OG image
    const path = window.location.pathname;
    const resolvedImage = resolveOgImage(path, ogImage);
    setMeta("og:image", resolvedImage, true);
    setMeta("og:image:alt", title, true);
    setMeta("twitter:image", resolvedImage);
    setMeta("twitter:image:alt", title);
    setMeta("og:image:width", "1200", true);
    setMeta("og:image:height", "630", true);

    const currentUrl = canonical || window.location.href;
    const canonicalUrl = currentUrl.replace("ai-idei-os.lovable.app", "ai-idei.com");

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    setMeta("og:url", canonicalUrl, true);

    // Hreflang tags — subfolder-based
    const langs = ["en", "ro", "ru"];
    
    // Remove old hreflang links
    document.querySelectorAll('link[hreflang]').forEach(el => el.remove());
    
    const createdLinks: HTMLLinkElement[] = [];
    
    // Strip existing lang prefix from path for clean reconstruction
    const cleanPath = path.replace(/^\/(en|ro|ru)(\/|$)/, '/').replace(/^$/, '/');
    
    for (const lang of langs) {
      const hreflang = document.createElement("link");
      hreflang.setAttribute("rel", "alternate");
      hreflang.setAttribute("hreflang", lang);
      hreflang.setAttribute("href", `${BASE_URL}/${lang}${cleanPath === '/' ? '' : cleanPath}`);
      document.head.appendChild(hreflang);
      createdLinks.push(hreflang);
    }
    // x-default points to /en version
    const xDefault = document.createElement("link");
    xDefault.setAttribute("rel", "alternate");
    xDefault.setAttribute("hreflang", "x-default");
    xDefault.setAttribute("href", `${BASE_URL}/en${cleanPath === '/' ? '' : cleanPath}`);
    document.head.appendChild(xDefault);
    createdLinks.push(xDefault);

    // JSON-LD structured data
    let ldScript = document.querySelector('script[data-seo-jsonld]') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!ldScript) {
        ldScript = document.createElement("script");
        ldScript.setAttribute("type", "application/ld+json");
        ldScript.setAttribute("data-seo-jsonld", "true");
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    } else if (ldScript) {
      ldScript.remove();
    }

    // Cleanup on unmount — prevents memory leak
    return () => {
      createdLinks.forEach(el => el.remove());
      const existingLd = document.querySelector('script[data-seo-jsonld]');
      if (existingLd) existingLd.remove();
    };
  }, [title, description, canonical, ogImage, jsonLd]);

  return null;
}
