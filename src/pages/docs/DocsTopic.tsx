import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { DOCS_SECTIONS, TOPIC_CONTENT } from "./docsContent";
import { DocsMarkdownRenderer } from "./DocsMarkdownRenderer";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { safeJsonLd } from "@/lib/jsonLdSafe";

interface Props {
  section: string;
  topic: string;
}

export default function DocsTopic({ section, topic }: Props) {
  const sectionData = DOCS_SECTIONS.find((s) => s.key === section);
  const topicData = sectionData?.topics.find((t) => t.slug === topic);
  const content = TOPIC_CONTENT[section]?.[topic];

  if (!content || !topicData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Topic not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The requested documentation page does not exist.
        </p>
        <Link to="/docs" className="text-sm text-primary hover:underline">
          ← Back to Documentation
        </Link>
      </div>
    );
  }

  const allTopics = DOCS_SECTIONS.flatMap((s) =>
    s.topics.map((t) => ({ section: s.key, sectionLabel: s.label, ...t }))
  );
  const currentIdx = allTopics.findIndex(
    (t) => t.section === section && t.slug === topic
  );
  const prev = currentIdx > 0 ? allTopics[currentIdx - 1] : null;
  const next = currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;

  const metaDesc = content.content.replace(/[#*\n]/g, " ").trim().slice(0, 155) + "…";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${content.title} — AI-IDEI Docs`}
        description={metaDesc}
        canonical={`https://ai-idei.com/docs/${section}/${topic}`}
      />
      <BreadcrumbJsonLd items={[
        { name: "Docs", url: "https://ai-idei.com/docs" },
        { name: sectionData?.label || section, url: `https://ai-idei.com/docs#${section}` },
        { name: content.title, url: `https://ai-idei.com/docs/${section}/${topic}` },
      ]} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground transition-colors">Docs</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="capitalize">{sectionData?.label}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{topicData.title}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6">{content.title}</h1>

        <article className="prose-content">
          <DocsMarkdownRenderer text={content.content} />
        </article>

        <div className="flex justify-between items-center mt-12 pt-6 border-t border-border gap-4">
          {prev ? (
            <Link to={`/docs/${prev.section}/${prev.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← {prev.title}
            </Link>
          ) : <div />}
          {next ? (
            <Link to={`/docs/${next.section}/${next.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-right">
              {next.title} →
            </Link>
          ) : <div />}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: content.title,
            description: content.content.slice(0, 160),
            author: { "@type": "Organization", name: "AI-IDEI" },
            publisher: { "@type": "Organization", name: "AI-IDEI" },
          }),
        }}
      />
    </div>
  );
}
