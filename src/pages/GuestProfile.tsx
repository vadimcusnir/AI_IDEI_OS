import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { PersonJsonLd } from "@/components/seo/JsonLd";
import { RadarChart } from "@/components/intelligence/RadarChart";
import { PsychologicalProfileSection, type PsychologicalProfileData } from "@/components/profile/PsychologicalProfileSection";
import { GuestProfileAdvanced } from "@/components/profile/GuestProfileAdvanced";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2, Brain, Quote, Sparkles, Users, MessageCircle,
  Target, Award, Lightbulb, TrendingUp, ArrowRight, Lock,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface GuestData {
  id: string;
  full_name: string;
  role: string;
  bio: string;
  expertise_areas: string[];
  frameworks_mentioned: string[];
  psychological_traits: string[];
  key_quotes: string[];
  episode_ids: string[];
  author_id: string;
}

/* ── Expertise bars with animated fill ── */
function ExpertiseBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-compact font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
        <span className="text-dense font-bold tabular-nums text-primary">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/50 transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* ── Derive expertise percentages ── */
function deriveExpertiseScores(areas: string[]): { label: string; value: number }[] {
  if (areas.length === 0) return [];
  const base = 96;
  const step = Math.min(10, Math.floor(45 / Math.max(areas.length, 1)));
  return areas.map((area, i) => ({
    label: area,
    value: Math.max(35, base - i * step),
  }));
}

/* ── Stat card ── */
function StatCard({ icon: Icon, value, label, accent }: {
  icon: React.ElementType; value: number; label: string; accent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]",
      accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"
    )}>
      <div className={cn(
        "h-10 w-10 rounded-xl mx-auto mb-3 flex items-center justify-center",
        accent ? "bg-primary/15" : "bg-muted"
      )}>
        <Icon className={cn("h-5 w-5", accent ? "text-primary" : "text-muted-foreground")} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-dense text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

