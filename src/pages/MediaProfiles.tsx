import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, ChevronRight, ArrowRight, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  slug: string;
  bio: string | null;
  expertise_areas: string[] | null;
  psychological_traits: string[] | null;
  frameworks_mentioned: string[] | null;
  key_quotes: string[] | null;
}

export default function MediaProfiles() {
  const { t } = useTranslation("pages");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("guest_profiles")
        .select("id, full_name, role, slug, bio, expertise_areas, psychological_traits, frameworks_mentioned, key_quotes")
        .eq("is_public", true)
        .order("full_name");
      setProfiles((data as Profile[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = search.trim()
    ? profiles.filter(
        (p) =>
          p.full_name.toLowerCase().includes(search.toLowerCase()) ||
          p.role?.toLowerCase().includes(search.toLowerCase())
      )
    : profiles;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Intelligence Profiles — AI-IDEI" description="AI-synthesized intelligence profiles from real conversations: cognitive patterns, decision styles, strategic behaviors." />
      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Users className="h-3.5 w-3.5" />
            <span>{t("media_profiles.breadcrumb")}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{t("media_profiles.breadcrumb_current")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {t("media_profiles.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-[65ch] leading-relaxed">
            {t("media_profiles.desc")}
          </p>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground overflow-x-auto">
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
            placeholder={t("media_profiles.search_placeholder")}
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
              {search ? t("media_profiles.no_match") : t("media_profiles.no_profiles")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((profile) => (
              <Link
                key={profile.id}
                to={`/guest/${profile.slug}`}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {profile.full_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{profile.role}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors mt-0.5" />
                </div>

                {profile.bio && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {profile.bio}
                  </p>
                )}

                {profile.expertise_areas && profile.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {profile.expertise_areas.slice(0, 4).map((area) => (
                      <span
                        key={area}
                        className="text-[9px] bg-primary/8 text-primary/80 px-1.5 py-0.5 rounded"
                      >
                        {area}
                      </span>
                    ))}
                    {profile.expertise_areas.length > 4 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{profile.expertise_areas.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                  {profile.psychological_traits && (
                    <span>{t("media_profiles.cognitive_signals", { count: profile.psychological_traits.length })}</span>
                  )}
                  {profile.frameworks_mentioned && (
                    <span>{t("media_profiles.frameworks", { count: profile.frameworks_mentioned.length })}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
