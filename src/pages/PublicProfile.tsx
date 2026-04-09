import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Brain, Sparkles, Globe, FileText } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface ProfileData {
  user_id: string;
  display_name: string;
  bio: string;
  username: string;
  avatar_url?: string;
}

interface PublicArtifact {
  id: string;
  title: string;
  artifact_type: string;
  format: string;
  tags: string[] | null;
  created_at: string;
}

interface PublicAsset {
  id: string;
  title: string;
  asset_type: string;
  price_neurons: number;
  slug: string;
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { t } = useTranslation("pages");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [artifacts, setArtifacts] = useState<PublicArtifact[]>([]);
  const [assets, setAssets] = useState<PublicAsset[]>([]);
  const [neuronCount, setNeuronCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return; }

    (async () => {
      // 1. Lookup profile by username
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, display_name, bio, username, avatar_url")
        .eq("username", username)
        .maybeSingle();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as ProfileData);
      const uid = profileData.user_id;

      // 2. Load public artifacts, assets, neuron count in parallel
      const [artRes, assetRes, neuronRes] = await Promise.all([
        supabase.from("artifacts")
          .select("id, title, artifact_type, format, tags, created_at")
          .eq("author_id", uid)
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("knowledge_assets")
          .select("id, title, asset_type, price_neurons, slug")
          .eq("author_id", uid)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("neurons")
          .select("id", { count: "exact", head: true })
          .eq("author_id", uid)
          .eq("visibility", "public"),
      ]);

      setArtifacts((artRes.data || []) as PublicArtifact[]);
      setAssets((assetRes.data || []) as PublicAsset[]);
      setNeuronCount(neuronRes.count || 0);
      setLoading(false);
    })();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Logo size="h-16 w-16" className="mb-4 opacity-30" />
        <h1 className="text-xl font-bold mb-2">{t("public_profile.not_found_title", { username })}</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
          {t("public_profile.not_found_desc")}
        </p>
        <a href="/" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          {t("public_profile.create_profile")}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${profile.display_name || username} — AI-IDEI`}
        description={profile.bio || "Public profile on AI-IDEI Knowledge OS."}
      />
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-12 sm:pb-16">
        {/* Avatar & Name */}
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 to-ai-accent/20 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
            ) : (
              <Brain className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          {profile.bio && <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{profile.bio}</p>}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-micro bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
              <Brain className="h-3 w-3 text-primary" />
              {neuronCount} neurons
            </span>
            <span className="text-micro bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
              <FileText className="h-3 w-3 text-primary" />
              {artifacts.length} artifacts
            </span>
          </div>
        </div>

        {/* Marketplace Assets */}
        {assets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              {t("public_profile.products_services", "Products & Services")}
            </h2>
            <div className="space-y-2">
              {assets.map(asset => (
                <a
                  key={asset.id}
                  href={`/marketplace/${asset.slug}`}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-primary/25 hover:shadow-md transition-all group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{asset.title}</span>
                    <p className="text-xs text-muted-foreground">{asset.asset_type}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{asset.price_neurons} N</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Public Artifacts */}
        {artifacts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Public Library
            </h2>
            <div className="space-y-1.5">
              {artifacts.map(art => (
                <div key={art.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{art.title || "Untitled"}</p>
                    <p className="text-micro text-muted-foreground">{art.artifact_type} · {art.format}</p>
                  </div>
                  {art.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-nano shrink-0">{tag}</Badge>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {artifacts.length === 0 && assets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">This profile doesn't have public content yet.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <a href="/" className="inline-flex items-center gap-1.5 text-micro text-muted-foreground/50 hover:text-primary transition-colors">
            <Logo size="h-4 w-4" alt="" />
            AI-IDEI Knowledge OS
          </a>
        </div>
      </div>
    </div>
  );
}
