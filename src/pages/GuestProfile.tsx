import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Brain, Quote, Sparkles, Users } from "lucide-react";
import logo from "@/assets/logo.gif";

interface GuestData {
  full_name: string;
  role: string;
  bio: string;
  expertise_areas: string[];
  frameworks_mentioned: string[];
  psychological_traits: string[];
  key_quotes: string[];
}

export default function GuestProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("guest_profiles")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .limit(1)
        .maybeSingle();

      if (!data || error) {
        setNotFound(true);
      } else {
        setGuest(data as unknown as GuestData);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !guest) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h1 className="text-xl font-serif font-bold mb-2">Profil inexistent</h1>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Acest profil nu există sau nu este public.
        </p>
      </div>
    );
  }

  const initials = guest.full_name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 pt-16 pb-16">
        {/* Avatar */}
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
          <h1 className="text-2xl font-serif font-bold">{guest.full_name}</h1>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{guest.role}</span>
          <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">{guest.bio}</p>
        </div>

        {/* Expertise */}
        {guest.expertise_areas.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <Brain className="h-3 w-3" /> Expertise
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {guest.expertise_areas.map((area, i) => (
                <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Frameworks */}
        {guest.frameworks_mentioned.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Frameworks & Modele
            </h2>
            <div className="space-y-2">
              {guest.frameworks_mentioned.map((f, i) => (
                <div key={i} className="px-4 py-3 rounded-xl border border-border bg-card">
                  <span className="text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Quotes */}
        {guest.key_quotes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <Quote className="h-3 w-3" /> Citate cheie
            </h2>
            <div className="space-y-2">
              {guest.key_quotes.map((q, i) => (
                <blockquote key={i} className="pl-3 border-l-2 border-primary/30 text-sm italic text-muted-foreground py-1">
                  "{q}"
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* Psychological traits */}
        {guest.psychological_traits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Stil comunicare
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {guest.psychological_traits.map((t, i) => (
                <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <a href="/" className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors">
            <img src={logo} className="h-4 w-4 rounded-full" alt="" />
            AI-IDEI Knowledge OS
          </a>
        </div>
      </div>
    </div>
  );
}
