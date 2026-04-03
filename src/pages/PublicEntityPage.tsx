/**
 * PublicEntityPage — Lightweight read-only viewer for public entities.
 * Loaded WITHOUT heavy Auth/Workspace providers via a separate route tree.
 * Optimized for SEO: injects structured data + full OG meta.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface PublicEntity {
  id: string;
  slug: string;
  title: string;
  entity_type: string;
  description: string | null;
  summary: string | null;
  meta_description: string | null;
  json_ld: any;
  updated_at: string;
  created_at: string;
  importance_score: number | null;
  confidence_score: number | null;
  evidence_count: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  insight: "Insight",
  pattern: "Pattern",
  formula: "Formulă",
  contradiction: "Contradicție",
  application: "Aplicare",
  profile: "Profil",
};

export default function PublicEntityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [entity, setEntity] = useState<PublicEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, slug, title, entity_type, description, summary, meta_description, json_ld, updated_at, created_at, importance_score, confidence_score, evidence_count")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setEntity(data as PublicEntity);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !entity) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <SEOHead title="Nu a fost găsit — AI-IDEI" description="Pagina nu există." />
        <h1 className="text-2xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-4">Această entitate nu există sau nu este publică.</p>
        <Button asChild variant="outline">
          <Link to="/">Pagina principală</Link>
        </Button>
      </div>
    );
  }

  const seoDescription = entity.meta_description || entity.summary || entity.description?.slice(0, 160) || entity.title;
  const typeLabel = TYPE_LABELS[entity.entity_type] || entity.entity_type;

  // Build JSON-LD
  const jsonLd = entity.json_ld || {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": entity.title,
    "description": seoDescription,
    "datePublished": entity.created_at,
    "dateModified": entity.updated_at,
    "publisher": {
      "@type": "Organization",
      "name": "AI-IDEI",
      "url": "https://ai-idei.com",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${entity.title} — ${typeLabel} — AI-IDEI`}
        description={seoDescription}
        canonical={`https://ai-idei.com/knowledge/${entity.slug}`}
      />

      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Minimal navigation bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
            <BookOpen className="h-4 w-4 text-primary" />
            AI-IDEI
          </Link>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link to={`/auth?redirect=${encodeURIComponent(`/knowledge/${slug}`)}`}>
              Conectează-te <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> Înapoi
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-[10px]">{typeLabel}</Badge>
          {entity.importance_score != null && entity.importance_score > 0.7 && (
            <Badge variant="outline" className="text-[9px] text-primary border-primary/30">Important</Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">{entity.title}</h1>

        {entity.summary && (
          <p className="text-base text-muted-foreground mb-6 leading-relaxed italic">
            {entity.summary}
          </p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-8">
          <span>Actualizat: {format(new Date(entity.updated_at), "dd MMM yyyy")}</span>
          {entity.confidence_score != null && (
            <span>Încredere: {Math.round(entity.confidence_score * 100)}%</span>
          )}
          {entity.evidence_count != null && entity.evidence_count > 0 && (
            <span>{entity.evidence_count} surse</span>
          )}
        </div>

        {entity.description && (
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{entity.description}</ReactMarkdown>
          </article>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
          <h2 className="text-lg font-bold mb-2">Descoperă mai mult cu AI-IDEI</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Accesează librăria completă de cunoștințe, generează materiale marketing și transformă expertiza în active digitale.
          </p>
          <Button asChild>
            <Link to={`/auth?mode=signup&redirect=${encodeURIComponent(`/knowledge/${slug}`)}`}>Creează cont gratuit</Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AI-IDEI · <Link to="/terms" className="hover:text-foreground">Termeni</Link> · <Link to="/privacy" className="hover:text-foreground">Confidențialitate</Link>
        </div>
      </footer>
    </div>
  );
}
