import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Users, Eye, EyeOff, ExternalLink, Brain,
  Sparkles, Quote, Search, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestProfile {
  id: string;
  full_name: string;
  slug: string;
  role: string;
  bio: string;
  expertise_areas: string[];
  frameworks_mentioned: string[];
  psychological_traits: string[];
  key_quotes: string[];
  episode_ids: string[];
  is_public: boolean;
  created_at: string;
}

export default function GuestPages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    loadGuests();
  }, [user, authLoading]);

  const loadGuests = async () => {
    const { data, error } = await supabase
      .from("guest_profiles")
      .select("*")
      .eq("author_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setGuests(data as unknown as GuestProfile[]);
    if (error) toast.error("Eroare la încărcarea profilelor");
    setLoading(false);
  };

  const togglePublic = async (guest: GuestProfile) => {
    const { error } = await supabase
      .from("guest_profiles")
      .update({ is_public: !guest.is_public } as any)
      .eq("id", guest.id);
    if (error) { toast.error("Eroare"); return; }
    setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, is_public: !g.is_public } : g));
    toast.success(guest.is_public ? "Profil ascuns" : "Profil publicat");
  };

  const filtered = search.trim()
    ? guests.filter(g => g.full_name.toLowerCase().includes(search.toLowerCase()))
    : guests;

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <SEOHead title="Guest Pages — AI-IDEI" description="Manage auto-generated guest profiles extracted from your transcriptions." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Guest Pages</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {guests.length} profile
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6 max-w-lg">
          Profile auto-generate din transcrierile tale. Fiecare persoană menționată primește o pagină cu bio, expertise, framework-uri și citate cheie.
        </p>

        {/* Search */}
        <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 mb-6 max-w-xs">
          <Search className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Caută persoane..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-10 w-10 opacity-20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              {guests.length === 0
                ? "Niciun profil guest încă. Rulează extracția pe un episod pentru a detecta participanții."
                : "Niciun rezultat pentru căutare."
              }
            </p>
            {guests.length === 0 && (
              <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/extractor")}>
                Mergi la Extractor
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(guest => (
              <div
                key={guest.id}
                className={cn(
                  "rounded-xl border bg-card p-4 transition-all cursor-pointer hover:border-primary/30 hover:shadow-sm",
                  selectedGuest?.id === guest.id ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                )}
                onClick={() => setSelectedGuest(selectedGuest?.id === guest.id ? null : guest)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {guest.full_name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{guest.full_name}</h3>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{guest.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {guest.is_public ? (
                      <Eye className="h-3 w-3 text-status-validated" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-muted-foreground/40" />
                    )}
                    <Switch
                      checked={guest.is_public}
                      onCheckedChange={() => togglePublic(guest)}
                      className="scale-75"
                    />
                  </div>
                </div>

                {/* Bio */}
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{guest.bio}</p>

                {/* Tags */}
                {guest.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {guest.expertise_areas.slice(0, 4).map((area, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {area}
                      </span>
                    ))}
                    {guest.expertise_areas.length > 4 && (
                      <span className="text-[9px] text-muted-foreground/50">+{guest.expertise_areas.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground/60">
                  <span className="flex items-center gap-0.5">
                    <Brain className="h-2.5 w-2.5" />
                    {guest.frameworks_mentioned?.length || 0} frameworks
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Quote className="h-2.5 w-2.5" />
                    {guest.key_quotes?.length || 0} citate
                  </span>
                  <span>{guest.episode_ids?.length || 0} episoade</span>
                </div>

                {/* Expanded detail */}
                {selectedGuest?.id === guest.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    {guest.frameworks_mentioned.length > 0 && (
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                          Frameworks
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {guest.frameworks_mentioned.map((f, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {guest.psychological_traits.length > 0 && (
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                          Trăsături
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {guest.psychological_traits.map((t, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {guest.key_quotes.length > 0 && (
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                          Citate cheie
                        </span>
                        <div className="space-y-1">
                          {guest.key_quotes.map((q, i) => (
                            <p key={i} className="text-[10px] italic text-muted-foreground pl-2 border-l-2 border-primary/20">
                              "{q}"
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {guest.is_public && (
                      <a
                        href={`/guest/${guest.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Vizualizează pagina publică
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
