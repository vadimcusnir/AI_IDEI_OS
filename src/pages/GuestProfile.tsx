import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, Brain, Quote, Sparkles, Users, MessageCircle, Target, Award } from "lucide-react";
import logo from "@/assets/logo.gif";
import { cn } from "@/lib/utils";

interface GuestData {
  full_name: string;
  role: string;
  bio: string;
  expertise_areas: string[];
  frameworks_mentioned: string[];
  psychological_traits: string[];
  key_quotes: string[];
}

function ExpertiseBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-[10px] font-semibold text-primary">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Derive a pseudo-percentage from expertise position (first = highest)
function deriveExpertiseScores(areas: string[]): { label: string; value: number }[] {
  if (areas.length === 0) return [];
  const base = 95;
  const step = Math.min(12, Math.floor(50 / Math.max(areas.length, 1)));
  return areas.map((area, i) => ({
    label: area,
    value: Math.max(30, base - i * step),
  }));
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
  const expertiseScores = deriveExpertiseScores(guest.expertise_areas);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${guest.full_name} — Expert Profile | AI-IDEI`}
        description={guest.bio?.slice(0, 155) || `Profilul de expert al ${guest.full_name}`}
      />

      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-2xl mx-auto px-6 pt-16 pb-10 relative">
          <div className="text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20 mx-auto mb-5 flex items-center justify-center ring-4 ring-background shadow-lg">
              <span className="text-3xl font-bold text-primary">{initials}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">{guest.full_name}</h1>
            <span className="inline-block mt-1.5 text-[10px] uppercase tracking-[0.2em] text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full">
              {guest.role}
            </span>
            <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
              {guest.bio}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-16 space-y-10">
        {/* Expertise with percentage bars */}
        {expertiseScores.length > 0 && (
          <section>
            <SectionHeader icon={Brain} label="Expertise" />
            <div className="space-y-3 mt-3">
              {expertiseScores.map((item, i) => (
                <ExpertiseBar key={i} label={item.label} value={item.value} />
              ))}
            </div>
          </section>
        )}

        {/* Frameworks & Models */}
        {guest.frameworks_mentioned.length > 0 && (
          <section>
            <SectionHeader icon={Sparkles} label="Frameworks & Modele Mentale" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              {guest.frameworks_mentioned.map((f, i) => (
                <div
                  key={i}
                  className="group px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Communication Style */}
        {guest.psychological_traits.length > 0 && (
          <section>
            <SectionHeader icon={MessageCircle} label="Stil de comunicare" />
            <div className="flex flex-wrap gap-2 mt-3">
              {guest.psychological_traits.map((t, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                    i % 3 === 0 && "bg-primary/10 text-primary",
                    i % 3 === 1 && "bg-accent/15 text-accent-foreground",
                    i % 3 === 2 && "bg-muted text-muted-foreground",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Key Quotes - show all */}
        {guest.key_quotes.length > 0 && (
          <section>
            <SectionHeader icon={Quote} label={`Citate cheie (${guest.key_quotes.length})`} />
            <div className="space-y-3 mt-3">
              {guest.key_quotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="relative pl-4 border-l-2 border-primary/30 py-2"
                >
                  <p className="text-sm italic text-muted-foreground leading-relaxed">"{q}"</p>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Stats summary */}
        <section>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Brain} value={guest.expertise_areas.length} label="Competențe" />
            <StatCard icon={Sparkles} value={guest.frameworks_mentioned.length} label="Frameworks" />
            <StatCard icon={Quote} value={guest.key_quotes.length} label="Citate" />
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <a href="/" className="inline-flex items-center gap-2 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors">
            <img src={logo} className="h-4 w-4 rounded-full" alt="" />
            AI-IDEI Knowledge OS
          </a>
          <p className="text-[9px] text-muted-foreground/30 mt-2">
            Profil generat automat din analiză AI a conținutului public
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </h2>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
