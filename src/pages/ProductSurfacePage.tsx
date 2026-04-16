/**
 * ProductSurfacePage — Public product page with schema.org structured data.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, ArrowLeft, CheckCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface ProductPage {
  id: string;
  slug: string;
  product_key: string;
  title: string;
  tagline: string;
  description_md: string;
  features: any[];
  use_cases: any[];
  schema_json: any;
  og_image_url: string;
  status: string;
  published_at: string | null;
  view_count: number;
  created_at: string;
}

export default function ProductSurfacePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("product_surface_pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      setPage(data as any);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
      </div>
    );
  }

  const features = (page.features as any[]) || [];
  const useCases = (page.use_cases as any[]) || [];

  return (
    <>
      <SEOHead
        title={`${page.title} | AI-IDEI`}
        description={page.tagline || page.title}
        canonical={`https://ai-idei.com/products/${slug}`}
      />
      {page.schema_json && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(page.schema_json)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-xs">{page.product_key}</Badge>
          <h1 className="text-4xl font-bold text-foreground">{page.title}</h1>
          {page.tagline && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{page.tagline}</p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Button onClick={() => navigate("/auth")} className="gap-2">
              <Zap className="h-4 w-4" /> Get Started Free
            </Button>
            <Button variant="outline" onClick={() => navigate("/docs")}>
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Features</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((f: any, i: number) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold">{f.title || f.name || `Feature ${i + 1}`}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.description || f.text || ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Use Cases */}
        {useCases.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Use Cases</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {useCases.map((uc: any, i: number) => (
                <div key={i} className="bg-muted/30 rounded-xl p-5 space-y-2 text-center">
                  <h3 className="text-sm font-semibold">{uc.title || uc.name || `Use Case ${i + 1}`}</h3>
                  <p className="text-xs text-muted-foreground">{uc.description || uc.text || ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {page.description_md && (
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{page.description_md}</ReactMarkdown>
          </article>
        )}

        {/* CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Transform Your Expertise?</h2>
          <p className="text-muted-foreground">Start extracting knowledge and generating content in minutes.</p>
          <Button onClick={() => navigate("/auth")} size="lg" className="gap-2">
            <Zap className="h-4 w-4" /> Start Free
          </Button>
        </div>
      </div>
    </>
  );
}
