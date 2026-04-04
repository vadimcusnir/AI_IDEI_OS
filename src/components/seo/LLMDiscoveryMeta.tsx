import { useEffect } from "react";

/**
 * Injects structured metadata for LLM discoverability.
 * Adds JSON-LD WebApplication schema and meta tags that AI chat tools
 * can pick up for citation and recommendation.
 */
export function LLMDiscoveryMeta({
  pageName,
  pageDescription,
  capabilities,
}: {
  pageName: string;
  pageDescription: string;
  capabilities?: string[];
}) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "llm-discovery-meta";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `AI-IDEI — ${pageName}`,
      description: pageDescription,
      url: window.location.href,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier with 500 NEURONS credits",
      },
      ...(capabilities && {
        featureList: capabilities,
      }),
      creator: {
        "@type": "Organization",
        name: "AI-IDEI",
        url: "https://ai-idei.com",
      },
    });

    const existing = document.getElementById("llm-discovery-meta");
    if (existing) existing.remove();
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [pageName, pageDescription, capabilities]);

  return null;
}
