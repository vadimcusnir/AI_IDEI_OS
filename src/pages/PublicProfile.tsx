import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Brain, Sparkles, Mail } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useTranslation } from "react-i18next";

interface ProfileData {
  display_name: string;
  bio: string;
  links: { label: string; url: string }[];
  products: { title: string; price: string; description: string }[];
  neuron_count: number;
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { t } = useTranslation("pages");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(false);
    setNotFound(true);
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Logo size="h-16 w-16" className="mb-4 opacity-30" />
        <h1 className="text-xl font-bold mb-2">{t("public_profile.not_found_title", { username })}</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
          {t("public_profile.not_found_desc")}
        </p>
        <a
          href="/"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t("public_profile.create_profile")}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${profile?.display_name || username} — AI-IDEI`} description={profile?.bio || "Public profile on AI-IDEI Knowledge OS."} />
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-12 sm:pb-16">
        {/* Avatar & Name */}
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 to-ai-accent/20 mx-auto mb-4 flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{profile?.display_name}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{profile?.bio}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-micro bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
              <Brain className="h-3 w-3 text-primary" />
              {profile?.neuron_count || 0} neurons
            </span>
          </div>
        </div>

        {/* Links */}
        {profile?.links && profile.links.length > 0 && (
          <div className="space-y-2 mb-8">
            {profile.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-primary/25 hover:shadow-md transition-all group"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{link.label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Products / Monetization */}
        {profile?.products && profile.products.length > 0 && (
          <div className="mb-8">
            <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              {t("public_profile.products_services")}
            </h2>
            <div className="space-y-2">
              {profile.products.map((product, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{product.title}</span>
                    <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{product.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <a href="/links" className="inline-flex items-center gap-1.5 text-micro text-muted-foreground/50 hover:text-primary transition-colors">
            <Logo size="h-4 w-4" alt="" />
            AI-IDEI Knowledge OS
          </a>
        </div>
      </div>
    </div>
  );
}
