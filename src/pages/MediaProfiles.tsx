import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, ChevronRight, ArrowRight, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { safeJsonLd } from "@/lib/jsonLdSafe";

interface ProfileListItem {
  id: string;
  person_name: string;
  profile_type: string;
  source_type: string;
  public_slug: string;
  source_duration_minutes: number | null;
  intelligence_profile_public: {
    public_indicators: unknown[];
    public_summary: string | null;
  }[];
}

const TYPE_LABELS: Record<string, string> = {
  public_figure: "Public Figure",
  local_figure: "Local Figure",
  anonymized_client: "Anonymous",
};

const SOURCE_LABELS: Record<string, string> = {
  podcast: "Podcast",
  interview: "Interview",
  conversation: "Conversation",
};

export default function MediaProfiles() {
  const { t } = useTranslation("pages");
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("intelligence_profiles")
        .select(`
          id, person_name, profile_type, source_type, public_slug, source_duration_minutes,
          intelligence_profile_public (public_indicators, public_summary)
        `)
        .eq("visibility_status", "published")
        .order("updated_at", { ascending: false });
      setProfiles((data as unknown as ProfileListItem[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = search.trim()
    ? profiles.filter(p =>
        p.person_name.toLowerCase().includes(search.toLowerCase()) ||
        p.profile_type.includes(search.toLowerCase())
      )
    : profiles;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("media_profiles.title", "Intelligence Profiles") + " — AI-IDEI"}
        description="AI-synthesized intelligence profiles: observational analysis of cognitive patterns, decision styles, and behavioral signals from public material."
      />

      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Users className="h-3.5 w-3.5" />
            <span>{t("media_profiles.breadcrumb", "Media")}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{t("media_profiles.breadcrumb_current", "Profiles")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {t("media_profiles.title", "Intelligence Profiles")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-[65ch] leading-relaxed">
            {t("media_profiles.desc", "Observational analysis of public figures, experts, and anonymized case patterns — generated from transcript intelligence.")}
          </p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 text-micro text-muted-foreground overflow-x-auto">
            {["Media", "Transcript", "Signal Extraction", "Indicator Scoring", "Pattern Detection", "Profile Synthesis"].map(
              (step, i, arr) => (
                <span key={step} className="flex items-center gap-2 whitespace-nowrap">
                  <span className={cn("px-2 py-1 rounded", i === arr.length - 1 ? "bg-primary/10 text-primary font-semibold" : "")}>
                    {step}
                  </span>
                  {i < arr.length - 1 && <ChevronRight className="h-3 w-3" />}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("media_profiles.search_placeholder", "Search profiles...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? t("media_profiles.no_match", "No matching profiles") : t("media_profiles.no_profiles", "No published profiles yet")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((profile) => {
              const pub = profile.intelligence_profile_public?.[0];
              const indicatorCount = (pub?.public_indicators as unknown[])?.length || 0;

              return (
                <Link
                  key={profile.id}
                  to={`/media/profiles/${profile.public_slug}`}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {profile.profile_type === "anonymized_client" ? "Anonymous Profile" : profile.person_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[profile.profile_type]} • {SOURCE_LABELS[profile.source_type]}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors mt-0.5" />
                  </div>

                  {pub?.public_summary && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {pub.public_summary}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-micro text-muted-foreground/60">
                    {indicatorCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {indicatorCount} indicators
                      </span>
                    )}
                    {profile.source_duration_minutes && (
                      <span>{profile.source_duration_minutes} min analyzed</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Intelligence Profiles — AI-IDEI",
            description: "Analytical profiles synthesized from transcript intelligence.",
            publisher: { "@type": "Organization", name: "AI-IDEI" },
          }),
        }}
      />
    </div>
  );
}
