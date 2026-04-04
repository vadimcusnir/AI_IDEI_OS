import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, ExternalLink, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PublicIndicator {
  name: string;
  description: string;
  example: string;
  limitation: string;
}

interface ProfileData {
  id: string;
  profile_type: string;
  source_type: string;
  source_ref: string;
  person_name: string;
  public_slug: string;
  visibility_status: string;
  same_as_urls: string[];
  source_duration_minutes: number | null;
  source_date: string | null;
  intelligence_profile_public: {
    public_indicators: PublicIndicator[];
    public_patterns: string[];
    public_summary: string | null;
    meta_title: string | null;
    meta_description: string | null;
    json_ld: Record<string, unknown> | null;
    published_at: string | null;
  }[];
}

const PROFILE_TYPE_LABELS: Record<string, string> = {
  public_figure: "Public Figure",
  local_figure: "Local Figure",
  anonymized_client: "Anonymous Profile",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  podcast: "Podcast",
  interview: "Interview",
  conversation: "Conversation",
};

const METHODOLOGY_BADGE: Record<string, string> = {
  public_figure: "Analysis from public material",
  local_figure: "Analysis from public content",
  anonymized_client: "Pattern analysis — anonymized",
};

export default function MediaProfilePublic() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("intelligence_profiles")
        .select(`
          id, profile_type, source_type, source_ref, person_name, public_slug,
          visibility_status, same_as_urls, source_duration_minutes, source_date,
          intelligence_profile_public (
            public_indicators, public_patterns, public_summary,
            meta_title, meta_description, json_ld, published_at
          )
        `)
        .eq("public_slug", slug)
        .eq("visibility_status", "published")
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as unknown as ProfileData);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return <Navigate to="/media/profiles" replace />;
  }

  const pub = profile.intelligence_profile_public?.[0];
  const indicators: PublicIndicator[] = (pub?.public_indicators as PublicIndicator[]) || [];
  const displayName = profile.profile_type === "anonymized_client"
    ? "Anonymous Profile"
    : profile.person_name;

  const metaTitle = pub?.meta_title || `${displayName} — Analysis from public material`;
  const metaDesc = pub?.meta_description || `Observational analysis of ${displayName} based on ${SOURCE_TYPE_LABELS[profile.source_type] || "content"}.`;

  // JSON-LD
  const jsonLd = pub?.json_ld || buildJsonLd(profile, displayName);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={metaTitle}
        description={metaDesc}
        canonical={`/media/profiles/${profile.public_slug}`}
      />

      {/* Section 1: Header factual */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link to="/media/profiles" className="hover:text-foreground transition-colors">
              Intelligence Profiles
            </Link>
            <span>/</span>
            <span className="text-foreground">{displayName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{displayName}</h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded bg-muted border border-border">
              {PROFILE_TYPE_LABELS[profile.profile_type] || profile.profile_type}
            </span>
            <span className="px-2 py-0.5 rounded bg-primary/5 text-primary/80 border border-primary/10">
              {METHODOLOGY_BADGE[profile.profile_type] || "Observational analysis"}
            </span>
          </div>
        </div>
      </header>

      {/* Section 2: Material analizat */}
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Analyzed Material
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Type</span>
              <span className="font-medium">{SOURCE_TYPE_LABELS[profile.source_type] || profile.source_type}</span>
            </div>
            {profile.source_duration_minutes && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Duration</span>
                <span className="font-medium">{profile.source_duration_minutes} min</span>
              </div>
            )}
            {profile.source_date && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Date</span>
                <span className="font-medium">{new Date(profile.source_date).toLocaleDateString()}</span>
              </div>
            )}
            {profile.source_ref && profile.source_ref.startsWith("http") && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Source</span>
                <a href={profile.source_ref} target="_blank" rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1">
                  View source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Indicatori extrași */}
      {indicators.length > 0 && (
        <section className="border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
              Extracted Indicators
            </h2>
            <div className="space-y-6">
              {indicators.map((ind, i) => (
                <div key={i} id={`indicator-${ind.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="bg-muted/30 border border-border rounded-lg p-5">
                  <h3 className="text-sm font-semibold mb-2">{ind.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {ind.description}
                  </p>
                  {ind.example && (
                    <blockquote className="text-xs italic border-l-2 border-primary/30 pl-3 mb-3 text-muted-foreground">
                      {ind.example}
                    </blockquote>
                  )}
                  <div className="flex items-start gap-1.5 text-micro text-muted-foreground/60">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{ind.limitation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Profile synthesis */}
      {pub?.public_summary && (
        <section className="border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Profile Synthesis
            </h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {pub.public_summary}
            </div>
          </div>
        </section>
      )}

      {/* Section 5: Methodology */}
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Methodology
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            This profile is generated through automated linguistic and behavioral analysis of publicly available material.
            All indicators are observational and descriptive — they do not imply causation, intent, or psychological diagnosis.
          </p>
          <Link to="/docs" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            How are these profiles generated? <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Section 6: CTA unic (soft) */}
      <section className="bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            See how Intelligence works inside the platform.
          </p>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Explore Intelligence OS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

function buildJsonLd(profile: ProfileData, displayName: string) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${displayName} — Observational Analysis`,
    url: `https://ai-idei.com/media/profiles/${profile.public_slug}`,
    publisher: {
      "@type": "Organization",
      name: "AI-IDEI Intelligence OS",
    },
  };

  if (profile.profile_type !== "anonymized_client") {
    base.about = {
      "@type": "Person",
      name: displayName,
      ...(profile.same_as_urls?.length > 0 ? { sameAs: profile.same_as_urls } : {}),
    };
  }

  if (profile.source_ref?.startsWith("http")) {
    base.isBasedOn = {
      "@type": "CreativeWork",
      url: profile.source_ref,
    };
  }

  return base;
}