/* ── Section divider ── */
function SectionHeader({ icon: Icon, label, count }: {
  icon: React.ElementType; label: string; count?: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          {label}
          {count !== undefined && (
            <span className="ml-2 text-micro font-normal text-muted-foreground">({count})</span>
          )}
        </h2>
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ── Paywall overlay ── */
function PaywallSection({ children, title, premiumDesc, previewLabel }: { children: React.ReactNode; title: string; premiumDesc: string; previewLabel: string }) {
  const [unlocked, setUnlocked] = useState(false);
  if (unlocked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-50">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-2xl">
        <div className="text-center space-y-3 max-w-xs">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-dense text-muted-foreground leading-relaxed">
            {premiumDesc}
          </p>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setUnlocked(true)}>
            <Sparkles className="h-3 w-3" /> {previewLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Quotes with expand ── */
function QuotesSection({ quotes, authorName, showAllLabel, sectionLabel }: { quotes: string[]; authorName: string; showAllLabel: string; sectionLabel: string }) {
  const [showAll, setShowAll] = useState(false);
  const FREE_LIMIT = 3;
  const visible = showAll ? quotes : quotes.slice(0, FREE_LIMIT);
  const hasMore = quotes.length > FREE_LIMIT;

  return (
    <section>
      <SectionHeader icon={Quote} label={sectionLabel} count={quotes.length} />
      <div className="space-y-4">
        {visible.map((q, i) => (
          <blockquote key={i} className="relative rounded-2xl border border-border bg-card p-5 pl-6 hover:border-primary/20 transition-colors">
            <div className="absolute top-4 left-5 text-primary/10 text-4xl leading-none select-none">"</div>
            <p className="relative text-sm italic text-foreground/80 leading-relaxed pl-4">{q}</p>
            <div className="flex items-center gap-2 mt-3 pl-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-nano text-muted-foreground/50 uppercase tracking-wider">— {authorName}</span>
            </div>
          </blockquote>
        ))}
        {hasMore && !showAll && (
          <div className="text-center">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowAll(true)}>
              <Quote className="h-3 w-3" /> {showAllLabel}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Main component ── */
export default function GuestProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("pages");
  const { user } = useAuth();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [psychProfile, setPsychProfile] = useState<PsychologicalProfileData | null>(null);
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
        const { data: pp } = await supabase
          .from("psychological_profiles" as any)
          .select("*")
          .eq("guest_profile_id", data.id)
          .maybeSingle();
        if (pp) setPsychProfile(pp as unknown as PsychologicalProfileData);
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
        <h1 className="text-xl font-bold mb-2">{t("guest_profile.not_found_title")}</h1>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {t("guest_profile.not_found_desc")}
        </p>
      </div>
    );
  }

  const initials = guest.full_name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const expertiseScores = deriveExpertiseScores(guest.expertise_areas);
  const totalInsights = guest.expertise_areas.length + guest.frameworks_mentioned.length + guest.key_quotes.length;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${guest.full_name} — Expert Profile | AI-IDEI`}
        description={guest.bio?.slice(0, 155) || `Expert profile of ${guest.full_name}`}
      />
      <PersonJsonLd
        name={guest.full_name}
        jobTitle={guest.role}
        bio={guest.bio}
        expertise={guest.expertise_areas}
        url={`https://ai-idei.com/guests/${slug}`}
      />

      {/* ═══════ HERO ═══════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-10 sm:pb-14">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/40 via-primary/15 to-accent/20 flex items-center justify-center ring-[3px] ring-primary/20 ring-offset-4 ring-offset-background shadow-xl">
                <span className="text-4xl font-bold text-primary">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-status-validated flex items-center justify-center ring-2 ring-background">
                <Award className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {guest.full_name}
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-micro uppercase tracking-[0.25em] font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">
                {guest.role}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-5 max-w-lg mx-auto leading-relaxed">
              {guest.bio}
            </p>

            <div className="flex items-center justify-center gap-6 mt-6 text-dense text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-primary/60" />
                <strong className="text-foreground">{guest.expertise_areas.length}</strong> {t("guest_profile.competences")}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                <strong className="text-foreground">{guest.frameworks_mentioned.length}</strong> {t("guest_profile.frameworks")}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-primary/60" />
                <strong className="text-foreground">{guest.key_quotes.length}</strong> {t("guest_profile.quotes")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 space-y-10 sm:space-y-12">

        {expertiseScores.length > 0 && (
          <section>
            <SectionHeader icon={Brain} label={t("guest_profile.expertise_title")} count={expertiseScores.length} />
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              {expertiseScores.map((item, i) => (
                <ExpertiseBar key={i} label={item.label} value={item.value} delay={150 + i * 100} />
              ))}
            </div>
          </section>
        )}

        {/* Advanced Psychological Profile (owner sees full controls, visitors see results) */}
        <section>
          <SectionHeader icon={Brain} label={t("guest_profile.deep_psych")} />
          <GuestProfileAdvanced
            guestId={guest.id}
            guestName={guest.full_name}
            episodeIds={guest.episode_ids || []}
            isOwner={user?.id === guest.author_id}
          />
        </section>

        {!psychProfile && guest.psychological_traits.length >= 3 && (
          <section>
            <SectionHeader icon={Brain} label={t("guest_profile.psych_profile")} count={guest.psychological_traits.length} />
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-center">
              <RadarChart
                data={guest.psychological_traits.slice(0, 8).map((trait, i) => ({
                  label: trait.length > 14 ? trait.slice(0, 12) + "…" : trait,
                  value: Math.max(30, 95 - i * 8),
                }))}
                size={280}
              />
            </div>
          </section>
        )}

        {guest.frameworks_mentioned.length > 0 && (
          <section>
            <SectionHeader icon={Sparkles} label={t("guest_profile.frameworks_title")} count={guest.frameworks_mentioned.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guest.frameworks_mentioned.map((f, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-tight">{f}</h3>
                      <p className="text-micro text-muted-foreground mt-1.5 leading-relaxed">
                        {t("guest_profile.framework_default_desc")}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-3.5 w-3.5 text-primary/40" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {guest.psychological_traits.length > 0 && (
          <PaywallSection
            title={t("guest_profile.communication_profile")}
            premiumDesc={t("guest_profile.premium_desc")}
            previewLabel={t("guest_profile.preview_premium")}
          >
            <section>
              <SectionHeader icon={MessageCircle} label={t("guest_profile.communication_section")} count={guest.psychological_traits.length} />
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap gap-2.5">
                  {guest.psychological_traits.map((trait, i) => {
                    const styles = [
                      "bg-primary/10 text-primary border-primary/15",
                      "bg-status-validated/10 text-status-validated border-status-validated/15",
                      "bg-graph-highlight/10 text-graph-highlight border-graph-highlight/15",
                      "bg-muted text-muted-foreground border-border",
                    ];
                    return (
                      <span key={i} className={cn(
                        "text-xs px-3.5 py-2 rounded-xl font-medium border transition-transform hover:scale-105",
                        styles[i % styles.length]
                      )}>{trait}</span>
                    );
                  })}
                </div>
              </div>
            </section>
          </PaywallSection>
        )}

        {guest.key_quotes.length > 0 && (
          <QuotesSection
            quotes={guest.key_quotes}
            authorName={guest.full_name}
            sectionLabel={t("guest_profile.memorable_quotes")}
            showAllLabel={t("guest_profile.show_all_quotes", { count: guest.key_quotes.length })}
          />
        )}

        <section>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Brain} value={guest.expertise_areas.length} label={t("guest_profile.competences")} accent />
            <StatCard icon={Sparkles} value={guest.frameworks_mentioned.length} label={t("guest_profile.frameworks")} />
            <StatCard icon={Lightbulb} value={totalInsights} label={t("guest_profile.total_insights")} />
          </div>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6 text-center">
          <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground mb-1">{t("guest_profile.cta_title")}</h3>
          <p className="text-dense text-muted-foreground max-w-sm mx-auto mb-4">
            {t("guest_profile.cta_desc")}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
          >
            {t("guest_profile.cta_link")} <ArrowRight className="h-3 w-3" />
          </a>
        </section>

        <div className="text-center pt-6 border-t border-border">
          <a href="/" className="inline-flex items-center gap-2 text-micro text-muted-foreground/50 hover:text-primary transition-colors">
            <Logo size="h-5 w-5" />
            <span className="font-medium">AI-IDEI</span>
            <span className="text-muted-foreground/30">Knowledge OS</span>
          </a>
        </div>
      </div>
    </div>
  );
}
