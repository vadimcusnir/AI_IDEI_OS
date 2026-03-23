import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageTransition } from "@/components/motion/PageTransition";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileText, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";
import { EpisodeCard } from "@/components/extractor/EpisodeCard";
import { useEpisodeActions } from "@/hooks/useEpisodeActions";
import { useUserTier } from "@/hooks/useUserTier";
import { FlowTip } from "@/components/onboarding/FlowTip";
import { PremiumPaywall } from "@/components/premium/PremiumPaywall";

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

export default function Extractor() {
  const { t } = useTranslation(["pages", "common", "errors"]);
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const [searchParams] = useSearchParams();
  const { tier } = useUserTier();
  const isPro = tier === "pro" || tier === "vip";
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <SEOHead title="Extractor — AI-IDEI" description="Upload content, transcribe audio/video, and extract knowledge neurons using AI." />

        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-lg font-semibold tracking-tight">{t("extractor.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("extractor.subtitle")}</p>
        </div>

        {/* Flow guidance */}
        <FlowTip tipId="extractor-intro" variant="info" title="How the Extractor works"
          description="Upload a podcast, video, or text → the system transcribes it automatically → then you can extract knowledge neurons from the transcript."
          show={episodes.length === 0} className="mb-4" />
        <FlowTip tipId="extractor-has-content" variant="next-step" title="Ready to extract knowledge?"
          description="You have transcribed episodes. Click 'Extract' on any episode to generate neurons."
          show={episodes.length > 0 && episodes.some(e => e.status === "transcribed")}
          action={{ label: "What are neurons?", route: "/docs/foundation/neuron-model" }} className="mb-4" />

        {/* Instant Action Surface */}
        <div className="mb-6">
          <InstantActionSurface onComplete={fetchEpisodes} compact />
        </div>

        {/* Episode stats */}
        {episodes.length > 0 && (
          <p className="text-[10px] text-muted-foreground/60 mb-4">
            {stats.total} episodes · {stats.transcribed} transcribed · {stats.analyzed} analyzed
          </p>
        )}

        {/* Empty state */}
        {episodes.length === 0 && (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl animate-fade-in">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-primary/40" />
            </div>
            <h3 className="text-base font-semibold mb-1.5">{t("extractor.no_episodes")}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-1">{t("extractor.no_episodes_hint")}</p>
            <p className="text-xs text-muted-foreground/50">{t("extractor.supported_formats")}</p>
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
      </div>
    </div>
    </PageTransition>
    <PremiumPaywall open={paywallOpen} onOpenChange={setPaywallOpen} requiredTier="pro" serviceName="Deep Extract & Guest Detection" />
    </TooltipProvider>
  );
}
