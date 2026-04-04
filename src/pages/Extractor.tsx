import { useState, useEffect, useMemo, useCallback } from "react";
import { ExtractorSkeleton } from "@/components/skeletons/ExtractorSkeleton";
import { GuidedTooltip } from "@/components/onboarding/GuidedTooltip";
import { EXTRACTOR_TOUR } from "@/components/onboarding/tourDefinitions";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageTransition } from "@/components/motion/PageTransition";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";
import { EpisodeCard } from "@/components/extractor/EpisodeCard";
import { useEpisodeActions } from "@/hooks/useEpisodeActions";
import { useUserTier } from "@/hooks/useUserTier";
import { PremiumPaywall } from "@/components/premium/PremiumPaywall";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PipelineWizardStepper, type WizardStep } from "@/components/extractor/PipelineWizardStepper";
import { ResultsPanel } from "@/components/extractor/ResultsPanel";

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tier } = useUserTier();
  const isPro = tier === "pro" || tier === "vip";
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>("upload");
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [lastResult, setLastResult] = useState<{
    neurons: number;
    episode_id: string;
    type_distribution?: Record<string, number>;
    frameworks?: number;
    raw_extracted?: number;
    after_dedup?: number;
    meta?: { major_insights?: string[]; emerging_themes?: string[]; unexpected_ideas?: string[] };
  } | null>(null);

  const episodeParam = searchParams.get("episode");

  const fetchEpisodes = async () => {
    if (!currentWorkspace || !user) return;
    const { data, error } = await supabase
      .from("episodes")
      .select("id, title, status, source_url, source_type, transcript, created_at, updated_at")
      .eq("workspace_id", currentWorkspace.id)
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setEpisodes(data as unknown as Episode[]);
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

  /**
   * Called by InstantActionSurface when pipeline starts processing.
   * Advances wizard to step 2 WITHOUT destroying the component.
   */
  const handlePipelineStart = useCallback(() => {
    setWizardStep("process");
    setCompletedSteps(prev => prev.includes("upload") ? prev : [...prev, "upload"]);
  }, []);

  const handleExtractionComplete = useCallback(() => {
    fetchEpisodes();
  }, [currentWorkspace]);

  const handlePipelineComplete = useCallback((result: typeof lastResult) => {
    setLastResult(result);
    setWizardStep("results");
    setCompletedSteps(["upload", "process"]);
  }, []);

  const handleReset = useCallback(() => {
    setWizardStep("upload");
    setCompletedSteps([]);
    setLastResult(null);
  }, []);

  const stats = useMemo(() => ({
    total: episodes.length,
    transcribed: episodes.filter(e => e.status === "transcribed").length,
    analyzed: episodes.filter(e => e.status === "analyzed").length,
  }), [episodes]);

  if (authLoading || wsLoading || loading) {
    return <ExtractorSkeleton />;
  }

  return (
    <TooltipProvider delayDuration={300}>
    <PageTransition>
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SEOHead title="Extractor — AI-IDEI" description="Încarcă conținut, analizează și extrage cunoștințe structurate." />
        <GuidedTooltip tourId="extractor" steps={EXTRACTOR_TOUR} />

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-[length:var(--eyebrow-size)] font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-[hsl(var(--gold-oxide))] mb-1">
            Knowledge Pipeline
          </p>
          <h1 className="text-h2 font-bold leading-[var(--lh-h2)] text-foreground tracking-tight">
            Upload → Analyze → Results
          </h1>
        </motion.div>

        {/* ── Wizard Stepper ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="mb-8"
        >
          <PipelineWizardStepper current={wizardStep} completedSteps={completedSteps} />
        </motion.div>

        {/* ── SINGLE InstantActionSurface — persists across all wizard steps ── */}
        {wizardStep !== "results" && (
          <div className={wizardStep === "process" ? "max-w-lg mx-auto" : ""}>
            <div className="mb-6">
              <InstantActionSurface
                onComplete={handleExtractionComplete}
                onPipelineStart={handlePipelineStart}
                onPipelineComplete={handlePipelineComplete}
                compact
              />
            </div>
          </div>
        )}

        {/* ── Results Panel ── */}
        <AnimatePresence mode="wait">
          {wizardStep === "results" && lastResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ResultsPanel result={lastResult} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Previous episodes (only in upload step) ── */}
        {wizardStep === "upload" && episodes.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-caption font-semibold text-foreground">
                  Previous Materials
                </p>
                <p className="text-footnote text-muted-foreground">
                  {stats.total} total · {stats.transcribed} transcribed · {stats.analyzed} analyzed
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {episodes.slice(0, 5).map(ep => (
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
              {episodes.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => navigate("/library")}
                >
                  View all {episodes.length} materials →
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {wizardStep === "upload" && episodes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-card border border-dashed border-border rounded-2xl mt-4"
          >
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-[hsl(var(--gold-oxide)/0.4)]" />
            </div>
            <h3 className="text-h3 font-semibold text-foreground mb-2">
              Start your first analysis
            </h3>
            <p className="text-caption text-muted-foreground max-w-sm mx-auto">
              Paste a link, upload a file, or type content above.
            </p>
            <p className="text-footnote text-muted-foreground/50 mt-1">
              YouTube, MP3, MP4, PDF, text
            </p>
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
    <PremiumPaywall open={paywallOpen} onOpenChange={setPaywallOpen} requiredTier="pro" serviceName="Analiză Avansată" />
    </TooltipProvider>
  );
}
