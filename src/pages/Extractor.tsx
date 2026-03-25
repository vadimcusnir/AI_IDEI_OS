import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageTransition } from "@/components/motion/PageTransition";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileText, Loader2, ArrowRight, Youtube, UserCheck, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";
import { EpisodeCard } from "@/components/extractor/EpisodeCard";
import { useEpisodeActions } from "@/hooks/useEpisodeActions";
import { useUserTier } from "@/hooks/useUserTier";
import { FlowTip } from "@/components/onboarding/FlowTip";
import { PremiumPaywall } from "@/components/premium/PremiumPaywall";
import { YouTubeTranscriber } from "@/components/extractor/YouTubeTranscriber";
import { TranscriptHistory } from "@/components/extractor/TranscriptHistory";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ProfileExtractorInline } from "@/components/extractor/ProfileExtractorInline";

interface Episode {
  id: string;
  title: string;
  source_type: string;
  source_url: string | null;
  file_path: string | null;
  status: string;
  transcript: string | null;
  duration_seconds: number | null;
  language: string | null;
  created_at: string;
  metadata: any;
}

type TabKey = "upload" | "youtube" | "profile";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "upload", label: "Încarcă Material", icon: Upload },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "profile", label: "Profil Expert", icon: UserCheck },
];

export default function Extractor() {
  const { t } = useTranslation(["pages", "common", "errors"]);
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tier } = useUserTier();
  const isPro = tier === "pro" || tier === "vip";
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("upload");
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const episodeParam = searchParams.get("episode");

  const fetchEpisodes = async () => {
    if (!currentWorkspace) return;
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setEpisodes(data as Episode[]);
    if (error) toast.error(t("errors:generic"));
    setLoading(false);
  };

  const actions = useEpisodeActions(fetchEpisodes);

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) { setLoading(false); return; }
    fetchEpisodes();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  useEffect(() => {
    if (episodeParam && episodes.length > 0 && !expandedId) {
      const found = episodes.find(e => e.id === episodeParam);
      if (found) setExpandedId(found.id);
    }
  }, [episodeParam, episodes]);

  const handleExtractionComplete = () => {
    setSuccessCount((prev) => (prev ?? 0) + 1);
    fetchEpisodes();
  };

  const stats = {
    total: episodes.length,
    transcribed: episodes.filter(e => e.status === "transcribed").length,
    analyzed: episodes.filter(e => e.status === "analyzed").length,
  };

  if (authLoading || wsLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
    <PageTransition>
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <SEOHead title="Adaugă Material — AI-IDEI" description="Încarcă conținut, transcrie audio/video și pregătește-l pentru generare AI." />

        {/* ── Page Header ── */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-[length:var(--eyebrow-size)] font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-[hsl(var(--gold-oxide))] mb-2">
            Data Input
          </p>
          <h1 className="text-[length:var(--h2-size)] font-bold leading-[var(--lh-h2)] text-foreground tracking-tight">
            Adaugă Material
          </h1>
          <p className="text-[length:var(--secondary-size)] leading-[var(--lh-body)] text-muted-foreground mt-2 max-w-xl">
            Încarcă context brut — texte, video-uri, podcast-uri, profiluri — și pregătește-l pentru generare.
          </p>
        </motion.div>

        {/* ── Success Banner ── */}
        {successCount !== null && successCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-2xl border border-[hsl(var(--gold-oxide)/0.2)] bg-[hsl(var(--gold-oxide)/0.05)] flex items-center gap-5"
          >
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--gold-oxide)/0.1)] flex items-center justify-center shrink-0">
              <ArrowRight className="h-5 w-5 text-[hsl(var(--gold-oxide))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[length:var(--body-dense-size)] font-semibold text-foreground">
                Context analizat. Gata pentru generare.
              </p>
              <p className="text-[length:var(--caption-size)] text-muted-foreground mt-0.5">
                Materialul tău a fost procesat cu succes și este pregătit pentru serviciile AI.
              </p>
            </div>
            <Button onClick={() => navigate("/services")} className="gap-2 shrink-0">
              Mergi la Servicii
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* ── Tab Switcher ── */}
        <div className="flex items-center gap-0.5 border-b border-border mb-8">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-[length:var(--body-dense-size)] font-medium border-b-2 -mb-px transition-all whitespace-nowrap",
                  active
                    ? "text-[hsl(var(--gold-oxide))] border-[hsl(var(--gold-oxide))]"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══ TAB: Upload / Extract ═══ */}
        {activeTab === "upload" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <FlowTip tipId="extractor-intro" variant="info" title="Cum funcționează"
              description="Încarcă un podcast, video sau text → sistemul transcrie automat → apoi poți pregăti conținutul pentru generare."
              show={episodes.length === 0} className="mb-6" />
            <FlowTip tipId="extractor-has-content" variant="next-step" title="Material pregătit"
              description="Ai episoade transcrise. Apasă 'Analizează' pe oricare pentru a-l pregăti pentru servicii."
              show={episodes.length > 0 && episodes.some(e => e.status === "transcribed")}
              className="mb-6" />

            {/* Instant Action Surface */}
            <div className="mb-8">
              <InstantActionSurface onComplete={handleExtractionComplete} compact />
            </div>

            {/* Episode stats bar */}
            {episodes.length > 0 && (
              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-center gap-3 text-[length:var(--caption-size)] text-muted-foreground">
                  <span className="font-semibold text-foreground">{stats.total}</span> materiale
                  <span className="text-border">·</span>
                  <span className="font-semibold text-foreground">{stats.transcribed}</span> transcrise
                  <span className="text-border">·</span>
                  <span className="font-semibold text-foreground">{stats.analyzed}</span> analizate
                </div>
              </div>
            )}

            {/* Empty state */}
            {episodes.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-card border border-dashed border-border rounded-2xl"
              >
                <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center mx-auto mb-5">
                  <FileText className="h-8 w-8 text-[hsl(var(--gold-oxide)/0.4)]" />
                </div>
                <h3 className="text-[length:var(--h3-size)] font-semibold text-foreground mb-2">
                  Niciun material încărcat
                </h3>
                <p className="text-[length:var(--body-dense-size)] text-muted-foreground max-w-sm mx-auto mb-2">
                  Lipește un link, încarcă un fișier sau scrie text direct.
                </p>
                <p className="text-[length:var(--caption-size)] text-muted-foreground/50">
                  YouTube, MP3, MP4, PDF, text
                </p>
              </motion.div>
            )}

            {/* Episodes list */}
            {episodes.length > 0 && (
              <div className="space-y-2">
                {episodes.map(ep => (
                  <EpisodeCard
                    key={ep.id}
                    ep={ep}
                    isExpanded={expandedId === ep.id}
                    isTargeted={ep.id === episodeParam}
                    isPro={isPro}
                    onToggleExpand={() => setExpandedId(expandedId === ep.id ? null : ep.id)}
                    onPaywall={() => setPaywallOpen(true)}
                    actions={actions}
                    episodes={episodes}
                    expandedId={expandedId}
                    setExpandedId={setExpandedId}
                    setEpisodes={setEpisodes}
                    fetchEpisodes={fetchEpisodes}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TAB: YouTube Transcriber ═══ */}
        {activeTab === "youtube" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-8">
            <div className="text-center mb-2">
              <p className="text-[length:var(--eyebrow-size)] font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-[hsl(var(--gold-oxide))] mb-2">
                Transcriere
              </p>
              <h2 className="text-[length:var(--h3-size)] font-bold text-foreground mb-1.5">
                YouTube → Transcript
              </h2>
              <p className="text-[length:var(--body-dense-size)] text-muted-foreground max-w-md mx-auto">
                Lipește un link YouTube și obține transcrierea completă în secunde.
              </p>
            </div>
            {user ? (
              <>
                <YouTubeTranscriber />
                <TranscriptHistory />
              </>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Youtube className="h-7 w-7 text-primary/40" />
                </div>
                <p className="text-[length:var(--body-dense-size)] text-muted-foreground mb-5">
                  Autentifică-te pentru a începe.
                </p>
                <Button onClick={() => navigate("/auth")} className="gap-2">
                  Începe gratuit <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TAB: Profile Extractor ═══ */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <ProfileExtractorInline />
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
    <PremiumPaywall open={paywallOpen} onOpenChange={setPaywallOpen} requiredTier="pro" serviceName="Analiză Avansată" />
    </TooltipProvider>
  );
}
