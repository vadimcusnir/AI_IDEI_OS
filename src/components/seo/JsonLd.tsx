/**
 * JSON-LD Structured Data Components
 * Renders schema.org structured data inline for crawlability (no useEffect).
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data);
  const safeJson = json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}

// ── Pre-built schemas ──

export function OrganizationJsonLd() {
  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AI-IDEI",
      url: "https://ai-idei.com",
      logo: "https://ai-idei.com/favicon.gif",
      description: "AI-driven expertise capitalization platform. Transform knowledge into structured intellectual assets.",
      sameAs: [
        "https://twitter.com/ai_idei",
      ],
      foundingDate: "2024",
      knowsAbout: [
        "Artificial Intelligence",
        "Knowledge Management",
        "Content Marketing Automation",
        "Expertise Capitalization",
      ],
    }} />
  );
}

export function WebApplicationJsonLd() {
  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "AI-IDEI",
      url: "https://ai-idei.com",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Transform raw knowledge into structured intellectual assets with AI-powered extraction and multiplication.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier with 500 NEURONS credits",
      },
      featureList: [
        "AI Knowledge Extraction",
        "Neuron-based Knowledge Units",
        "Automated Content Multiplication",
        "Knowledge Graph Visualization",
        "Multi-language Support",
      ],
    }} />
  );
}

export function ServiceJsonLd({ service }: {
  service: { name: string; description: string; credits_cost: number; category: string };
}) {
  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.name,
      description: service.description,
      provider: {
        "@type": "Organization",
        name: "AI-IDEI",
        url: "https://ai-idei.com",
      },
      category: service.category,
      offers: {
        "@type": "Offer",
        price: (service.credits_cost * 0.01).toFixed(2),
        priceCurrency: "USD",
        description: `${service.credits_cost} NEURONS credits`,
      },
    }} />
  );
}

export function BreadcrumbJsonLd({ items }: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    }} />
  );
}

export function FAQJsonLd({ items }: {
  items: { question: string; answer: string }[];
}) {
  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    }} />
  );
}

export function DatasetJsonLd({ name, description, entityCount }: {
  name: string;
  description: string;
  entityCount?: number;
}) {
  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "Dataset",
      name,
      description,
      url: "https://ai-idei.com/intelligence",
      creator: {
        "@type": "Organization",
        name: "AI-IDEI",
        url: "https://ai-idei.com",
      },
      license: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      keywords: "knowledge graph, AI, marketing, expertise, patterns, insights",
      ...(entityCount && {
        measurementTechnique: "AI-powered extraction and classification",
        variableMeasured: {
          "@type": "PropertyValue",
          name: "entities",
          value: entityCount,
        },
      }),
    }} />
  );
}

export function PersonJsonLd({ name, jobTitle, bio, expertise, url }: {
  name: string;
  jobTitle?: string;
  bio?: string;
  expertise?: string[];
  url?: string;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: url || `https://ai-idei.com`,
  };
  if (jobTitle) data.jobTitle = jobTitle;
  if (bio) data.description = bio;
  if (expertise?.length) data.knowsAbout = expertise;

  return <JsonLd data={data} />;
}
