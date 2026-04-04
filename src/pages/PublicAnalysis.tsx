/**
 * PublicAnalysis — SEO-indexable public analysis page at /analysis/:slug
 * Accessible without login. Renders markdown content with JSON-LD structured data.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import ReactMarkdown from "react-markdown";
import { Loader2, ArrowLeft, Eye, Calendar, Tag, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AnalysisData {
  id: string;
  title: string;
  summary: string;
  content: string;
  analysis_type: string;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  general: "Analysis",
  narrative: "Narrative Intelligence",
  viral: "Viral Strategy",
  pricing: "Pricing Intelligence",
  funnel: "Funnel Blueprint",
  identity: "Identity Simulation",
  leverage: "Behavioral Leverage",
  influence: "Influence Map",
  arbitrage: "Knowledge Arbitrage",
  reputation: "Reputation Analysis",
  offer: "Offer Multiplication",
  swarm: "Agent Swarm Output",
};

export default function PublicAnalysis() {
  const { slug } = useParams<{ slug: string }>();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("public_analyses")
        .select("id, title, summary, content, analysis_type, tags, meta_title, meta_description, og_image_url, view_count, created_at, updated_at")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setAnalysis(data as AnalysisData);
        // Fire-and-forget view increment
        supabase.rpc("increment_analysis_views", { _slug: slug });
      }
      setLoading(false);
    })();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: analysis?.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold text-foreground">Analysis Not Found</h1>
        <p className="text-muted-foreground">This analysis may have been removed or is no longer public.</p>
        <Link to="/" className="text-primary hover:underline text-sm">← Back to AI-IDEI</Link>
      </div>
    );
  }

  const metaTitle = analysis.meta_title || `${analysis.title} — AI-IDEI Analysis`;
  const metaDesc = analysis.meta_description || analysis.summary.slice(0, 155);
  const typeLabel = TYPE_LABELS[analysis.analysis_type] || "Analysis";
  const publishDate = new Date(analysis.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: analysis.title,
    description: metaDesc,
    datePublished: analysis.created_at,
    dateModified: analysis.updated_at,
    url: `https://ai-idei.com/analysis/${slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://ai-idei.com/analysis/${slug}`,
    },
    author: {
      "@type": "Organization",
      name: "AI-IDEI",
      url: "https://ai-idei.com",
    },
    publisher: {
      "@type": "Organization",
      name: "AI-IDEI",
      url: "https://ai-idei.com",
      logo: {
        "@type": "ImageObject",
        url: "https://ai-idei.com/favicon.png",
      },
    },
    articleSection: typeLabel,
    keywords: (analysis.tags ?? []).join(", "),
    inLanguage: "en",
    ...(analysis.og_image_url && { image: { "@type": "ImageObject", url: analysis.og_image_url, width: 1200, height: 630 } }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AI-IDEI", item: "https://ai-idei.com/" },
      { "@type": "ListItem", position: 2, name: typeLabel, item: `https://ai-idei.com/insights` },
      { "@type": "ListItem", position: 3, name: analysis.title },
    ],
  };

  return (
    <>
      <SEOHead
        title={metaTitle}
        description={metaDesc}
        ogImage={analysis.og_image_url || undefined}
        canonical={`https://ai-idei.com/analysis/${slug}`}
        jsonLd={jsonLd}
      />

      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />


      <div className="min-h-screen bg-background">
        {/* Header bar */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">AI-IDEI</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-xs">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
          </div>
        </header>

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Type badge + metadata */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
              {typeLabel}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {publishDate}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {analysis.view_count.toLocaleString()} views
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
            {analysis.title}
          </h1>

          {/* Summary */}
          {analysis.summary && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-[65ch]">
              {analysis.summary}
            </p>
          )}

          {/* Tags */}
          {(analysis.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-8">
              {(analysis.tags ?? []).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/50 mb-8" />

          {/* Content — markdown rendered */}
          <div className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{analysis.content}</ReactMarkdown>
          </div>

          {/* Footer CTA */}
          <div className="mt-12 pt-8 border-t border-border/50">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Generate Your Own Analysis
              </h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                AI-IDEI transforms raw content into structured intelligence — neurons, frameworks, and strategic assets.
              </p>
              <Link to="/auth">
                <Button size="sm" className="gap-1.5">
                  Get Started <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
