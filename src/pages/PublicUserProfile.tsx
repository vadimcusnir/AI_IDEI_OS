import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/shared/Logo";
import {
  Loader2, User, Brain, FileText, Sparkles, Calendar,
  ArrowRight, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AchievementsBadges } from "@/components/profile/AchievementsBadges";
import { useTranslation } from "react-i18next";

interface PublicProfile {
  display_name: string;
  bio: string;
  avatar_url: string;
  username: string;
  created_at: string;
}

interface ProfileStats {
  neurons_count: number;
  artifacts_count: number;
  public_neurons_count: number;
}

export default function PublicUserProfile() {
  const { username } = useParams<{ username: string }>();
  const { t } = useTranslation("pages");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ neurons_count: 0, artifacts_count: 0, public_neurons_count: 0 });
  const [publicNeurons, setPublicNeurons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      const { data: result } = await supabase.rpc("get_public_profile", { _username: username });

      if (!result || !(result as any).found) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const r = result as any;
      setProfile({
        display_name: r.display_name,
        bio: r.bio,
        avatar_url: r.avatar_url,
        username: r.username,
        created_at: r.created_at,
      });
      setPublicNeurons(r.public_neurons || []);
      setStats({
        neurons_count: r.neurons_count || 0,
        artifacts_count: 0,
        public_neurons_count: r.neurons_count || 0,
      });

      setLoading(false);
    };
    load();
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
        <User className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h1 className="text-xl font-bold mb-2">{t("public_user_profile.not_found_title")}</h1>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {t("public_user_profile.not_found_desc", { username })}
        </p>
      </div>
    );
  }

  const initials = profile.display_name
    ?.split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const LIFECYCLE_COLORS: Record<string, string> = {
    ingested: "bg-muted text-muted-foreground",
    structured: "bg-primary/10 text-primary",
    active: "bg-status-validated/10 text-status-validated",
    capitalized: "bg-ai-accent/10 text-ai-accent",
    compounded: "bg-graph-highlight/10 text-graph-highlight",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${profile.display_name || username} — AI-IDEI`}
        description={profile.bio?.slice(0, 155) || `Public profile of ${profile.display_name || username} on AI-IDEI`}
      />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/3" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="text-center">
            <div className="relative inline-block mb-5">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-24 w-24 rounded-full object-cover ring-[3px] ring-primary/20 ring-offset-4 ring-offset-background shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-[3px] ring-primary/20 ring-offset-4 ring-offset-background shadow-lg">
                  <span className="text-3xl font-bold text-primary">{initials}</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {profile.display_name || username}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center justify-center gap-6 mt-6 text-dense text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-primary/60" />
                <strong className="text-foreground">{stats.public_neurons_count}</strong> {t("public_user_profile.public_neurons")}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary/60" />
                {t("public_user_profile.member_since")} <strong className="text-foreground">{memberSince}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 space-y-6 sm:space-y-8">

        <section className="bg-card border border-border rounded-xl p-5">
          <AchievementsBadges />
        </section>

        {publicNeurons.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">{t("public_user_profile.public_knowledge")}</h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-micro text-muted-foreground">{stats.public_neurons_count} neurons</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {publicNeurons.map((neuron) => (
                <Link
                  key={neuron.id}
                  to={`/n/${neuron.number}`}
                  className="group flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <span className="text-micro font-mono font-bold text-muted-foreground group-hover:text-primary">
                      #{neuron.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                      {neuron.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn(
                        "text-nano font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                        LIFECYCLE_COLORS[neuron.lifecycle] || LIFECYCLE_COLORS.ingested
                      )}>
                        {neuron.lifecycle}
                      </span>
                      {neuron.content_category && (
                        <span className="text-nano text-muted-foreground/60 uppercase">
                          {neuron.content_category}
                        </span>
                      )}
                      {neuron.score > 0 && (
                        <span className="text-nano font-mono text-ai-accent ml-auto">
                          ★ {neuron.score}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {publicNeurons.length === 0 && (
          <div className="text-center py-12">
            <Globe className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("public_user_profile.no_public_neurons")}</p>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6 text-center">
          <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="text-sm font-semibold mb-1">{t("public_user_profile.cta_title")}</h3>
          <p className="text-dense text-muted-foreground max-w-sm mx-auto mb-4">
            {t("public_user_profile.cta_desc")}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
          >
            {t("public_user_profile.get_started")} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-border">
          <Link to="/" className="inline-flex items-center gap-2 text-micro text-muted-foreground/50 hover:text-primary transition-colors">
            <Logo size="h-5 w-5" />
            <span className="font-medium">AI-IDEI</span>
            <span className="text-muted-foreground/30">Knowledge OS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
