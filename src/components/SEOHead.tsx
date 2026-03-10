import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}

export function SEOHead({ title, description, canonical, ogImage }: SEOHeadProps) {
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

    if (ogImage) setMeta("og:image", ogImage, true);

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

    // Hreflang tags
    const path = new URL(canonicalUrl).pathname;
    const base = "https://ai-idei.com";
    const langs = ["en", "ro", "ru"];
    
    // Remove old hreflang links
    document.querySelectorAll('link[hreflang]').forEach(el => el.remove());
    
    for (const lang of langs) {
      const hreflang = document.createElement("link");
      hreflang.setAttribute("rel", "alternate");
      hreflang.setAttribute("hreflang", lang);
      hreflang.setAttribute("href", `${base}${path}?lang=${lang}`);
      document.head.appendChild(hreflang);
    }
    // x-default
    const xDefault = document.createElement("link");
    xDefault.setAttribute("rel", "alternate");
    xDefault.setAttribute("hreflang", "x-default");
    xDefault.setAttribute("href", `${base}${path}`);
    document.head.appendChild(xDefault);

  }, [title, description, canonical, ogImage]);

  return null;
}
