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

// Inline ProfileExtractor content (no separate page needed)
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
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
    <PageTransition>
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        <SEOHead title="Adaugă Material — AI-IDEI" description="Încarcă conținut, transcrie audio/video și pregătește-l pentru generare AI." />

        {/* Page header — rebranded */}
        <div className="mb-5">
          <h1 className="text-lg font-semibold tracking-tight">Adaugă Material</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Încarcă context brut — texte, video-uri, podcast-uri, profiluri — și pregătește-l pentru generare.
          </p>
        </div>

        {/* Success banner */}
        {successCount !== null && successCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-4"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                ✅ Context analizat. Gata pentru generare.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Materialul tău a fost procesat cu succes și este pregătit pentru serviciile AI.
              </p>
            </div>
            <Button onClick={() => navigate("/services")} className="gap-2 shrink-0">
              Mergi la Servicii
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-1 border-b border-border mb-5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                  active
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══ TAB: Upload / Extract ═══ */}
        {activeTab === "upload" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {/* Flow guidance — rebranded */}
            <FlowTip tipId="extractor-intro" variant="info" title="Cum funcționează"
              description="Încarcă un podcast, video sau text → sistemul transcrie automat → apoi poți pregăti conținutul pentru generare."
              show={episodes.length === 0} className="mb-4" />
            <FlowTip tipId="extractor-has-content" variant="next-step" title="Material pregătit"
              description="Ai episoade transcrise. Apasă 'Analizează' pe oricare pentru a-l pregăti pentru servicii."
              show={episodes.length > 0 && episodes.some(e => e.status === "transcribed")}
              className="mb-4" />

            {/* Instant Action Surface */}
            <div className="mb-6">
              <InstantActionSurface onComplete={handleExtractionComplete} compact />
            </div>

            {/* Episode stats */}
            {episodes.length > 0 && (
              <p className="text-[10px] text-muted-foreground/60 mb-4">
                {stats.total} materiale · {stats.transcribed} transcrise · {stats.analyzed} analizate
              </p>
            )}

            {/* Empty state */}
            {episodes.length === 0 && (
              <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl animate-fade-in">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-7 w-7 text-primary/40" />
                </div>
                <h3 className="text-base font-semibold mb-1.5">Niciun material încărcat</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-1">
                  Lipește un link, încarcă un fișier sau scrie text direct.
                </p>
                <p className="text-xs text-muted-foreground/50">YouTube, MP3, MP4, PDF, text</p>
              </div>
            )}

            {/* Episodes list */}
            {episodes.length > 0 && (
              <div className="space-y-1.5">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold mb-1">YouTube → Transcript</h2>
              <p className="text-sm text-muted-foreground">
                Lipește un link YouTube și obține transcrierea completă în secunde.
              </p>
            </div>
            {user ? (
              <>
                <YouTubeTranscriber />
                <TranscriptHistory />
              </>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
                <Youtube className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Autentifică-te pentru a începe.</p>
                <Button onClick={() => navigate("/auth")} className="gap-2">
                  Începe gratuit <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TAB: Profile Extractor ═══ */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
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
