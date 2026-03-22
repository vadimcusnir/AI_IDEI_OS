/**
 * KnowledgeSurfacePage — Public page rendering knowledge surface content
 * with schema.org JSON-LD for SEO/LLM indexation.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, ArrowLeft, Eye, Bot, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface SurfacePage {
  id: string;
  slug: string;
  page_type: string;
  title: string;
  meta_description: string;
  content_md: string;
  entity_ids: string[];
  schema_json: any;
  status: string;
  published_at: string | null;
  view_count: number;
  llm_citation_count: number;
  quality_score: number;
  created_at: string;
}

export default function KnowledgeSurfacePage() {
  const { "*": slugPath } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<SurfacePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slugPath) return;
    const fullSlug = `knowledge/${slugPath}`;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("knowledge_surface_pages")
        .select("*")
        .eq("slug", fullSlug)
        .eq("status", "published")
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data as any);
      }
      setLoading(false);
    };

    load();
  }, [slugPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-muted-foreground">This knowledge page doesn't exist or isn't published yet.</p>
        <Button variant="outline" onClick={() => navigate("/topics")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Explore Topics
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${page.title} | AI-IDEI Knowledge`}
        description={page.meta_description}
        canonical={`https://ai-idei.com/knowledge/${slugPath}`}
      />
      {/* JSON-LD */}
      {page.schema_json && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.schema_json) }}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => navigate("/topics")} className="hover:text-foreground transition-colors">
            Knowledge
          </button>
          <span>/</span>
          <span className="capitalize">{page.page_type}s</span>
          <span>/</span>
          <span className="text-foreground">{page.title}</span>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">{page.page_type}</Badge>
            {page.quality_score > 0 && (
              <Badge variant="secondary" className="text-xs">
                Score: {Number(page.quality_score).toFixed(1)}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground leading-tight">{page.title}</h1>
          {page.meta_description && (
            <p className="text-lg text-muted-foreground leading-relaxed">{page.meta_description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(page.published_at || page.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {page.view_count} views
            </span>
            {page.llm_citation_count > 0 && (
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {page.llm_citation_count} AI citations
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <article className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{page.content_md}</ReactMarkdown>
        </article>

        {/* Footer */}
        <div className="border-t border-border pt-6 mt-8">
          <p className="text-xs text-muted-foreground">
            This page is auto-generated from the AI-IDEI Knowledge Graph.
            Content is continuously refined through AI analysis and expert validation.
          </p>
        </div>
      </div>
    </>
  );
}
